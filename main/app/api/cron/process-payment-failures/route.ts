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
import { ApiResponse } from '@/src/lib/api-utils'
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture'

export const runtime = 'nodejs'
export const maxDuration = 60

export const GET = withCronCapture('process-payment-failures', async (request: NextRequest) => {
  const startTime = Date.now()

  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized()
  }

  const supabase = createAdminClient()

  const result = await processExpiredGracePeriods(supabase)

  const duration = Date.now() - startTime

  return ApiResponse.ok({
    success: true,
    timestamp: new Date().toISOString(),
    result,
    duration_ms: duration,
  })
})

// POST도 지원 (Vercel cron은 POST를 사용할 수도 있음)
export const POST = GET
