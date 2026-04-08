import { PostHog } from 'posthog-node'

let _client: PostHog | null = null

function getClient(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null
  if (_client) return _client
  _client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: 'https://us.i.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  })
  return _client
}

/**
 * 서버사이드 에러를 PostHog로 전송
 * API 라우트 catch 블록에서 호출
 *
 * Vercel serverless에서 응답 반환 직후 함수가 frozen되면 fire-and-forget HTTP가
 * 끊겨 캡처가 누락됨. flush()를 await해서 전송 보장.
 */
export async function captureServerError(
  error: unknown,
  context: {
    route: string
    userId?: string
    extra?: Record<string, unknown>
  }
): Promise<void> {
  const client = getClient()
  if (!client) return

  const err = error instanceof Error ? error : new Error(String(error))

  const distinctId = context.userId ?? 'server'

  client.capture({
    distinctId,
    event: '$exception',
    properties: {
      $exception_type: err.name,
      $exception_message: err.message,
      $exception_stack: err.stack,
      route: context.route,
      ...context.extra,
    },
  })

  // Vercel serverless 안전장치 — 전송 완료까지 대기
  try {
    await client.flush()
  } catch {
    // flush 실패해도 호출자 흐름은 보호
  }
}
