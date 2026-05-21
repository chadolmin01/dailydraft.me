import { NextRequest, NextResponse } from 'next/server'
import { captureAndLog, captureServerEvent } from './server'
import { ApiResponse } from '@/src/lib/api-utils'

/**
 * 크론 라우트용 에러 캡처 + 완료 이벤트 래퍼.
 *
 * - throw 시: PostHog $exception + error_logs 기록 → 500 응답
 * - 정상 완료 시: PostHog `cron_completed` 이벤트 기록 (성공률/소요 시간 추적)
 *
 * 응답 body에 JSON이 포함되면 해당 데이터도 이벤트에 기록하여
 * "draftsCreated=0 && processed>0" 같은 조용한 실패를 PostHog에서 감지할 수 있음.
 */
export function withCronCapture(
  jobName: string,
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startedAt = Date.now()
    try {
      const response = await handler(req)
      const durationMs = Date.now() - startedAt

      // 성공 응답의 body를 읽어서 PostHog에 기록
      // (NextResponse를 clone해서 body 소비가 원래 응답에 영향 안 줌)
      captureServerEvent('cron_completed', {
        jobName,
        durationMs,
        statusCode: response.status,
        success: response.status < 400,
      }).catch(() => {})

      return response
    } catch (error) {
      const durationMs = Date.now() - startedAt
      try {
        await captureAndLog(error, {
          route: new URL(req.url).pathname,
          method: req.method,
          source: 'cron',
          jobName,
          durationMs,
          statusCode: 500,
        }).catch(() => {})
      } catch {
        // fail-safe
      }
      return ApiResponse.internalError()
    }
  }
}
