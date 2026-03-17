// @ts-nocheck — Supabase types pending for subscription/payment tables (hidden feature)
/**
 * 결제 실패 처리 시스템
 * - 유예 기간 관리
 * - 자동 다운그레이드
 * - 사용자 알림
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/src/types/database'
import { PLAN_TYPES, type PlanType } from './constants'

type SupabaseClientType = SupabaseClient<Database>

// ================================================
// 설정
// ================================================

/**
 * 유예 기간 설정 (일 단위)
 */
export const GRACE_PERIOD = {
  // 결제 실패 후 첫 유예 기간
  INITIAL: 3,
  // 첫 재시도 실패 후 추가 유예
  EXTENDED: 4,
  // 최종 유예 (다운그레이드 전 마지막 경고)
  FINAL: 7,
  // 총 유예 기간 (3 + 4 + 7 = 14일)
  TOTAL: 14,
} as const

/**
 * 결제 실패 상태
 */
export const PAYMENT_FAILURE_STATUS = {
  INITIAL: 'initial_failure',       // 첫 번째 실패
  RETRY_FAILED: 'retry_failed',     // 재시도 실패
  FINAL_WARNING: 'final_warning',   // 최종 경고
  DOWNGRADED: 'downgraded',         // 다운그레이드됨
} as const

export type PaymentFailureStatus = typeof PAYMENT_FAILURE_STATUS[keyof typeof PAYMENT_FAILURE_STATUS]

// ================================================
// 인터페이스
// ================================================

export interface PaymentFailureRecord {
  id: string
  user_id: string
  subscription_id: string
  status: PaymentFailureStatus
  failure_count: number
  first_failure_at: string
  last_failure_at: string
  grace_period_ends_at: string
  downgrade_at: string | null
  resolved_at: string | null
  notifications_sent: string[]
}

export interface FailureHandlingResult {
  success: boolean
  action: 'grace_period_started' | 'grace_period_extended' | 'final_warning' | 'downgraded' | 'already_handled'
  gracePeriodEndsAt?: string
  notificationSent: boolean
  error?: string
}

// ================================================
// 결제 실패 처리
// ================================================

/**
 * 결제 실패를 처리합니다.
 */
