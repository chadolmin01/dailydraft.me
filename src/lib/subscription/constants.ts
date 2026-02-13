/**
 * 구독 시스템 상수 정의
 * Team Builder 수익 모델에서 사용되는 모든 상수
 */

// ================================================
// 플랜 타입
// ================================================
export const PLAN_TYPES = {
  FREE: 'free',
  PRO: 'pro',
  TEAM: 'team',
} as const

export type PlanType = (typeof PLAN_TYPES)[keyof typeof PLAN_TYPES]

// ================================================
// 결제 주기
// ================================================
export const BILLING_CYCLES = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const

export type BillingCycle = (typeof BILLING_CYCLES)[keyof typeof BILLING_CYCLES]

// ================================================
// 플랜별 가격 (원)
// ================================================
export const PLAN_PRICES = {
  [PLAN_TYPES.FREE]: {
    [BILLING_CYCLES.MONTHLY]: 0,
    [BILLING_CYCLES.YEARLY]: 0,
  },
  [PLAN_TYPES.PRO]: {
    [BILLING_CYCLES.MONTHLY]: 9900,
    [BILLING_CYCLES.YEARLY]: 99000, // 17% 할인
  },
  [PLAN_TYPES.TEAM]: {
    [BILLING_CYCLES.MONTHLY]: 29900,
    [BILLING_CYCLES.YEARLY]: 299000, // 17% 할인
  },
} as const

// ================================================
// 플랜별 사용량 제한
// ================================================
export const PLAN_LIMITS = {
  [PLAN_TYPES.FREE]: {
    applicationsPerMonth: 5,
    activeOpportunities: 1,
    matchScoreVisible: 3, // Top 3만 표시
    matchReasonDetail: 'summary', // 요약만
    profileVisitorView: false,
    advancedFilters: false,
    eventAlertDays: 3, // 3일 전 알림
    supportLevel: 'community',
  },
  [PLAN_TYPES.PRO]: {
    applicationsPerMonth: 30,
    activeOpportunities: 5,
    matchScoreVisible: -1, // 전체 보기 (-1 = unlimited)
    matchReasonDetail: 'full', // 전체
    profileVisitorView: true,
    advancedFilters: true,
    eventAlertDays: 7, // 7일 전 알림
    supportLevel: 'email_48h',
  },
  [PLAN_TYPES.TEAM]: {
    applicationsPerMonth: -1, // 무제한
    activeOpportunities: 20,
    matchScoreVisible: -1,
    matchReasonDetail: 'full_with_suggestions', // 전체 + 개선 제안
    profileVisitorView: true,
    advancedFilters: true,
    eventAlertDays: 14, // 14일 전 알림
    supportLevel: 'priority_24h',
  },
} as const

export type PlanLimits = (typeof PLAN_LIMITS)[PlanType]

// ================================================
// 부스트 상품 타입
// ================================================
export const BOOST_TYPES = {
  OPPORTUNITY_BOOST: 'opportunity_boost',
  OPPORTUNITY_PREMIUM: 'opportunity_premium',
  PROFILE_SPOTLIGHT: 'profile_spotlight',
  WEEKLY_FEATURE: 'weekly_feature',
} as const

export type BoostType = (typeof BOOST_TYPES)[keyof typeof BOOST_TYPES]

// ================================================
// 부스트 상품 가격 및 기간
// ================================================
export const BOOST_PRODUCTS = {
  [BOOST_TYPES.OPPORTUNITY_BOOST]: {
    name: 'Opportunity 부스트',
    description: '검색 상위 5개 고정',
    price: 5000,
    durationHours: 24,
  },
  [BOOST_TYPES.OPPORTUNITY_PREMIUM]: {
    name: 'Opportunity 프리미엄',
    description: '상위 고정 + 하이라이트 배경',
    price: 15000,
    durationHours: 24 * 7, // 7일
  },
  [BOOST_TYPES.PROFILE_SPOTLIGHT]: {
    name: '프로필 스포트라이트',
    description: '지원자 목록 상단',
    price: 3000,
    durationHours: 24,
  },
  [BOOST_TYPES.WEEKLY_FEATURE]: {
    name: 'Weekly Feature',
    description: '대시보드 추천 섹션',
    price: 30000,
    durationHours: 24 * 7, // 7일
  },
} as const

export type BoostProduct = (typeof BOOST_PRODUCTS)[BoostType]

