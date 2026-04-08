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
 */
export function captureServerError(
  error: unknown,
  context: {
    route: string
    userId?: string
    extra?: Record<string, unknown>
  }
) {
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
}
