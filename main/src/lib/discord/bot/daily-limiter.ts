/**
 * 채널별 일일 Push 개입 상한
 *
 * 연구 권장선(Haiilo 2026 디지털 피로 + Discord 커뮤니티 가이드): 채널당 하루 2~3회.
 * 기존 CooldownGuard는 (채널, 패턴) 단위 쿨다운만 추적하므로, 서로 다른 패턴이
 * 겹쳐 발동하면 상한 없이 누적될 수 있습니다. 이 모듈이 그 총량을 제한합니다.
 *
 * 저장소: 별도 테이블 없이 bot_interventions 테이블을 그대로 쿼리.
 *   - 인덱스 idx_bot_interventions_channel(channel, created_at DESC) 재사용.
 *   - KST midnight 이후 행 카운트만 필요하므로 집계 비용 낮음.
 */

import { getBotSupabase } from './supabase-client';

/** KST 기준 오늘 00:00 (UTC Date 객체 반환) */
function kstMidnight(): Date {
  const now = new Date();
  // UTC hour + 9 가 현재 KST hour. KST 기준 00:00 = UTC 15:00 (전날).
  // 더 안전하게 KST offset을 계산:
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kstNow.setUTCHours(0, 0, 0, 0);
  return new Date(kstNow.getTime() - 9 * 60 * 60 * 1000);
}

/**
 * 이 채널에서 오늘(KST) Push 개입을 추가로 보낼 수 있는지 여부.
 * bot_interventions 행 수를 카운트해 limit 미만이면 true.
 */
export async function canPushToday(
  channelId: string,
  limit: number,
): Promise<boolean> {
  try {
    const supabase = getBotSupabase();
    if (!supabase) return true; // DB 없으면 제한 적용 X (개발/로컬 환경)
    const since = kstMidnight().toISOString();

    const { count, error } = await supabase
      .from('bot_interventions')
      .select('id', { count: 'exact', head: true })
      .eq('discord_channel_id', channelId)
      .eq('trigger_type', 'ai_detect') // 수동 슬래시/마무리 요약은 상한에서 제외
      .gte('created_at', since);

    if (error) {
      console.error('[daily-limiter] 조회 실패:', error.message);
      // 안전 fallback: DB 장애 시에는 허용 (과도한 차단 방지)
      return true;
    }
    return (count ?? 0) < limit;
  } catch (err) {
    console.error('[daily-limiter] 예외:', err);
    return true;
  }
}
