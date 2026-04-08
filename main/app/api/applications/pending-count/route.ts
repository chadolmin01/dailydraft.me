import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// GET: Get count of pending applications for user's opportunities
export const GET = withErrorCapture(async () => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  const { data: myOpportunitiesData } = await supabase
    .from('opportunities')
    .select('id')
    .eq('creator_id', user.id)

  const myOpportunities = myOpportunitiesData as { id: string }[] | null

  if (!myOpportunities || myOpportunities.length === 0) {
    return ApiResponse.ok({ count: 0 })
  }

  const opportunityIds = myOpportunities.map((o) => o.id)

  const { count, error } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .in('opportunity_id', opportunityIds)
    .in('status', ['pending', 'interviewing'])

  if (error) {
    console.error('pending-count error:', error.message)
    return ApiResponse.internalError()
  }

  return ApiResponse.ok({ count: count || 0 })
})
