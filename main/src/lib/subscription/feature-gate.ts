/**
 * 기능 게이팅 유틸리티
 * 구독 플랜에 따른 기능 접근 제어
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/src/types/database'
import { getUserSubscription } from './usage-checker'
import {
  PLAN_TYPES,
  PLAN_LIMITS,
  SUBSCRIPTION_FEATURES,
  FEATURE_REQUIREMENTS,
  type PlanType,
  type SubscriptionFeature,
} from './constants'

type SupabaseClientType = SupabaseClient<Database>

// ================================================
// 기능 접근 권한 체크
// ================================================

/**
 * 특정 기능에 대한 접근 권한을 체크합니다.
 */
export async function canAccessFeature(
  supabase: SupabaseClientType,
  userId: string,
  feature: SubscriptionFeature
): Promise<boolean> {
  const subscription = await getUserSubscription(supabase, userId)
  return hasFeatureAccess(subscription.planType, feature)
}

/**
 * 플랜 타입으로 기능 접근 권한을 체크합니다. (동기 버전)
 */
export function hasFeatureAccess(
  planType: PlanType,
  feature: SubscriptionFeature
): boolean {
  const requiredPlans = FEATURE_REQUIREMENTS[feature]
  return requiredPlans.includes(planType)
}

/**
 * 사용자의 모든 접근 가능 기능을 반환합니다.
 */
export async function getAccessibleFeatures(
  supabase: SupabaseClientType,
  userId: string
): Promise<SubscriptionFeature[]> {
  const subscription = await getUserSubscription(supabase, userId)
  return getAccessibleFeaturesForPlan(subscription.planType)
}

/**
 * 특정 플랜의 모든 접근 가능 기능을 반환합니다. (동기 버전)
 */
export function getAccessibleFeaturesForPlan(
  planType: PlanType
): SubscriptionFeature[] {
  return Object.entries(FEATURE_REQUIREMENTS)
    .filter(([, requiredPlans]) => requiredPlans.includes(planType))
    .map(([feature]) => feature as SubscriptionFeature)
}

// ================================================
// 특정 기능별 체크 함수
// ================================================

/**
 * 전체 매칭 점수를 볼 수 있는지 체크합니다.
 */
export function canViewFullMatchScores(planType: PlanType): boolean {
  return hasFeatureAccess(planType, SUBSCRIPTION_FEATURES.FULL_MATCH_SCORES)
}

/**
 * 상세 매칭 이유를 볼 수 있는지 체크합니다.
 */
export function canViewDetailedMatchReason(planType: PlanType): boolean {
  return hasFeatureAccess(planType, SUBSCRIPTION_FEATURES.DETAILED_MATCH_REASON)
}

/**
 * 매칭 개선 제안을 볼 수 있는지 체크합니다.
 */
export function canViewMatchSuggestions(planType: PlanType): boolean {
  return hasFeatureAccess(
    planType,
    SUBSCRIPTION_FEATURES.MATCH_IMPROVEMENT_SUGGESTIONS
  )
}

/**
 * 프로필 방문자를 볼 수 있는지 체크합니다.
 */
export function canViewProfileVisitors(planType: PlanType): boolean {
  return hasFeatureAccess(planType, SUBSCRIPTION_FEATURES.PROFILE_VISITORS)
}

/**
 * 고급 필터를 사용할 수 있는지 체크합니다.
 */
export function canUseAdvancedFilters(planType: PlanType): boolean {
  return hasFeatureAccess(planType, SUBSCRIPTION_FEATURES.ADVANCED_FILTERS)
}

/**
 * Pro 배지를 표시할 수 있는지 체크합니다.
 */
export function canShowProBadge(planType: PlanType): boolean {
  return hasFeatureAccess(planType, SUBSCRIPTION_FEATURES.PRO_BADGE)
}

/**
 * Team 배지를 표시할 수 있는지 체크합니다.
 */
export function canShowTeamBadge(planType: PlanType): boolean {
  return hasFeatureAccess(planType, SUBSCRIPTION_FEATURES.TEAM_BADGE)
}

// ================================================
// 수량 제한 관련 함수
// ================================================

/**
 * 표시할 매칭 점수 개수를 반환합니다.
 * -1은 무제한
 */
export function getMatchScoreVisibleCount(planType: PlanType): number {
  return PLAN_LIMITS[planType].matchScoreVisible
}

/**
 * 이벤트 알림 일수를 반환합니다.
 */
export function getEventAlertDays(planType: PlanType): number {
  return PLAN_LIMITS[planType].eventAlertDays
}

/**
 * 월간 지원 가능 횟수를 반환합니다.
 * -1은 무제한
 */
