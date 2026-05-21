/**
 * (채널, 패턴) 쌍의 수락률 기반 자동 억제
 *
 * 연구 기본선 (Asia Pacific Ed Review 2025, BJET 2025):
 *   수락률 < 40% 이면 해당 패턴은 해당 채널에서 방해 신호 → 자동으로 Push 끔.
 *   cold-start 오판 방지를 위해 최소 샘플 5개부터 적용.
 *
 * 저장소: 별도 테이블 없이 bot_interventions 집계 쿼리.
 * 캐시: 인메모리 10분 TTL — 같은 (채널, 패턴)에 대한 쿼리 폭주 방지.
 *
 * 쿼리 성능:
 *   - (discord_channel_id, pattern_type, created_at DESC) 복합 인덱스 활용
 *     (마이그레이션 20260418130000 에서 추가).
 *   - 최근 7일만 스캔하므로 채널당 행 수 수백 이하 예상.
 */

import { getBotSupabase } from './supabase-client';
import type { PatternType } from './types';

interface CacheEntry {
  rate: number;
  sampleSize: number;
  checkedAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10분
const cache = new Map<string, CacheEntry>();

function cacheKey(channelId: string, pattern: PatternType): string {
  return `${channelId}:${pattern}`;
}

/**
 * 최근 7일 (채널, 패턴) 수락률 조회.
 * sampleSize = accepted + dismissed (ignored는 "반응 안 함"이라 판단 불가, 제외)
 */
export async function getAcceptanceRate(
  channelId: string,
  pattern: PatternType,
  windowDays = 7,
): Promise<{ rate: number; sampleSize: number }> {
  const key = cacheKey(channelId, pattern);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) {
    return { rate: cached.rate, sampleSize: cached.sampleSize };
  }

  try {
    const supabase = getBotSupabase();
    if (!supabase) return { rate: 0, sampleSize: 0 };
    const since = new Date(
      Date.now() - windowDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await supabase
      .from('bot_interventions')
      .select('user_response')
      .eq('discord_channel_id', channelId)
      .eq('pattern_type', pattern)
      .gte('created_at', since);

    if (error || !data) {
      console.error('[acceptance-tracker] 조회 실패:', error?.message);
      return { rate: 0, sampleSize: 0 };
    }

    let accepted = 0;
    let dismissed = 0;
    for (const row of data) {
      if (row.user_response === 'accepted') accepted++;
      else if (row.user_response === 'dismissed') dismissed++;
    }
    const sampleSize = accepted + dismissed;
    const rate = sampleSize === 0 ? 0 : accepted / sampleSize;

    cache.set(key, { rate, sampleSize, checkedAt: Date.now() });
    return { rate, sampleSize };
  } catch (err) {
    console.error('[acceptance-tracker] 예외:', err);
    return { rate: 0, sampleSize: 0 };
  }
}

/**
 * 이 패턴을 이 채널에서 자동 억제할지 판단.
 * 샘플 부족하면 무조건 허용 (false = 억제 안 함).
 */
export async function shouldAutoSuppress(
  channelId: string,
  pattern: PatternType,
  threshold: number,
  minSample: number,
): Promise<boolean> {
  const { rate, sampleSize } = await getAcceptanceRate(channelId, pattern);
  if (sampleSize < minSample) return false;
  return rate < threshold;
}

/**
 * 새 intervention 이 기록되면 해당 키의 캐시를 무효화.
 * 봇 엔진이 saveIntervention 직후 호출.
 */
export function invalidateAcceptanceCache(
  channelId: string,
  pattern: PatternType,
): void {
  cache.delete(cacheKey(channelId, pattern));
}
