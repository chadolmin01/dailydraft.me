/**
 * 사용량 체크 및 구독 관리 유틸리티
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/src/types/database'
import {
  PLAN_TYPES,
  PLAN_LIMITS,
  SUBSCRIPTION_ERRORS,
  type PlanType,
  type SubscriptionError,
} from './constants'

type SupabaseClientType = SupabaseClient<Database>

// ================================================
// 타입 정의
// ================================================
export interface UserSubscription {
  planType: PlanType
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  billingCycle: 'monthly' | 'yearly' | null
  currentPeriodEnd: string | null
}

export interface UserUsage {
  applicationsUsed: number
  opportunitiesCreated: number
  boostsPurchased: number
  periodStart: string
  periodEnd: string
}

export interface UsageLimitResult {
  allowed: boolean
  current: number
  limit: number
  remaining: number
  errorCode?: SubscriptionError
  message?: string
}

// ================================================
// 구독 정보 조회
// ================================================

/**
 * 사용자의 현재 구독 정보를 조회합니다.
 * 구독이 없으면 무료 플랜을 반환합니다.
 */
export async function getUserSubscription(
  supabase: SupabaseClientType,
  userId: string
): Promise<UserSubscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan_type, status, billing_cycle, current_period_end')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching subscription:', error)
  }

  if (!data) {
    return {
      planType: PLAN_TYPES.FREE,
      status: 'active',
      billingCycle: null,
      currentPeriodEnd: null,
    }
  }

  // 구독 만료 체크
  if (data.current_period_end) {
    const periodEnd = new Date(data.current_period_end)
    const now = new Date()
    if (periodEnd < now && data.status === 'active') {
      // 만료된 구독은 무료로 처리
      return {
        planType: PLAN_TYPES.FREE,
        status: 'active',
        billingCycle: null,
        currentPeriodEnd: null,
      }
    }
  }

  return {
    planType: data.plan_type as PlanType,
    status: data.status as UserSubscription['status'],
    billingCycle: data.billing_cycle as UserSubscription['billingCycle'],
    currentPeriodEnd: data.current_period_end,
  }
}

/**
 * 사용자의 플랜 타입만 빠르게 조회합니다.
 */
export async function getUserPlanType(
  supabase: SupabaseClientType,
  userId: string
): Promise<PlanType> {
  const subscription = await getUserSubscription(supabase, userId)
  return subscription.planType
}

// ================================================
// 사용량 조회
// ================================================

/**
 * 현재 월의 사용량을 조회합니다.
 * 레코드가 없으면 자동으로 생성합니다.
 */
export async function getUserUsage(
  supabase: SupabaseClientType,
  userId: string
): Promise<UserUsage> {
  // RPC 함수를 사용하여 조회 또는 생성
  const { data, error } = await supabase.rpc('get_or_create_current_usage', {
    p_user_id: userId,
  })

  if (error) {
    console.error('Error fetching usage:', error)
    // 에러 시 기본값 반환
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      applicationsUsed: 0,
      opportunitiesCreated: 0,
      boostsPurchased: 0,
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0],
    }
  }

  return {
    applicationsUsed: data.applications_used,
    opportunitiesCreated: data.opportunities_created,
    boostsPurchased: data.boosts_purchased,
    periodStart: data.period_start,
    periodEnd: data.period_end,
  }
}

// ================================================
// 제한 체크
// ================================================

/**
 * 지원 횟수 제한을 체크합니다.
 */
export async function checkApplicationLimit(
  supabase: SupabaseClientType,
  userId: string
): Promise<UsageLimitResult> {
  const [subscription, usage] = await Promise.all([
    getUserSubscription(supabase, userId),
    getUserUsage(supabase, userId),
  ])

  const limit = PLAN_LIMITS[subscription.planType].applicationsPerMonth

  // -1은 무제한
  if (limit === -1) {
    return {
      allowed: true,
      current: usage.applicationsUsed,
      limit: -1,
      remaining: -1,
    }
  }

  const remaining = Math.max(0, limit - usage.applicationsUsed)
  const allowed = usage.applicationsUsed < limit

  return {
    allowed,
    current: usage.applicationsUsed,
    limit,
    remaining,
    errorCode: allowed ? undefined : SUBSCRIPTION_ERRORS.APPLICATION_LIMIT_REACHED,
    message: allowed
      ? undefined
      : `이번 달 지원 횟수(${limit}회)를 모두 사용했습니다. Pro로 업그레이드하면 더 많은 지원이 가능합니다.`,
  }
}

