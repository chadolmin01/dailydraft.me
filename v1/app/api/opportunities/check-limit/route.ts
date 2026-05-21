import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { checkOpportunityLimit, getUserSubscription } from '@/src/lib/subscription/usage-checker'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const GET = withErrorCapture(async () => {
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
})
