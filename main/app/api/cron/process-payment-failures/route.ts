/**
 * 결제 실패 처리 Cron
 * - 유예 기간 만료 체크
 * - 자동 다운그레이드 처리
 *
 * 권장 실행 주기: 매일 1회 (예: 오전 6시)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { processExpiredGracePeriods } from '@/src/lib/subscription/payment-failure-handler'
import { logCronError } from '@/src/lib/error-logging'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify cron secret (fail-closed: reject if secret is missing or mismatched)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    // 만료된 유예 기간 처리
    const result = await processExpiredGracePeriods(supabase)

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
      duration_ms: duration,
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    await logCronError(err, 'process-payment-failures')

    return NextResponse.json(
      {
        success: false,
        error: err.message,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

// POST도 지원 (Vercel cron은 POST를 사용할 수도 있음)
export async function POST(request: NextRequest) {
  return GET(request)
}
