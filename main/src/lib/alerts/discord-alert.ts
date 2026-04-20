/**
 * Discord 봇 기반 장애 알림.
 *
 * 목적: 기존 error_logs 테이블/PostHog 로 수집되는 에러 중 "사람이 즉시 봐야 하는" 것만
 *       Discord 채널에 실시간 통지. Sentry 대체재로 최소 기능 구현.
 *
 * 봇 인프라 재활용: 기존 src/lib/discord/client.ts + DISCORD_BOT_TOKEN +
 * DISCORD_OPS_DASHBOARD_CHANNEL_ID 사용. 별도 웹훅 URL 불필요.
 *
 * 채널 override 원할 경우 DISCORD_ALERT_CHANNEL_ID 로 ops 가 아닌 전용 채널 지정 가능.
 *
 * 제한:
 * - 프로덕션에서만 전송 (NODE_ENV === 'production')
 * - 봇 토큰 or 채널 ID 미설정 시 silent no-op
 * - 동일 에러 지문(fingerprint) 1분당 1회 rate limit — 알림 스팸 방지
 * - fire-and-forget: 실패해도 원 플로우 영향 없음
 */

import { sendChannelEmbed } from '@/src/lib/discord/client'

type AlertSeverity = 'critical' | 'error' | 'warning'

interface AlertPayload {
  severity: AlertSeverity
  title: string
  message: string
  context?: Record<string, unknown>
  url?: string            // 에러 발생 라우트
  release?: string        // git SHA / 배포 식별자
  userId?: string
}

// fingerprint → 마지막 전송 시각 (in-memory, 인스턴스별)
// serverless 환경에서 인스턴스가 자주 쿨다운되므로 장기 dedup 은 미보장.
// 1분 단위 flood 방지 목적으로는 충분.
const recentAlerts = new Map<string, number>()
const DEDUP_WINDOW_MS = 60_000
const MAX_MAP_SIZE = 500

function lazyCleanup() {
  if (recentAlerts.size < MAX_MAP_SIZE) return
  const now = Date.now()
  for (const [key, ts] of recentAlerts.entries()) {
    if (now - ts > DEDUP_WINDOW_MS) recentAlerts.delete(key)
  }
}

// djb2 해시 — sha1 대체. 알림 dedup 에만 쓰이므로 충돌 저항성 불필요, Edge 호환 필수.
function fingerprint(title: string, message: string): string {
  const src = title + '::' + message
  let h = 5381
  for (let i = 0; i < src.length; i++) {
    h = (h * 33) ^ src.charCodeAt(i)
  }
  // unsigned 32bit 로 정규화 후 hex
  return (h >>> 0).toString(16).padStart(8, '0')
}

const SEVERITY_COLOR: Record<AlertSeverity, number> = {
  critical: 0xb91c1c,  // red-700
  error: 0xea580c,     // orange-600
  warning: 0xca8a04,   // yellow-600
}

/**
 * 알림 대상 채널 ID 결정.
 * 우선순위: 전용 알림 채널 → 운영 대시보드 채널 → null (no-op)
 */
function resolveAlertChannel(): string | null {
  return (
    process.env.DISCORD_ALERT_CHANNEL_ID ||
    process.env.DISCORD_OPS_DASHBOARD_CHANNEL_ID ||
    null
  )
}

/**
 * Discord 봇으로 알림 전송.
 * 프로덕션 외에선 no-op. 실패해도 throw 안 함.
 */
export async function sendAlert(payload: AlertPayload): Promise<void> {
  if (process.env.NODE_ENV !== 'production') return
  if (!process.env.DISCORD_BOT_TOKEN) return

  const channelId = resolveAlertChannel()
  if (!channelId) return

  const fp = fingerprint(payload.title, payload.message)
  const lastSent = recentAlerts.get(fp) ?? 0
  if (Date.now() - lastSent < DEDUP_WINDOW_MS) return

  lazyCleanup()
  recentAlerts.set(fp, Date.now())

  const fields = [
    payload.url ? { name: 'Route', value: payload.url.slice(0, 1024), inline: true } : null,
    payload.userId ? { name: 'User', value: payload.userId.slice(0, 1024), inline: true } : null,
    payload.release ? { name: 'Release', value: payload.release.slice(0, 1024), inline: true } : null,
    payload.context
      ? {
          name: 'Context',
          value: '```json\n' + JSON.stringify(payload.context, null, 2).slice(0, 900) + '\n```',
        }
      : null,
  ].filter((f): f is { name: string; value: string; inline?: boolean } => f !== null)

  try {
    await sendChannelEmbed(channelId, {
      embeds: [
        {
          title: `[${payload.severity.toUpperCase()}] ${payload.title}`.slice(0, 256),
          description: payload.message.slice(0, 2000),
          color: SEVERITY_COLOR[payload.severity],
          timestamp: new Date().toISOString(),
          fields,
          footer: {
            text: `Draft · ${process.env.VERCEL_ENV ?? 'unknown-env'}`,
          },
        },
      ],
    })
  } catch {
    // fire-and-forget — 알림 실패가 원 플로우에 영향 주지 않음
  }
}

/**
 * 현재 배포의 git SHA 반환. Vercel 자동 env.
 * 로컬 개발에선 'dev' 리터럴.
 */
export function getReleaseTag(): string {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)
    ?? process.env.GIT_COMMIT_SHA?.slice(0, 7)
    ?? 'dev'
  )
}