/**
 * Opportunity 생성 제한을 체크합니다.
 * 활성 Opportunity 수를 기준으로 합니다.
 */
export async function checkOpportunityLimit(
  supabase: SupabaseClientType,
  userId: string
): Promise<UsageLimitResult> {
  const subscription = await getUserSubscription(supabase, userId)
  const limit = PLAN_LIMITS[subscription.planType].activeOpportunities

  // 현재 활성 Opportunity 수 조회
  const { count, error } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', userId)
    .eq('status', 'active')

  if (error) {
    console.error('Error counting opportunities:', error)
    return {
      allowed: false,
      current: 0,
      limit,
      remaining: 0,
      errorCode: SUBSCRIPTION_ERRORS.OPPORTUNITY_LIMIT_REACHED,
      message: '오류가 발생했습니다. 다시 시도해주세요.',
    }
  }

  const current = count || 0
  const remaining = Math.max(0, limit - current)
  const allowed = current < limit

  return {
    allowed,
    current,
    limit,
    remaining,
    errorCode: allowed ? undefined : SUBSCRIPTION_ERRORS.OPPORTUNITY_LIMIT_REACHED,
    message: allowed
      ? undefined
      : `활성 Opportunity 개수(${limit}개)가 최대입니다. 기존 Opportunity를 마감하거나 Pro로 업그레이드하세요.`,
  }
}

// ================================================
// 사용량 증가
// ================================================

/**
 * 지원 횟수를 1 증가시킵니다.
 */
export async function incrementApplicationUsage(
  supabase: SupabaseClientType,
  userId: string
): Promise<void> {
  const { error } = await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_type: 'application',
  })

  if (error) {
    console.error('Error incrementing application usage:', error)
  }
}

/**
 * Opportunity 생성 횟수를 1 증가시킵니다.
 */
export async function incrementOpportunityUsage(
  supabase: SupabaseClientType,
  userId: string
): Promise<void> {
  const { error } = await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_type: 'opportunity',
  })

  if (error) {
    console.error('Error incrementing opportunity usage:', error)
  }
}

/**
 * 부스트 구매 횟수를 1 증가시킵니다.
 */
export async function incrementBoostUsage(
  supabase: SupabaseClientType,
  userId: string
): Promise<void> {
  const { error } = await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_type: 'boost',
  })

  if (error) {
    console.error('Error incrementing boost usage:', error)
  }
}

// ================================================
// 플랜 제한 조회
// ================================================

/**
 * 사용자의 현재 플랜 제한을 조회합니다.
 */
export async function getUserPlanLimits(
  supabase: SupabaseClientType,
  userId: string
) {
  const subscription = await getUserSubscription(supabase, userId)
  return {
    planType: subscription.planType,
    limits: PLAN_LIMITS[subscription.planType],
  }
}

/**
 * 사용자의 현재 사용량과 제한을 함께 조회합니다.
 */
export async function getUserUsageWithLimits(
  supabase: SupabaseClientType,
  userId: string
) {
  const [subscription, usage] = await Promise.all([
    getUserSubscription(supabase, userId),
    getUserUsage(supabase, userId),
  ])

  const limits = PLAN_LIMITS[subscription.planType]

  return {
    planType: subscription.planType,
    subscription,
    usage,
    limits,
    applications: {
      used: usage.applicationsUsed,
      limit: limits.applicationsPerMonth,
      remaining:
        limits.applicationsPerMonth === -1
          ? -1
          : Math.max(0, limits.applicationsPerMonth - usage.applicationsUsed),
    },
    // 활성 Opportunity는 별도 조회 필요
  }
}
