/**
 * Next.js 전역 instrumentation — onRequestError 훅으로 서버측 에러를 단일 지점에서 포착.
 *
 * 왜 필요한가:
 * - withErrorCapture 는 API 라우트만 감싼다.
 * - Server Component / RSC 렌더 중 발생하는 throw, generateMetadata, generateStaticParams,
 *   Server Action, middleware 경로의 에러는 커버되지 않아 "조용한 장애" 가능.
 * - onRequestError 는 Next.js 가 위 모든 경로를 중앙에서 잡아주는 공식 훅.
 *   → captureAndLog 로 넘겨 PostHog + error_logs + Discord 알림 3중 기록.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation#onrequesterror-optional
 */

export async function register() {
  // 현재 SDK 초기화 작업 없음 — 필요해지면 여기에 추가.
  // Sentry/OpenTelemetry 정식 SDK 도입 시 이 함수에서 init.
}

type RequestErrorContext = {
  routerKind: 'Pages Router' | 'App Router'
  routePath: string
  routeType: 'render' | 'route' | 'action' | 'middleware'
}

type RequestInfo = {
  path: string
  method: string
  headers: Record<string, string | string[] | undefined>
}

export async function onRequestError(
  error: unknown,
  request: RequestInfo,
  context: RequestErrorContext,
): Promise<void> {
  // Edge 런타임에서는 스킵 — captureAndLog 체인이 discord-alert(node:crypto) 를 끌어들여
  // Edge 번들에서 UnhandledSchemeError 발생. middleware 에러는 별도 경로로 커버.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  try {
    // 동적 import — top-level 에 두면 Edge 번들이 node:crypto 를 번들링하려다 깨진다.
    const { captureAndLog } = await import('@/src/lib/posthog/server')

    const headers = request.headers ?? {}
    const xff = headers['x-forwarded-for']
    const ip = Array.isArray(xff)
      ? xff[0]?.split(',')[0]?.trim()
      : xff?.split(',')[0]?.trim()

    await captureAndLog(error, {
      route: request.path,
      method: request.method,
      source: context.routeType === 'middleware' ? 'middleware' : 'api',
      ip,
      userAgent:
        (Array.isArray(headers['user-agent']) ? headers['user-agent'][0] : headers['user-agent']) ??
        undefined,
      extra: {
        routerKind: context.routerKind,
        routeType: context.routeType,
        routePath: context.routePath,
      },
    })
  } catch {
    // 훅 자체 실패가 원 에러를 덮어쓰지 않도록 fail-safe
  }
}
