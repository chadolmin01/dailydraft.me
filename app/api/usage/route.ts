/**
 * 사용량 조회 API
 * GET /api/usage - 현재 사용자의 전체 사용량 조회
 */

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { getUserUsageWithLimits } from '@/src/lib/subscription/usage-checker'
import { getUsageStats, RATE_LIMITS } from '@/src/lib/rate-limit'
import { PLAN_INFO } from '@/src/lib/subscription/constants'
import { ApiResponse } from '@/src/lib/api-utils'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const adminClient = createAdminClient()

    // 구독 및 사용량 정보 조회
    const usageWithLimits = await getUserUsageWithLimits(adminClient, user.id)

    // API Rate limit 사용량
    const apiUsage = getUsageStats(`user:${user.id}`, usageWithLimits.planType)
    const rateLimits = RATE_LIMITS[usageWithLimits.planType]

    // 활성 Opportunity 수 조회
    const { count: activeOpportunities } = await adminClient
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', user.id)
      .eq('status', 'active')

    // 이번 달 이벤트 북마크 수
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: bookmarksThisMonth } = await adminClient
      .from('event_bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())

    // 이번 달 지원 횟수 (applications 테이블 사용)
    const { count: applicationsThisMonth } = await adminClient
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('applicant_id', user.id)
      .gte('created_at', startOfMonth.toISOString())

    const planInfo = PLAN_INFO[usageWithLimits.planType]

    return ApiResponse.ok({
      success: true,
      data: {
        // 플랜 정보
        plan: {
          type: usageWithLimits.planType,
          name: planInfo.name,
          nameKo: planInfo.nameKo,
          status: usageWithLimits.subscription.status,
          currentPeriodEnd: usageWithLimits.subscription.currentPeriodEnd,
        },

        // 기능 사용량
        usage: {
          // 지원 횟수
          applications: {
            used: usageWithLimits.applications.used,
            limit: usageWithLimits.applications.limit,
            remaining: usageWithLimits.applications.remaining,
            unlimited: usageWithLimits.applications.limit === -1,
          },

          // 활성 Opportunity
          opportunities: {
            used: activeOpportunities || 0,
            limit: usageWithLimits.limits.activeOpportunities,
            remaining: Math.max(0, usageWithLimits.limits.activeOpportunities - (activeOpportunities || 0)),
          },

          // 이벤트 관련
          eventBookmarks: bookmarksThisMonth || 0,
          applicationsThisMonth: applicationsThisMonth || 0,

          // 기간 정보
          period: {
            start: usageWithLimits.usage.periodStart,
            end: usageWithLimits.usage.periodEnd,
          },
        },

        // API Rate Limit 사용량
        apiUsage: {
          minute: {
            used: apiUsage.minute.used,
            limit: rateLimits.requestsPerMinute,
            remaining: rateLimits.requestsPerMinute - apiUsage.minute.used,
            resetAt: new Date(apiUsage.minute.resetAt).toISOString(),
          },
          hour: {
            used: apiUsage.hour.used,
            limit: rateLimits.requestsPerHour,
            remaining: rateLimits.requestsPerHour - apiUsage.hour.used,
            resetAt: new Date(apiUsage.hour.resetAt).toISOString(),
          },
          day: {
            used: apiUsage.day.used,
            limit: rateLimits.requestsPerDay,
            remaining: rateLimits.requestsPerDay - apiUsage.day.used,
            resetAt: new Date(apiUsage.day.resetAt).toISOString(),
          },
        },

        // 플랜 기능
        features: usageWithLimits.limits,
      },
    })
  } catch (error) {
    console.error('Error fetching usage:', error)
    return ApiResponse.internalError('사용량 정보를 불러올 수 없습니다')
  }
}
