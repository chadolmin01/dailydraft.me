// V2 minimal stub — V1 의 server.ts 는 error_logs DB 테이블 + Discord webhook 알림에 의존.
// V2 가 그 테이블 / 알림 채널을 갖기 전까지는 no-op. PostHog 로 직접 캡처만 한다.
// 필요한 시점에 v1/src/lib/posthog/server.ts 참조해서 확장.

import { PostHog } from 'posthog-node'

let posthogClient: PostHog | null = null

function getServerPostHog(): PostHog | null {
  if (typeof window !== 'undefined') return null
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
  if (!key) return null
  if (!posthogClient) {
    posthogClient = new PostHog(key, { host, flushAt: 1, flushInterval: 0 })
  }
  return posthogClient
}

export interface ServerErrorContext {
  route?: string
  userId?: string
  extra?: Record<string, unknown>
}

export async function captureServerError(error: unknown, context: ServerErrorContext = {}): Promise<void> {
  const client = getServerPostHog()
  if (!client) return
  try {
    client.captureException(error as Error, context.userId, {
      route: context.route,
      ...context.extra,
    })
    await client.flush()
  } catch {}
}

export async function captureServerEvent(
  event: string,
  properties: Record<string, unknown> & { userId?: string } = {},
): Promise<void> {
  const client = getServerPostHog()
  if (!client) return
  try {
    const { userId, ...rest } = properties
    client.capture({
      distinctId: userId || 'server',
      event,
      properties: rest,
    })
    await client.flush()
  } catch {}
}

export async function captureAndLog(error: unknown, context: ServerErrorContext = {}): Promise<void> {
  await captureServerError(error, context)
}
