/**
 * 결제 상태 조회 API
 * GET /api/payment-status - 현재 사용자의 결제 상태 및 유예 기간 정보
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { getPaymentStatus, GRACE_PERIOD } from '@/src/lib/subscription/payment-failure-handler'
import { getUserSubscription } from '@/src/lib/subscription/usage-checker'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const adminClient = createAdminClient()

    // 구독 정보 조회
    const subscription = await getUserSubscription(adminClient, user.id)

    // 결제 실패 상태 조회
    const paymentStatus = await getPaymentStatus(adminClient, user.id)

    // 최근 결제 기록 조회
    const { data: recentPayments } = await adminClient
      .from('payment_history')
      .select('id, amount, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          planType: subscription.planType,
          status: subscription.status,
          billingCycle: subscription.billingCycle,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },

        // 결제 실패 정보
        paymentFailure: paymentStatus.hasActiveFailure ? {
          status: paymentStatus.status,
          daysUntilDowngrade: paymentStatus.daysUntilDowngrade,
          gracePeriodEndsAt: paymentStatus.failureRecord?.grace_period_ends_at,
          failureCount: paymentStatus.failureRecord?.failure_count,
          firstFailureAt: paymentStatus.failureRecord?.first_failure_at,
        } : null,

        // 유예 기간 설정
        gracePeriodConfig: GRACE_PERIOD,

        // 최근 결제 기록
        recentPayments: recentPayments?.map(p => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          createdAt: p.created_at,
        })) || [],

        // 경고 표시 여부
        showWarning: paymentStatus.hasActiveFailure,
        warningLevel: paymentStatus.status === 'final_warning' ? 'critical' :
                      paymentStatus.status === 'retry_failed' ? 'warning' :
                      paymentStatus.status === 'initial_failure' ? 'info' : null,
      },
    })
  } catch (error) {
    console.error('Error fetching payment status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
