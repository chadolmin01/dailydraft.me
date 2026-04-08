import { NextRequest } from 'next/server'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { logError } from '@/src/lib/error-logging'
import { ApiResponse } from '@/src/lib/api-utils'

/**
 * 브라우저 에러를 받아 `error_logs` DB에 기록.
 * PostHog 전송은 클라이언트(`client-capture.ts`)에서 직접 처리하므로 여기서는 DB만 담당.
 *
 * - `withErrorCapture`로 감싸 라우트 자체 오류도 추적됨.
 * - 유효하지 않은 페이로드는 조용히 무시하고 200 반환 (클라이언트 루프 방지).
 */
export const POST = withErrorCapture(async (req: NextRequest) => {
  let body: Record<string, unknown> | null = null
  try {
    body = await req.json()
  } catch {
    body = null
  }

  if (!body || typeof body !== 'object') {
    return ApiResponse.ok({ ok: true })
  }

  const message = typeof body.message === 'string' ? body.message : 'client error'
  const name = typeof body.name === 'string' ? body.name : 'Error'
  const stack = typeof body.stack === 'string' ? body.stack : undefined
  const source = typeof body.source === 'string' ? body.source : 'client'
  const digest = typeof body.digest === 'string' ? body.digest : undefined
  const path = typeof body.path === 'string' ? body.path : undefined
  const extra = body.extra && typeof body.extra === 'object' ? (body.extra as Record<string, unknown>) : undefined

  await logError({
    level: 'error',
    source: 'client',
    errorCode: name,
    message,
    stackTrace: stack,
    endpoint: path,
    method: 'GET',
    userAgent: req.headers.get('user-agent') ?? undefined,
    ipAddress:
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      undefined,
    metadata: { source, digest, ...extra },
  }).catch(() => {})

  return ApiResponse.ok({ ok: true })
})