export function getApplicationsPerMonth(planType: PlanType): number {
  return PLAN_LIMITS[planType].applicationsPerMonth
}

/**
 * 활성 Opportunity 개수 제한을 반환합니다.
 */
export function getActiveOpportunityLimit(planType: PlanType): number {
  return PLAN_LIMITS[planType].activeOpportunities
}

// ================================================
// 매칭 이유 상세 수준
// ================================================

export type MatchReasonDetailLevel = 'summary' | 'full' | 'full_with_suggestions'

/**
 * 매칭 이유 상세 수준을 반환합니다.
 */
export function getMatchReasonDetailLevel(
  planType: PlanType
): MatchReasonDetailLevel {
  return PLAN_LIMITS[planType].matchReasonDetail as MatchReasonDetailLevel
}

// ================================================
// 업그레이드 필요 여부 체크
// ================================================

/**
 * 특정 기능을 위해 업그레이드가 필요한지 체크합니다.
 */
export function needsUpgradeForFeature(
  currentPlan: PlanType,
  feature: SubscriptionFeature
): boolean {
  return !hasFeatureAccess(currentPlan, feature)
}

/**
 * 기능을 사용하기 위해 필요한 최소 플랜을 반환합니다.
 */
export function getMinimumPlanForFeature(
  feature: SubscriptionFeature
): PlanType {
  const requiredPlans = FEATURE_REQUIREMENTS[feature]

  // 플랜 우선순위: free < pro < team
  if (requiredPlans.includes(PLAN_TYPES.FREE)) return PLAN_TYPES.FREE
  if (requiredPlans.includes(PLAN_TYPES.PRO)) return PLAN_TYPES.PRO
  return PLAN_TYPES.TEAM
}

/**
 * 현재 플랜에서 다음 플랜으로 업그레이드 시 추가되는 기능 목록을 반환합니다.
 */
export function getUpgradeFeatures(
  currentPlan: PlanType,
  targetPlan: PlanType
): SubscriptionFeature[] {
  const currentFeatures = getAccessibleFeaturesForPlan(currentPlan)
  const targetFeatures = getAccessibleFeaturesForPlan(targetPlan)

  return targetFeatures.filter((f) => !currentFeatures.includes(f))
}

// ================================================
// 배지 정보
// ================================================

export type BadgeType = 'none' | 'pro' | 'team'

/**
 * 사용자의 배지 타입을 반환합니다.
 */
export function getBadgeType(planType: PlanType): BadgeType {
  if (planType === PLAN_TYPES.TEAM) return 'team'
  if (planType === PLAN_TYPES.PRO) return 'pro'
  return 'none'
}

/**
 * 배지 표시 정보를 반환합니다.
 */
export function getBadgeInfo(planType: PlanType): {
  type: BadgeType
  label: string
  color: string
} | null {
  if (planType === PLAN_TYPES.TEAM) {
    return {
      type: 'team',
      label: 'Team',
      color: 'purple',
    }
  }
  if (planType === PLAN_TYPES.PRO) {
    return {
      type: 'pro',
      label: 'Pro',
      color: 'blue',
    }
  }
  return null
}

// ================================================
// 지원 수준
// ================================================

export type SupportLevel = 'community' | 'email_48h' | 'priority_24h'

/**
 * 플랜의 지원 수준을 반환합니다.
 */
export function getSupportLevel(planType: PlanType): SupportLevel {
  return PLAN_LIMITS[planType].supportLevel as SupportLevel
}

// ================================================
// Phase 1: 시장 분석 기능 접근 체크
// ================================================

/**
 * 시장 수요 분석 기능에 접근할 수 있는지 체크합니다.
 */
export function canAccessMarketDemandAnalysis(planType: PlanType): boolean {
  return hasFeatureAccess(planType, SUBSCRIPTION_FEATURES.MARKET_DEMAND_ANALYSIS)
}

/**
 * AI 이벤트 적합도 분석 기능에 접근할 수 있는지 체크합니다.
 */
export function canAccessEventFitAnalysis(planType: PlanType): boolean {
  return hasFeatureAccess(planType, SUBSCRIPTION_FEATURES.EVENT_FIT_ANALYSIS)
}

/**
 * AI 지원서 초안 생성 기능에 접근할 수 있는지 체크합니다.
 */
export function canAccessApplicationDraftGeneration(planType: PlanType): boolean {
  return hasFeatureAccess(
    planType,
    SUBSCRIPTION_FEATURES.APPLICATION_DRAFT_GENERATION
  )
}

/**
 * 월간 AI 지원서 초안 생성 제한을 반환합니다.
 * -1은 무제한
 */
export function getApplicationDraftsPerMonth(planType: PlanType): number {
  return PLAN_LIMITS[planType].applicationDraftsPerMonth
}
