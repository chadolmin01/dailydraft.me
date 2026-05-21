import { NextRequest, NextResponse } from 'next/server'
import { captureAndLog, type ServerErrorContext } from './server'
import { ApiResponse } from '@/src/lib/api-utils'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'

/**
 * API 라우트 핸들러를 감싸 unhandled error를 PostHog + error_logs DB로 자동 전송.
 *
 * 사용법:
 *   export const POST = withErrorCapture(async (req) => {
 *     // ... 핸들러 본문
 *     return ApiResponse.ok({ ... })
 *   })
 *
 * - 핸들러가 throw하면 PostHog `$exception` + `error_logs` insert 후 500 응답
 * - 정상 응답은 그대로 통과
 * - 캡처 실패는 사용자 응답에 영향 없음 (fail-safe)
 *
 * 자동 수집 컨텍스트:
 *   route, method, query, ip, userAgent, userId (Supabase), sanitized body, durationMs
 *
 * 의도적으로 throw하지 않고 catch 내부에서 처리하는 코드(비즈니스 분기)는
 * 영향을 받지 않는다 — 이 래퍼는 bubble up된 throw만 가로챈다.
 */

// Next.js 15 route validator는 두번째 인자의 params를 Promise<any>로 기대.
// optional(?:)이나 union(| undefined)이 있으면 "invalid export" 에러 발생.
// any로 느슨하게 열어두고 각 핸들러에서 실제 params 타입을 좁혀 사용.
type RouteContext = { params: Promise<any> }
// Response를 허용하는 이유: 스트리밍 라우트(`new Response(stream)`)가 NextResponse가 아닌 전역 Response를 반환.
type HandlerReturn = Response | NextResponse | Promise<Response | NextResponse>
type RouteHandler<C extends RouteContext = RouteContext> = (
  req: NextRequest,
  context: C,
) => HandlerReturn

async function buildContext(req: NextRequest, startedAt: number): Promise<ServerErrorContext> {
  const url = new URL(req.url)
  const route = url.pathname
  const query: Record<string, unknown> = {}
  url.searchParams.forEach((v, k) => {
    query[k] = v
  })

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    undefined
  const userAgent = req.headers.get('user-agent') ?? undefined

  // Try to parse JSON body — clone first so handler can still read it.
  // NOTE: withErrorCapture runs before handler reads body; we clone here so
  // both paths can consume the body without conflict.
  let requestBody: Record<string, unknown> | undefined
  try {
    const contentType = req.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const cloned = req.clone()
      requestBody = await cloned.json()
    }
  } catch {
    // body might not be JSON or already consumed — silently skip
  }

  // userId — best-effort. Failures ignored.
  let userId: string | undefined
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase.auth.getUser()
    userId = data.user?.id
  } catch {
    // ignore
  }

  return {
    route,
    method: req.method,
    query,
    ip,
    userAgent,
    userId,
    requestBody,
    durationMs: Date.now() - startedAt,
    source: 'api',
  }
}

export function withErrorCapture<C extends RouteContext = RouteContext>(
  handler: RouteHandler<C>,
): (req: NextRequest, context: C) => Promise<Response | NextResponse> {
  return async (req, context) => {
    const startedAt = Date.now()
    try {
      return await handler(req, context)
    } catch (error) {
      try {
        const ctx = await buildContext(req, startedAt)
        await captureAndLog(error, { ...ctx, statusCode: 500 }).catch(() => {})
      } catch {
        // context build 자체 실패해도 사용자 응답은 보호
      }
      return ApiResponse.internalError()
    }
  }
}
