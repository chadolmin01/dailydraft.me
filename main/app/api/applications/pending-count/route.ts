import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

// GET: Get count of pending applications for user's opportunities
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    // Get user's opportunities
    const { data: myOpportunitiesData } = await supabase
      .from('opportunities')
      .select('id')
      .eq('creator_id', user.id)

    const myOpportunities = myOpportunitiesData as { id: string }[] | null

    if (!myOpportunities || myOpportunities.length === 0) {
      return ApiResponse.ok({ count: 0 })
    }

    const opportunityIds = myOpportunities.map((o) => o.id)

    // Count pending applications for these opportunities
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
  } catch (error) {
    console.error('pending-count error:', error)
    return ApiResponse.internalError()
  }
}
