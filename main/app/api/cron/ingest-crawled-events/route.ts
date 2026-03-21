import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/src/lib/api-utils';
import { geminiRateLimiter } from '@/src/lib/ai/rate-limiter';
import { classifyEventTags } from '@/src/lib/ai/event-tag-classifier';
import { generateEventEmbedding } from '@/src/lib/ai/embeddings';
import {
  filterPersonalInfo,
  createDataProvenance,
} from '@/src/lib/events/legal-compliance';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for processing

// Valid crawled sources
const VALID_CRAWLED_SOURCES = [
  'contestkorea',
  'linkareer',
  'onoffmix',
  'devpost',
  'instagram',
  'facebook',
  'twitter',
] as const;

type CrawledSource = typeof VALID_CRAWLED_SOURCES[number];

interface CrawledEvent {
  external_id: string;
  source: CrawledSource;
  title: string;
  organizer: string;
  description: string | null;
  event_type: string;
  start_date: string | null;
  end_date: string | null;
  registration_start_date: string | null;
  registration_end_date: string;
  registration_url: string | null;
  target_audience: string | null;
  status: 'active' | 'expired' | 'closed';
  raw_data: Record<string, unknown> | null;
}

interface IngestResult {
  source: CrawledSource;
  received: number;
  new_events: number;
  updated_events: number;
  skipped_events: number;
  errors: Array<{ external_id?: string; error: string }>;
}

/**
 * Ingest crawled events from external crawler service
 * POST /api/cron/ingest-crawled-events
 *
 * Body: {
 *   source: 'contestkorea' | 'linkareer' | 'onoffmix' | 'devpost' | ...
 *   events: CrawledEvent[]
 *   skipAI?: boolean  // Skip AI tagging for faster ingestion
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return ApiResponse.internalError('Server configuration error');
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return ApiResponse.unauthorized();
    }

    // 2. Parse request body
    const body = await request.json();
    const { source, events, skipAI = false } = body as {
      source: CrawledSource;
      events: CrawledEvent[];
      skipAI?: boolean;
    };

    // Validate source
    if (!VALID_CRAWLED_SOURCES.includes(source)) {
      return ApiResponse.badRequest(`Invalid source: ${source}. Valid sources: ${VALID_CRAWLED_SOURCES.join(', ')}`);
    }

    // Validate events array
    if (!Array.isArray(events) || events.length === 0) {
      return ApiResponse.badRequest('Events array is required and must not be empty');
    }

    // 3. Process events
    const result = await ingestEvents(source, events, { skipAI });

    // 4. Generate notifications for new events
    let notificationsCreated = 0;
    if (result.new_events > 0) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: notifResult } = await supabase.rpc('generate_deadline_notifications');
        notificationsCreated = notifResult || 0;
      } catch {
        // Notification generation failed, continue
      }
    }

    const duration = Date.now() - startTime;

    return ApiResponse.ok({
      success: true,
      timestamp: new Date().toISOString(),
      result: {
        ...result,
        notifications_created: notificationsCreated,
      },
      duration_ms: duration,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return ApiResponse.internalError('이벤트 수집 처리 중 오류가 발생했습니다.');
  }
}

/**
 * Ingest events from crawler into database
 * 법적 준수: 개인정보 필터링 및 데이터 출처 기록
 */