export async function handlePaymentFailure(
  supabase: SupabaseClientType,
  userId: string,
  subscriptionId: string,
  paymentKey?: string
): Promise<FailureHandlingResult> {
  const now = new Date()

  // 기존 실패 기록 확인
  const { data: existingRecord } = await supabase
    .from('payment_failures')
    .select('*')
    .eq('user_id', userId)
    .eq('subscription_id', subscriptionId)
    .is('resolved_at', null)
    .single()

  if (!existingRecord) {
    // 첫 번째 실패 - 유예 기간 시작
    return await startGracePeriod(supabase, userId, subscriptionId, now)
  }

  // 실패 횟수에 따른 처리
  const failureCount = existingRecord.failure_count + 1
  const daysSinceFirstFailure = Math.floor(
    (now.getTime() - new Date(existingRecord.first_failure_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  // 유예 기간 초과 확인
  if (daysSinceFirstFailure >= GRACE_PERIOD.TOTAL) {
    return await downgradeSubscription(supabase, userId, subscriptionId, existingRecord.id)
  }

  // 실패 단계별 처리
  if (daysSinceFirstFailure >= GRACE_PERIOD.INITIAL + GRACE_PERIOD.EXTENDED) {
    // 최종 경고 단계
    return await sendFinalWarning(supabase, userId, subscriptionId, existingRecord.id, failureCount)
  } else if (daysSinceFirstFailure >= GRACE_PERIOD.INITIAL) {
    // 유예 기간 연장
    return await extendGracePeriod(supabase, userId, subscriptionId, existingRecord.id, failureCount)
  }

  // 아직 첫 유예 기간 내
  await supabase
    .from('payment_failures')
    .update({
      failure_count: failureCount,
      last_failure_at: now.toISOString(),
    })
    .eq('id', existingRecord.id)

  return {
    success: true,
    action: 'already_handled',
    gracePeriodEndsAt: existingRecord.grace_period_ends_at,
    notificationSent: false,
  }
}

/**
 * 유예 기간을 시작합니다.
 */
async function startGracePeriod(
  supabase: SupabaseClientType,
  userId: string,
  subscriptionId: string,
  now: Date
): Promise<FailureHandlingResult> {
  const gracePeriodEndsAt = new Date(now.getTime() + GRACE_PERIOD.INITIAL * 24 * 60 * 60 * 1000)
  const downgradeAt = new Date(now.getTime() + GRACE_PERIOD.TOTAL * 24 * 60 * 60 * 1000)

  // 실패 기록 생성
  const { error: insertError } = await supabase.from('payment_failures').insert({
    user_id: userId,
    subscription_id: subscriptionId,
    status: PAYMENT_FAILURE_STATUS.INITIAL,
    failure_count: 1,
    first_failure_at: now.toISOString(),
    last_failure_at: now.toISOString(),
    grace_period_ends_at: gracePeriodEndsAt.toISOString(),
    downgrade_at: downgradeAt.toISOString(),
    notifications_sent: ['initial_failure'],
  })

  if (insertError) {
    return {
      success: false,
      action: 'grace_period_started',
      notificationSent: false,
      error: insertError.message,
    }
  }

  // 구독 상태 업데이트
  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: now.toISOString(),
    })
    .eq('id', subscriptionId)

  // 알림 발송
  await sendPaymentFailureNotification(supabase, userId, 'initial', {
    gracePeriodDays: GRACE_PERIOD.INITIAL,
    gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
  })

  return {
    success: true,
    action: 'grace_period_started',
    gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
    notificationSent: true,
  }
}

/**
 * 유예 기간을 연장합니다.
 */
async function extendGracePeriod(
  supabase: SupabaseClientType,
  userId: string,
  subscriptionId: string,
  failureRecordId: string,
  failureCount: number
): Promise<FailureHandlingResult> {
  const now = new Date()
  const gracePeriodEndsAt = new Date(
    now.getTime() + GRACE_PERIOD.EXTENDED * 24 * 60 * 60 * 1000
  )

  await supabase
    .from('payment_failures')
    .update({
      status: PAYMENT_FAILURE_STATUS.RETRY_FAILED,
      failure_count: failureCount,
      last_failure_at: now.toISOString(),
      grace_period_ends_at: gracePeriodEndsAt.toISOString(),
      notifications_sent: ['initial_failure', 'retry_failed'],
    })
    .eq('id', failureRecordId)

  await sendPaymentFailureNotification(supabase, userId, 'retry_failed', {
    gracePeriodDays: GRACE_PERIOD.EXTENDED,
    gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
    failureCount,
  })

  return {
    success: true,
    action: 'grace_period_extended',
    gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
    notificationSent: true,
  }
}

/**
 * 최종 경고를 발송합니다.
 */
async function sendFinalWarning(
  supabase: SupabaseClientType,
  userId: string,
  subscriptionId: string,
  failureRecordId: string,
  failureCount: number
): Promise<FailureHandlingResult> {
  const now = new Date()
  const gracePeriodEndsAt = new Date(
    now.getTime() + GRACE_PERIOD.FINAL * 24 * 60 * 60 * 1000
  )

  await supabase
    .from('payment_failures')
    .update({
      status: PAYMENT_FAILURE_STATUS.FINAL_WARNING,
      failure_count: failureCount,
      last_failure_at: now.toISOString(),
      grace_period_ends_at: gracePeriodEndsAt.toISOString(),
      notifications_sent: ['initial_failure', 'retry_failed', 'final_warning'],
    })
    .eq('id', failureRecordId)

  await sendPaymentFailureNotification(supabase, userId, 'final_warning', {
    gracePeriodDays: GRACE_PERIOD.FINAL,
    gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
    failureCount,
  })

  return {
    success: true,
    action: 'final_warning',
    gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
    notificationSent: true,
  }
}

/**
 * 구독을 다운그레이드합니다.
 */
async function downgradeSubscription(
  supabase: SupabaseClientType,
  userId: string,
  subscriptionId: string,
  failureRecordId: string
): Promise<FailureHandlingResult> {
  const now = new Date()

  // 구독을 무료 플랜으로 다운그레이드
  await supabase
    .from('subscriptions')
    .update({
      plan_type: PLAN_TYPES.FREE,
      status: 'active',
      billing_key: null,
      current_period_end: null,
      updated_at: now.toISOString(),
    })
    .eq('id', subscriptionId)

  // 실패 기록 업데이트
  await supabase
    .from('payment_failures')
    .update({
      status: PAYMENT_FAILURE_STATUS.DOWNGRADED,
      resolved_at: now.toISOString(),
      notifications_sent: ['initial_failure', 'retry_failed', 'final_warning', 'downgraded'],
    })
    .eq('id', failureRecordId)

  // 다운그레이드 알림
  await sendPaymentFailureNotification(supabase, userId, 'downgraded', {})

  return {
    success: true,
    action: 'downgraded',
    notificationSent: true,
  }
}

// ================================================
// 알림 발송
// ================================================

type NotificationType = 'initial' | 'retry_failed' | 'final_warning' | 'downgraded'

interface NotificationData {
  gracePeriodDays?: number
  gracePeriodEndsAt?: string
  failureCount?: number
}

async function sendPaymentFailureNotification(
  supabase: SupabaseClientType,
  userId: string,
  type: NotificationType,
  data: NotificationData
): Promise<void> {
  const notifications: Record<NotificationType, { title: string; message: string; priority: string }> = {
    initial: {
      title: '결제 실패 알림',
      message: `결제가 실패했습니다. ${data.gracePeriodDays}일 내에 결제 수단을 확인해주세요.`,
      priority: 'high',
    },
    retry_failed: {
      title: '결제 재시도 실패',
      message: `결제가 ${data.failureCount}회 연속 실패했습니다. ${data.gracePeriodDays}일 후 플랜이 다운그레이드됩니다.`,
      priority: 'urgent',
    },
    final_warning: {
      title: '최종 결제 경고',
      message: `${data.gracePeriodDays}일 후 무료 플랜으로 자동 전환됩니다. 지금 결제 수단을 업데이트하세요.`,
      priority: 'urgent',
    },
    downgraded: {
      title: '플랜 다운그레이드 완료',
      message: '결제 실패로 인해 무료 플랜으로 전환되었습니다. Pro 기능을 계속 사용하려면 다시 구독해주세요.',
      priority: 'high',
    },
  }

  const notif = notifications[type]

  // 인앱 알림 생성
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'payment_failure',
    title: notif.title,
    message: notif.message,
    priority: notif.priority,
    data: {
      notification_type: type,
      ...data,
    },
    read: false,
  })

  // TODO: 이메일 알림도 발송
  // await sendPaymentFailureEmail(userId, type, data)
}

