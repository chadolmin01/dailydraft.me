/**
 * Discord Signals — 실시간 비즈니스 이벤트 알림
 *
 * 목적: PostHog 대시보드 없이도 \"지금 무슨 일이\" 바로 감 잡기.
 *   개발자 본인만 보는 개인 Discord 채널 웹훅으로 발송.
 *
 * 기존 인프라:
 *   - `src/lib/alerts/discord-alert.ts` — 서버 5xx 에러 알림 (운영 모니터링)
 *   - `/api/cron/matching-digest` — 어제 요약 일 1회 (집계)
 *   이 모듈은 그 사이 빈칸 — 실시간 비즈니스 이벤트 1건 = 알림 1건.
 *
 * 철학:
 *   - 실패해도 호출자 흐름 안 막음 (try/catch 전부 swallow)
 *   - URL 미설정 시 조용히 skip (env 없어도 앱 동작)
 *   - 노이즈 관리: 필요하면 kind 별 필터 / severity 추가 가능
 *   - PII 최소 — nickname/title 만, 이메일·전화·user_id 는 tooltip 수준으로만
 */

const WEBHOOK_URL = process.env.DISCORD_MATCHING_DIGEST_URL
// DISCORD_SIGNALS_URL 를 별도로 줄 수도 있지만 지금은 재사용. 노이즈 심해지면 env 분리.

export type SignalKind =
  | 'match_apply'      // 지원 생성
  | 'new_user'         // 온보딩 완료
  | 'new_project'      // 프로젝트(opportunity) 등록
  | 'coffee_chat'      // 커피챗 신청
  | 'new_club'         // 클럽 claim 제출

interface SignalPayload {
  /** 한 줄 제목 (이모지 포함) */
  title: string
  /** 본문 내용 (Discord embed description) */
  description?: string
  /** 색상 — kind 별 자동. override 가능. */
  color?: number
  /** key-value 필드 — 1-2 줄짜리 보조 정보 */
  fields?: Array<{ name: string; value: string; inline?: boolean }>
  /** footer 텍스트 (ex. 프로젝트 ID, link) */
  footer?: string
}

const COLORS: Record<SignalKind, number> = {
  match_apply:  0x5E6AD2, // brand (Electric Indigo)
  new_user:     0x34C759, // success green
  new_project:  0xFF9500, // orange — growth signal
  coffee_chat:  0xA855F7, // purple — soft conversion
  new_club:     0x06B6D4, // cyan — B2B
}

/**
 * Discord 채널에 시그널 발송.
 * 무조건 fire-and-forget — 호출자는 await 해도 되지만 기본은 Promise 무시 OK.
 *
 * @example
 *   void postSignal('match_apply', {
 *     title: '⚡ 새 지원',
 *     description: '@김OO → "FLIP 웹사이트" 88%',
 *     fields: [
 *       { name: '스킬', value: '95', inline: true },
 *       { name: '관심', value: '75', inline: true },
 *     ],
 *   })
 */
export async function postSignal(
  kind: SignalKind,
  payload: SignalPayload,
): Promise<void> {
  if (!WEBHOOK_URL) return // 미설정 — skip

  try {
    const body = {
      embeds: [
        {
          title: payload.title,
          description: payload.description,
          color: payload.color ?? COLORS[kind],
          fields: payload.fields,
          footer: payload.footer ? { text: payload.footer } : undefined,
          timestamp: new Date().toISOString(),
        },
      ],
    }

    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      // Discord 웹훅 실패는 치명적이지 않음 — 로깅만.
      // 429 (rate limit) 는 흔함 — 백오프 로직 없이 무시 (시그널 1개 손실 허용).
      console.error('[discord-signals] webhook failed:', res.status)
    }
  } catch (e) {
    // 네트워크 / 파싱 에러 등 — 조용히 로그만
    console.error('[discord-signals] post error:', e)
  }
}