async function ingestEvents(
  source: CrawledSource,
  events: CrawledEvent[],
  options: { skipAI: boolean }
): Promise<IngestResult> {
  // 데이터 출처 기록 (법적 방어)
  const provenance = createDataProvenance(
    `crawler:${source}`,
    source,
    {
      dataType: 'public_webpage',
      robotsAllowed: true, // 외부 크롤러에서 이미 확인됨
    }
  );
  console.log(`[Ingest] 데이터 출처:`, provenance);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const result: IngestResult = {
    source,
    received: events.length,
    new_events: 0,
    updated_events: 0,
    skipped_events: 0,
    errors: [],
  };

  // Filter out expired events
  const today = new Date().toISOString().split('T')[0];
  const activeEvents = events.filter(e =>
    e.registration_end_date && e.registration_end_date >= today
  );
  result.skipped_events = events.length - activeEvents.length;

  // 개인정보 필터링 적용
  const sanitizedEvents = activeEvents.map(sanitizeCrawledEvent);

  if (sanitizedEvents.length === 0) {
    return result;
  }

  // Get existing events
  const externalIds = sanitizedEvents.map(e => e.external_id);
  const { data: existingEvents } = await supabase
    .from('startup_events')
    .select('external_id')
    .in('external_id', externalIds);

  const existingIds = new Set(existingEvents?.map(e => e.external_id) || []);

  // Process new events
  const newEvents = sanitizedEvents.filter(e => !existingIds.has(e.external_id));
  const updateEvents = sanitizedEvents.filter(e => existingIds.has(e.external_id));

  // Insert new events
  for (const event of newEvents) {
    try {
      let tags: string[] = [];
      let embedding: number[] | null = null;

      // AI processing (unless skipped)
      if (!options.skipAI) {
        try {
          // Create TransformedEvent for AI processing
          const transformedEvent = {
            external_id: event.external_id,
            source: event.source,
            title: event.title,
            organizer: event.organizer,
            description: event.description,
            event_type: event.event_type as '사업화' | '시설·공간' | '행사·네트워크' | '글로벌' | '창업교육',
            start_date: event.start_date,
            end_date: event.end_date,
            registration_start_date: event.registration_start_date,
            registration_end_date: event.registration_end_date,
            registration_url: event.registration_url,
            views_count: 0,
            target_audience: event.target_audience,
            raw_data: event.raw_data || {},
          };

          tags = await geminiRateLimiter.schedule(() =>
            classifyEventTags(transformedEvent)
          );

          embedding = await geminiRateLimiter.schedule(() =>
            generateEventEmbedding({
              title: event.title,
              organizer: event.organizer,
              event_type: transformedEvent.event_type,
              description: event.description,
              interest_tags: tags,
            })
          );
        } catch (aiError) {
          // AI processing failed, continue without tags/embedding
          console.error(`AI processing failed for ${event.external_id}:`, aiError);
        }
      }

      const { error } = await supabase
        .from('startup_events')
        .insert({
          external_id: event.external_id,
          source: event.source,
          title: event.title,
          organizer: event.organizer,
          description: event.description,
          event_type: event.event_type,
          start_date: event.start_date,
          end_date: event.end_date,
          registration_start_date: event.registration_start_date,
          registration_end_date: event.registration_end_date,
          registration_url: event.registration_url,
          target_audience: event.target_audience,
          status: event.status,
          raw_data: event.raw_data,
          interest_tags: tags.length > 0 ? tags : null,
          content_embedding: embedding,
          last_synced_at: new Date().toISOString(),
        });

      if (error) throw error;
      result.new_events++;

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      result.errors.push({
        external_id: event.external_id,
        error: errMsg,
      });
    }
  }

  // Update existing events (basic info only, preserve AI data)
  for (const event of updateEvents) {
    try {
      const { error } = await supabase
        .from('startup_events')
        .update({
          title: event.title,
          organizer: event.organizer,
          description: event.description,
          event_type: event.event_type,
          start_date: event.start_date,
          end_date: event.end_date,
          registration_start_date: event.registration_start_date,
          registration_end_date: event.registration_end_date,
          registration_url: event.registration_url,
          target_audience: event.target_audience,
          status: event.status,
          raw_data: event.raw_data,
          last_synced_at: new Date().toISOString(),
        })
        .eq('external_id', event.external_id);

      if (error) throw error;
      result.updated_events++;

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      result.errors.push({
        external_id: event.external_id,
        error: errMsg,
      });
    }
  }

  // Mark old events as expired
  try {
    await supabase
      .from('startup_events')
      .update({ status: 'expired' })
      .eq('source', source)
      .eq('status', 'active')
      .lt('registration_end_date', today);
  } catch {
    // Continue even if expiration fails
  }

  return result;
}

/**
 * Health check and info endpoint
 * GET /api/cron/ingest-crawled-events
 */
export async function GET() {
  return ApiResponse.ok({
    status: 'ready',
    valid_sources: VALID_CRAWLED_SOURCES,
    timestamp: new Date().toISOString(),
    legal_compliance: {
      personal_info_filtering: true,
      data_provenance_logging: true,
      original_url_preserved: true,
    },
  });
}

/**
 * 크롤링된 이벤트 데이터 정화 (법적 준수)
 * - 개인정보 필터링
 * - raw_data 최소화 (저작권 보호)
 */
function sanitizeCrawledEvent(event: CrawledEvent): CrawledEvent {
  return {
    ...event,
    // 개인정보 필터링 적용
    title: filterPersonalInfo(event.title),
    organizer: filterPersonalInfo(event.organizer),
    description: event.description ? filterPersonalInfo(event.description) : null,
    target_audience: event.target_audience ? filterPersonalInfo(event.target_audience) : null,
    // raw_data 최소화 (저작권 보호)
    raw_data: event.raw_data ? {
      source_url: (event.raw_data as Record<string, unknown>).source_url,
      crawled_at: (event.raw_data as Record<string, unknown>).crawled_at,
      // 전체 HTML/원본 데이터는 저장하지 않음
    } : null,
  };
}
