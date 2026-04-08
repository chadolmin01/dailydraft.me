import { NextRequest, NextResponse } from 'next/server'
import { captureServerError } from './server'
import { ApiResponse } from '@/src/lib/api-utils'

/**
 * API 라우트 핸들러를 감싸 unhandled error를 PostHog로 자동 전송.
 *
 * 사용법:
 *   export const POST = withErrorCapture(async (req) => {
 *     // ... 핸들러 본문
 *     return ApiResponse.ok({ ... })
 *   })
 *
 * - 핸들러가 throw하면 PostHog $exception 이벤트로 전송하고 500 응답
 * - 핸들러가 정상 응답을 반환하면 그대로 통과 (성공/실패 4xx 모두)
 * - 모든 API route에 일괄 적용 가능 — try/catch 보일러플레이트 제거
 */

type RouteContext = { params: Promise<Record<string, string | string[]>> }
type RouteHandler<C = RouteContext> = (
  req: NextRequest,
  context: C,
) => Promise<NextResponse> | NextResponse

export function withErrorCapture<C = RouteContext>(handler: RouteHandler<C>): RouteHandler<C> {
  return async (req, context) => {
    try {
      return await handler(req, context)
    } catch (error) {
      const route = new URL(req.url).pathname
      // PostHog 전송 — flush까지 await
      await captureServerError(error, {
        route,
        extra: {
          method: req.method,
          userAgent: req.headers.get('user-agent') ?? undefined,
        },
      }).catch(() => {})
      return ApiResponse.internalError()
    }
  }
}
