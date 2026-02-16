import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { geminiRateLimiter } from '@/src/lib/ai/rate-limiter';
import { classifyEventTags } from '@/src/lib/ai/event-tag-classifier';
import { generateEventEmbedding } from '@/src/lib/ai/embeddings';
import { getKSTDate } from '@/src/lib/utils';
import type { TransformedEvent, SyncResult } from '@/src/types/startup-events';

/**
 * Smart sync: 마감된 이벤트와 이미 수집된 이벤트는 AI 처리 스킵
 */
export async function syncEventsToDatabase(
  events: TransformedEvent[]
): Promise<SyncResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const result: SyncResult = {
    new_events: 0,
    updated_events: 0,
    expired_events: 0,
    skipped_events: 0,
    errors: [],
  };

  const today = getKSTDate();

  // 1. 마감된 이벤트 필터링
  const activeEvents = events.filter(e => e.registration_end_date >= today);
  const expiredCount = events.length - activeEvents.length;
  result.skipped_events = expiredCount;

  if (activeEvents.length === 0) {
    await markExpiredEvents(supabase, result);
    return result;
  }

  // 2. 이미 수집된 이벤트 확인
  const externalIds = activeEvents.map(e => e.external_id);
  const { data: existingEvents } = await supabase
    .from('startup_events')
    .select('external_id')
    .in('external_id', externalIds);

  const existingIds = new Set(existingEvents?.map(e => e.external_id) || []);

  // 3. 새 이벤트만 필터링
  const newEvents = activeEvents.filter(e => !existingIds.has(e.external_id));
  const alreadyExistsCount = activeEvents.length - newEvents.length;
  result.skipped_events += alreadyExistsCount;

  // 4. 새 이벤트만 AI 처리
  for (const event of newEvents) {
    try {

      // Tag classification
      const tags = await geminiRateLimiter.schedule(() =>
        classifyEventTags(event)
      );

      // Embedding generation
      const embedding = await geminiRateLimiter.schedule(() =>
        generateEventEmbedding({
          title: event.title,
          organizer: event.organizer,
          event_type: event.event_type,
          description: event.description,
          interest_tags: tags,
        })
      );

      // Insert new event
      const { error } = await supabase
        .from('startup_events')
        .insert([{
          ...event,
          interest_tags: tags,
          content_embedding: embedding,
          last_synced_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      result.new_events++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push({
        external_id: event.external_id,
        error: errorMessage,
      });
    }
  }

  // 5. 만료된 이벤트 상태 업데이트
  await markExpiredEvents(supabase, result);

  return result;
}

/**
 * DB에서 마감된 이벤트들을 expired 상태로 변경
 */
async function markExpiredEvents(
  supabase: SupabaseClient,
  result: SyncResult
) {
  try {
    const today = getKSTDate();

    const { data: expiredEvents, error } = await supabase
      .from('startup_events')
      .update({ status: 'expired' })
      .lt('registration_end_date', today)
      .eq('status', 'active')
      .select('id');

    if (error) throw error;

    result.expired_events = expiredEvents?.length || 0;
  } catch (error) {
    result.errors.push({
      error: `만료 처리 실패: ${error}`,
    });
  }
}