// ================================================
// 결제 성공 처리
// ================================================

/**
 * 결제가 성공하면 실패 기록을 해결합니다.
 */
export async function resolvePaymentFailure(
  supabase: SupabaseClientType,
  userId: string,
  subscriptionId: string
): Promise<void> {
  const now = new Date()

  // 미해결 실패 기록 찾기
  const { data: failureRecord } = await supabase
    .from('payment_failures')
    .select('*')
    .eq('user_id', userId)
    .eq('subscription_id', subscriptionId)
    .is('resolved_at', null)
    .single()

  if (!failureRecord) return

  // 기록 해결
  await supabase
    .from('payment_failures')
    .update({
      resolved_at: now.toISOString(),
    })
    .eq('id', failureRecord.id)

  // 구독 상태 복구
  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: now.toISOString(),
    })
    .eq('id', subscriptionId)

  // 해결 알림
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'payment_resolved',
    title: '결제 완료',
    message: '결제가 성공적으로 처리되었습니다. 구독이 정상화되었습니다.',
    priority: 'normal',
    read: false,
  })
}

// ================================================
// 유예 기간 만료 체크 (Cron용)
// ================================================

/**
 * 유예 기간이 만료된 구독을 다운그레이드합니다.
 * Cron job에서 호출됩니다.
 */
export async function processExpiredGracePeriods(
  supabase: SupabaseClientType
): Promise<{ processed: number; downgraded: number; errors: string[] }> {
  const now = new Date()
  const result = { processed: 0, downgraded: 0, errors: [] as string[] }

  // 유예 기간이 만료된 기록 조회
  const { data: expiredRecords, error } = await supabase
    .from('payment_failures')
    .select('*')
    .is('resolved_at', null)
    .lt('downgrade_at', now.toISOString())

  if (error) {
    result.errors.push(`Query error: ${error.message}`)
    return result
  }

  if (!expiredRecords || expiredRecords.length === 0) {
    return result
  }

  result.processed = expiredRecords.length

  for (const record of expiredRecords) {
    try {
      const downgradeResult = await downgradeSubscription(
        supabase,
        record.user_id,
        record.subscription_id,
        record.id
      )

      if (downgradeResult.success) {
        result.downgraded++
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      result.errors.push(`Failed to downgrade ${record.id}: ${errMsg}`)
    }
  }

  return result
}

// ================================================
// 결제 상태 조회
// ================================================

/**
 * 사용자의 현재 결제 상태를 조회합니다.
 */
export async function getPaymentStatus(
  supabase: SupabaseClientType,
  userId: string
): Promise<{
  hasActiveFailure: boolean
  failureRecord: PaymentFailureRecord | null
  daysUntilDowngrade: number | null
  status: PaymentFailureStatus | null
}> {
  const { data: failureRecord } = await supabase
    .from('payment_failures')
    .select('*')
    .eq('user_id', userId)
    .is('resolved_at', null)
    .single()

  if (!failureRecord) {
    return {
      hasActiveFailure: false,
      failureRecord: null,
      daysUntilDowngrade: null,
      status: null,
    }
  }

  let daysUntilDowngrade: number | null = null
  if (failureRecord.downgrade_at) {
    const now = new Date()
    const downgradeAt = new Date(failureRecord.downgrade_at)
    daysUntilDowngrade = Math.max(
      0,
      Math.ceil((downgradeAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    )
  }

  return {
    hasActiveFailure: true,
    failureRecord: failureRecord as PaymentFailureRecord,
    daysUntilDowngrade,
    status: failureRecord.status as PaymentFailureStatus,
  }
}
