/**
 * 결제 실패 처리 Cron
 * - 유예 기간 만료 체크
 * - 자동 다운그레이드 처리
 *
 * 권장 실행 주기: 매일 1회 (예: 오전 6시)
 */

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { processExpiredGracePeriods } from '@/src/lib/subscription/payment-failure-handler'
import { logCronError } from '@/src/lib/error-logging'
import { ApiResponse } from '@/src/lib/api-utils'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify cron secret (fail-closed: reject if secret is missing or mismatched)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return ApiResponse.unauthorized()
    }

    const supabase = createAdminClient()

    // 만료된 유예 기간 처리
    const result = await processExpiredGracePeriods(supabase)

    const duration = Date.now() - startTime

    return ApiResponse.ok({
      success: true,
      timestamp: new Date().toISOString(),
      result,
      duration_ms: duration,
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    await logCronError(err, 'process-payment-failures')

    return ApiResponse.internalError('결제 실패 처리 중 오류가 발생했습니다.')
  }
}

// POST도 지원 (Vercel cron은 POST를 사용할 수도 있음)
export async function POST(request: NextRequest) {
  return GET(request)
}
