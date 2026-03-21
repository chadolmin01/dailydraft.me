import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse, validateRequired } from '@/src/lib/api-utils'
import {
  confirmPayment,
  TossPaymentsError,
} from '@/src/lib/payments/tosspayments-client'
import {
  PLAN_PRICES,
  BOOST_PRODUCTS,
  BILLING_CYCLES,
} from '@/src/lib/subscription/constants'
import type { PlanType, BoostType, BillingCycle } from '@/src/lib/subscription/constants'

// POST: Confirm payment and update subscription/boost
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
    const validation = validateRequired(body, ['paymentKey', 'orderId', 'amount', 'paymentType'])

    if (!validation.valid) {
      return ApiResponse.badRequest(
        `필수 항목이 누락되었습니다: ${validation.missing.join(', ')}`
      )
    }

    const { paymentKey, orderId, amount, paymentType } = body

    // Validate payment type
    if (!['subscription', 'boost'].includes(paymentType)) {
      return ApiResponse.badRequest('유효하지 않은 결제 유형입니다')
    }

    // Additional validation based on payment type
    if (paymentType === 'subscription') {
      const { planType, billingCycle } = body
      if (!planType || !billingCycle) {
        return ApiResponse.badRequest('구독 정보가 필요합니다')
      }

      // Validate amount matches expected price
      const expectedPrice =
        PLAN_PRICES[planType as keyof typeof PLAN_PRICES]?.[
          billingCycle as keyof (typeof PLAN_PRICES)['pro']
        ]
      if (expectedPrice !== amount) {
        return ApiResponse.badRequest('결제 금액이 일치하지 않습니다')
      }
    }

    if (paymentType === 'boost') {
      const { boostType, opportunityId } = body
      if (!boostType) {
        return ApiResponse.badRequest('부스트 정보가 필요합니다')
      }

      // Validate amount matches expected price
      const expectedPrice = BOOST_PRODUCTS[boostType as BoostType]?.price
      if (expectedPrice !== amount) {
        return ApiResponse.badRequest('결제 금액이 일치하지 않습니다')
      }

      // Validate opportunity ownership if opportunity boost
      if (
        ['opportunity_boost', 'opportunity_premium', 'weekly_feature'].includes(boostType)
      ) {
        if (!opportunityId) {
          return ApiResponse.badRequest('Opportunity ID가 필요합니다')
        }

        const { data: opportunity } = await supabase
          .from('opportunities')
          .select('creator_id')
          .eq('id', opportunityId)
          .single()

        if (!opportunity || opportunity.creator_id !== user.id) {
          return ApiResponse.forbidden('본인의 Opportunity만 부스트할 수 있습니다')
        }
      }
    }

    // Confirm payment with TossPayments
    let payment
    try {
      payment = await confirmPayment({ paymentKey, orderId, amount })
    } catch (error) {
      if (error instanceof TossPaymentsError) {
        // Record failed payment
        await supabase.from('payment_history').insert({
          user_id: user.id,
          payment_type: paymentType,
          amount,
          status: 'failed',
          payment_key: paymentKey,
          order_id: orderId,
          failure_reason: `${error.code}: ${error.message}`,
        })

        return ApiResponse.badRequest(`결제 승인 실패: ${error.message}`)
      }
      throw error
    }

    // Process based on payment type
    if (paymentType === 'subscription') {
      const { planType, billingCycle } = body

      // Calculate period dates
      const now = new Date()
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
            current_period_start: now.toISOString(),
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
            current_period_start: now.toISOString(),
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

      // Record payment
      await supabase.from('payment_history').insert({
        user_id: user.id,
        subscription_id: subscriptionData.id,
        payment_type: 'subscription',
        amount,
        status: 'completed',
        payment_provider: 'tosspayments',
        payment_key: paymentKey,
        order_id: orderId,
        receipt_url: payment.receipt?.url,
      })

      return ApiResponse.ok({
        success: true,
        subscription: subscriptionData,
        receiptUrl: payment.receipt?.url,
      })
    }

    if (paymentType === 'boost') {
      const { boostType, opportunityId } = body
      const boostProduct = BOOST_PRODUCTS[boostType as BoostType]

      // Calculate expiry
      const now = new Date()
      const expiresAt = new Date(now.getTime() + boostProduct.durationHours * 60 * 60 * 1000)

      // Create boost
      const { data: boost, error: boostError } = await supabase
        .from('boosts')
        .insert({
          user_id: user.id,
          opportunity_id: opportunityId || null,
          boost_type: boostType,
          status: 'active',
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          amount_paid: amount,
          payment_id: paymentKey,
        })
        .select()
        .single()

      if (boostError) {
        return ApiResponse.internalError('부스트 생성 중 오류가 발생했습니다', boostError.message)
      }

      // Record payment
      await supabase.from('payment_history').insert({
        user_id: user.id,
        boost_id: boost.id,
        payment_type: 'boost',
        amount,
        status: 'completed',
        payment_provider: 'tosspayments',
        payment_key: paymentKey,
        order_id: orderId,
        receipt_url: payment.receipt?.url,
      })

      // Increment boost usage
      await supabase.rpc('increment_usage', {
        p_user_id: user.id,
        p_type: 'boost',
      })

      return ApiResponse.ok({
        success: true,
        boost,
        receiptUrl: payment.receipt?.url,
      })
    }

    return ApiResponse.badRequest('유효하지 않은 결제 유형입니다')
  } catch (error) {
    return ApiResponse.internalError(
      '결제 처리 중 오류가 발생했습니다',
      error instanceof Error ? error.message : undefined
    )
  }
}

// GET: Get payment history
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') // 'subscription' | 'boost' | null (all)

    let query = supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type && ['subscription', 'boost', 'one_time'].includes(type)) {
      query = query.eq('payment_type', type as 'subscription' | 'boost' | 'one_time')
    }

    const { data, error } = await query

    if (error) {
      return ApiResponse.internalError('결제 내역 조회 중 오류가 발생했습니다', error.message)
    }

    return ApiResponse.ok(data || [])
  } catch (error) {
    return ApiResponse.internalError(
      '결제 내역 조회 중 오류가 발생했습니다',
      error instanceof Error ? error.message : undefined
    )
  }
}
