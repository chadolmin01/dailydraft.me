import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse, validateRequired } from '@/src/lib/api-utils'
import {
  getUserSubscription,
  getUserUsageWithLimits,
} from '@/src/lib/subscription/usage-checker'
import { PLAN_TYPES, PLAN_PRICES, BILLING_CYCLES } from '@/src/lib/subscription/constants'
import type { PlanType, BillingCycle } from '@/src/lib/subscription/constants'

// GET: Get current subscription
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    // Get subscription with usage
    const usageWithLimits = await getUserUsageWithLimits(supabase, user.id)

    // Get full subscription record if exists
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    return ApiResponse.ok({
      subscription: subscriptionData || {
        plan_type: PLAN_TYPES.FREE,
        status: 'active',
        billing_cycle: null,
        current_period_start: null,
        current_period_end: null,
      },
      usage: usageWithLimits.usage,
      limits: usageWithLimits.limits,
      applications: usageWithLimits.applications,
    })
  } catch (error) {
    return ApiResponse.internalError(
      '구독 정보 조회 중 오류가 발생했습니다',
      error instanceof Error ? error.message : undefined
    )
  }
}

// POST: Create or update subscription
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const body = await request.json()
    const validation = validateRequired(body, ['planType', 'billingCycle'])

    if (!validation.valid) {
      return ApiResponse.badRequest(
        `필수 항목이 누락되었습니다: ${validation.missing.join(', ')}`
      )
    }

    const { planType, billingCycle, paymentKey, orderId } = body

    // Validate plan type
    if (!Object.values(PLAN_TYPES).includes(planType)) {
      return ApiResponse.badRequest('유효하지 않은 요금제입니다')
    }

    // Validate billing cycle
    if (!Object.values(BILLING_CYCLES).includes(billingCycle)) {
      return ApiResponse.badRequest('유효하지 않은 결제 주기입니다')
    }

    // Free plan doesn't need payment
    if (planType === PLAN_TYPES.FREE) {
      // Cancel existing subscription if any
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan_type: PLAN_TYPES.FREE,
          status: 'canceled',
          cancel_at_period_end: false,
        })
        .eq('user_id', user.id)

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        return ApiResponse.internalError('구독 취소 중 오류가 발생했습니다', error.message)
      }

      return ApiResponse.ok({ message: '무료 플랜으로 변경되었습니다' })
    }

    // For paid plans, payment info is required
    if (!paymentKey || !orderId) {
      return ApiResponse.badRequest('결제 정보가 필요합니다')
    }

    // Calculate period dates
    const now = new Date()
    const periodStart = now.toISOString()
    let periodEnd: Date

    if (billingCycle === BILLING_CYCLES.YEARLY) {
      periodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
    } else {
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
    }

    // Check if subscription exists
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    let subscriptionData

    if (existing) {
      // Update existing subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          plan_type: planType as PlanType,
          status: 'active',
          billing_cycle: billingCycle as BillingCycle,
          current_period_start: periodStart,
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          updated_at: now.toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        return ApiResponse.internalError('구독 업데이트 중 오류가 발생했습니다', error.message)
      }

      subscriptionData = data
    } else {
      // Create new subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_type: planType as PlanType,
          status: 'active',
          billing_cycle: billingCycle as BillingCycle,
          current_period_start: periodStart,
          current_period_end: periodEnd.toISOString(),
          payment_provider: 'tosspayments',
        })
        .select()
        .single()

      if (error) {
        return ApiResponse.internalError('구독 생성 중 오류가 발생했습니다', error.message)
      }

      subscriptionData = data
    }

    // Record payment in payment_history
    const amount =
      PLAN_PRICES[planType as keyof typeof PLAN_PRICES][
        billingCycle as keyof (typeof PLAN_PRICES)['pro']
      ]

    await supabase.from('payment_history').insert({
      user_id: user.id,
      subscription_id: subscriptionData.id,
      payment_type: 'subscription',
      amount,
      status: 'completed',
      payment_provider: 'tosspayments',
      payment_key: paymentKey,
      order_id: orderId,
    })

    return ApiResponse.created(subscriptionData)
  } catch (error) {
    return ApiResponse.internalError(
      '구독 처리 중 오류가 발생했습니다',
      error instanceof Error ? error.message : undefined
    )
  }
}

// PATCH: Update subscription (cancel, resume, etc.)
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const body = await request.json()
    const { action } = body

    if (!action || !['cancel', 'resume'].includes(action)) {
      return ApiResponse.badRequest('유효하지 않은 작업입니다')
    }

    // Get current subscription
    const subscription = await getUserSubscription(supabase, user.id)

    if (subscription.planType === PLAN_TYPES.FREE) {
      return ApiResponse.badRequest('취소할 구독이 없습니다')
    }

    if (action === 'cancel') {
      // Cancel at period end
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        return ApiResponse.internalError('구독 취소 중 오류가 발생했습니다', error.message)
      }

      return ApiResponse.ok({
        message: '구독이 기간 종료 후 취소됩니다',
        subscription: data,
      })
    }

    if (action === 'resume') {
      // Resume subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        return ApiResponse.internalError('구독 재개 중 오류가 발생했습니다', error.message)
      }

      return ApiResponse.ok({
        message: '구독이 재개되었습니다',
        subscription: data,
      })
    }

    return ApiResponse.badRequest('유효하지 않은 작업입니다')
  } catch (error) {
    return ApiResponse.internalError(
      '구독 업데이트 중 오류가 발생했습니다',
      error instanceof Error ? error.message : undefined
    )
  }
}
