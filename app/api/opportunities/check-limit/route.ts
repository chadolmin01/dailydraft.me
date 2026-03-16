import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { checkOpportunityLimit, getUserSubscription } from '@/src/lib/subscription/usage-checker'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const [limitResult, subscription] = await Promise.all([
      checkOpportunityLimit(supabase, user.id),
      getUserSubscription(supabase, user.id),
    ])

    return ApiResponse.ok({
      allowed: limitResult.allowed,
      current: limitResult.current,
      limit: limitResult.limit,
      remaining: limitResult.remaining,
      planType: subscription.planType,
      message: limitResult.message,
    })
  } catch (error) {
    return ApiResponse.internalError(
      'Opportunity 제한 확인 중 오류가 발생했습니다',
      undefined
    )
  }
}