// ================================================
// 구독 기능 (Feature Gate용)
// ================================================
export const SUBSCRIPTION_FEATURES = {
  UNLIMITED_APPLICATIONS: 'unlimited_applications',
  MULTIPLE_OPPORTUNITIES: 'multiple_opportunities',
  FULL_MATCH_SCORES: 'full_match_scores',
  DETAILED_MATCH_REASON: 'detailed_match_reason',
  MATCH_IMPROVEMENT_SUGGESTIONS: 'match_improvement_suggestions',
  PROFILE_VISITORS: 'profile_visitors',
  ADVANCED_FILTERS: 'advanced_filters',
  EXTENDED_EVENT_ALERTS: 'extended_event_alerts',
  PRIORITY_SUPPORT: 'priority_support',
  PRO_BADGE: 'pro_badge',
  TEAM_BADGE: 'team_badge',
} as const

export type SubscriptionFeature =
  (typeof SUBSCRIPTION_FEATURES)[keyof typeof SUBSCRIPTION_FEATURES]

// ================================================
// 기능별 필요 플랜
// ================================================
export const FEATURE_REQUIREMENTS: Record<SubscriptionFeature, PlanType[]> = {
  [SUBSCRIPTION_FEATURES.UNLIMITED_APPLICATIONS]: [PLAN_TYPES.TEAM],
  [SUBSCRIPTION_FEATURES.MULTIPLE_OPPORTUNITIES]: [PLAN_TYPES.PRO, PLAN_TYPES.TEAM],
  [SUBSCRIPTION_FEATURES.FULL_MATCH_SCORES]: [PLAN_TYPES.PRO, PLAN_TYPES.TEAM],
  [SUBSCRIPTION_FEATURES.DETAILED_MATCH_REASON]: [PLAN_TYPES.PRO, PLAN_TYPES.TEAM],
  [SUBSCRIPTION_FEATURES.MATCH_IMPROVEMENT_SUGGESTIONS]: [PLAN_TYPES.TEAM],
  [SUBSCRIPTION_FEATURES.PROFILE_VISITORS]: [PLAN_TYPES.PRO, PLAN_TYPES.TEAM],
  [SUBSCRIPTION_FEATURES.ADVANCED_FILTERS]: [PLAN_TYPES.PRO, PLAN_TYPES.TEAM],
  [SUBSCRIPTION_FEATURES.EXTENDED_EVENT_ALERTS]: [PLAN_TYPES.PRO, PLAN_TYPES.TEAM],
  [SUBSCRIPTION_FEATURES.PRIORITY_SUPPORT]: [PLAN_TYPES.TEAM],
  [SUBSCRIPTION_FEATURES.PRO_BADGE]: [PLAN_TYPES.PRO, PLAN_TYPES.TEAM],
  [SUBSCRIPTION_FEATURES.TEAM_BADGE]: [PLAN_TYPES.TEAM],
}

// ================================================
// 플랜 정보 (UI용)
// ================================================
export const PLAN_INFO = {
  [PLAN_TYPES.FREE]: {
    name: 'Free',
    nameKo: '무료',
    description: '일반 사용자, 탐색 목적',
    color: 'gray',
    features: [
      '월 5회 지원',
      '활성 Opportunity 1개',
      'AI 매칭 점수 Top 3',
      '매칭 이유 요약',
      '3일 전 이벤트 알림',
    ],
  },
  [PLAN_TYPES.PRO]: {
    name: 'Pro',
    nameKo: '프로',
    description: '적극적 구직자/팀빌더',
    color: 'blue',
    badge: 'Pro',
    features: [
      '월 30회 지원',
      '활성 Opportunity 5개',
      'AI 매칭 점수 전체 보기',
      '매칭 이유 상세',
      '프로필 방문자 확인',
      '고급 필터링',
      '7일 전 이벤트 알림',
      'Pro 배지',
      '이메일 48h 지원',
    ],
  },
  [PLAN_TYPES.TEAM]: {
    name: 'Team',
    nameKo: '팀',
    description: '스타트업/소규모 팀',
    color: 'purple',
    badge: 'Team',
    features: [
      '무제한 지원',
      '활성 Opportunity 20개',
      'AI 매칭 점수 전체 + 상세 분석',
      '매칭 이유 + 개선 제안',
      '프로필 방문자 확인',
      '고급 필터링',
      '14일 전 이벤트 알림',
      'Team 배지',
      '우선 24h 지원',
    ],
  },
} as const

export type PlanInfo = (typeof PLAN_INFO)[PlanType]

// ================================================
// 구독 상태
// ================================================
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  PAST_DUE: 'past_due',
  TRIALING: 'trialing',
} as const

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS]

// ================================================
// 에러 코드
// ================================================
export const SUBSCRIPTION_ERRORS = {
  APPLICATION_LIMIT_REACHED: 'APPLICATION_LIMIT_REACHED',
  OPPORTUNITY_LIMIT_REACHED: 'OPPORTUNITY_LIMIT_REACHED',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
} as const

export type SubscriptionError =
  (typeof SUBSCRIPTION_ERRORS)[keyof typeof SUBSCRIPTION_ERRORS]
