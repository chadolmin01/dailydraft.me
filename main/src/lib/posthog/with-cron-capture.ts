import { NextRequest, NextResponse } from 'next/server'
import { captureAndLog } from './server'
import { ApiResponse } from '@/src/lib/api-utils'

/**
 * 크론 라우트용 에러 캡처 래퍼.
 *
 * 크론은 요청 유저가 없고 `CRON_SECRET`로만 호출되므로 `withErrorCapture`와
 * 분리. distinctId는 `cron:<jobName>` 고정 — PostHog에서 잡별 필터링 가능.
 *
 * throw 시 PostHog + error_logs(`source: 'cron'`) 동시 기록 후 500 응답.
 */
export function withCronCapture(
  jobName: string,
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startedAt = Date.now()
    try {
      return await handler(req)
    } catch (error) {
      try {
        await captureAndLog(error, {
          route: new URL(req.url).pathname,
          method: req.method,
          source: 'cron',
          jobName,
          durationMs: Date.now() - startedAt,
          statusCode: 500,
        }).catch(() => {})
      } catch {
        // fail-safe
      }
      return ApiResponse.internalError()
    }
  }
}
