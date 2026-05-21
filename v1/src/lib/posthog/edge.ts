/**
 * Edge runtime(middleware)에서 PostHog `$exception` 이벤트 전송.
 *
 * Edge에서는 posthog-node가 무겁고 Node 전용 모듈(fs 등)에 의존할 수 있어
 * 사용 불가. PostHog HTTP Capture API를 직접 POST 해 우회한다.
 *
 * fire-and-forget — 캡처 실패가 middleware 흐름을 절대 막지 않는다.
 */
export async function captureEdgeError(
  error: unknown,
  context: {
    route: string
    method?: string
    ip?: string
    userAgent?: string
    extra?: Record<string, unknown>
  },
): Promise<void> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return

  const err = error instanceof Error ? error : new Error(String(error))

  try {
    await fetch('https://us.i.posthog.com/capture/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        event: '$exception',
        distinct_id: 'edge-middleware',
        properties: {
          $exception_type: err.name,
          $exception_message: err.message,
          $exception_stack: err.stack,
          source: 'middleware',
          route: context.route,
          method: context.method,
          ip: context.ip,
          userAgent: context.userAgent,
          ...context.extra,
        },
        timestamp: new Date().toISOString(),
      }),
    })
  } catch {
    // fail-safe
  }
}
