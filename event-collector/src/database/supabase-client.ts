/**
 * Supabase 클라이언트
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ProcessedEvent, StartupEvent, TransformedEvent } from '../types/index.js';
import { getKSTDate } from '../utils/index.js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Supabase 클라이언트 가져오기
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
}

/**
 * 이미 존재하는 이벤트 ID 조회
 */
export async function getExistingEventIds(
  externalIds: string[]
): Promise<Set<string>> {
  if (externalIds.length === 0) {
    return new Set();
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('startup_events')
    .select('external_id')
    .in('external_id', externalIds);

  if (error) {
    throw new Error(`Failed to fetch existing events: ${error.message}`);
  }

  return new Set(data?.map((e) => e.external_id) || []);
}

/**
 * 새 이벤트 삽입
 */
export async function insertEvent(event: ProcessedEvent): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('startup_events').insert([
    {
      ...event,
      status: 'active',
      last_synced_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    throw new Error(`Failed to insert event: ${error.message}`);
  }
}

/**
 * 여러 이벤트 일괄 삽입
 */
export async function insertEventsBatch(events: ProcessedEvent[]): Promise<{
  inserted: number;
  errors: Array<{ external_id: string; error: string }>;
}> {
  if (events.length === 0) {
    return { inserted: 0, errors: [] };
  }

  const supabase = getSupabaseClient();
  const errors: Array<{ external_id: string; error: string }> = [];
  let inserted = 0;

  // 배치 크기 제한 (Supabase 권장)
  const BATCH_SIZE = 50;

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE).map((event) => ({
      ...event,
      status: 'active' as const,
      last_synced_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('startup_events').insert(batch);

    if (error) {
      // 개별 삽입 시도
      for (const event of events.slice(i, i + BATCH_SIZE)) {
        try {
          await insertEvent(event);
          inserted++;
        } catch (e) {
          errors.push({
            external_id: event.external_id,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
    } else {
      inserted += batch.length;
    }
  }

  return { inserted, errors };
}

/**
 * 만료된 이벤트 상태 업데이트
 */
export async function markExpiredEvents(): Promise<number> {
  const supabase = getSupabaseClient();
  const today = getKSTDate();

  const { data, error } = await supabase
    .from('startup_events')
    .update({ status: 'expired' })
    .lt('registration_end_date', today)
    .eq('status', 'active')
    .select('id');

  if (error) {
    throw new Error(`Failed to mark expired events: ${error.message}`);
  }

  return data?.length || 0;
}

/**
 * 소스별 이벤트 수 조회
 */
export async function getEventCountBySource(): Promise<Record<string, number>> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('startup_events')
    .select('source')
    .eq('status', 'active');

  if (error) {
    throw new Error(`Failed to get event counts: ${error.message}`);
  }

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    counts[row.source] = (counts[row.source] || 0) + 1;
  }

  return counts;
}

/**
 * 이벤트 조회 (테스트용)
 */
export async function getEvents(options: {
  source?: string;
  status?: string;
  limit?: number;
}): Promise<StartupEvent[]> {
  const supabase = getSupabaseClient();

  let query = supabase.from('startup_events').select('*');

  if (options.source) {
    query = query.eq('source', options.source);
  }
  if (options.status) {
    query = query.eq('status', options.status);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get events: ${error.message}`);
  }

  return data || [];
}
