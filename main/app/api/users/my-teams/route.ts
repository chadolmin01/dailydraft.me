import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

// GET: Fetch projects where the current user is an active team member (not creator)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    // Get active connections
    const { data: connections, error } = await supabase
      .from('accepted_connections')
      .select('opportunity_id, assigned_role, connected_at')
      .eq('applicant_id', user.id)
      .eq('status', 'active')
      .order('connected_at', { ascending: false })

    if (error || !connections || connections.length === 0) {
      return ApiResponse.ok([])
    }

    // Fetch opportunity details
    const oppIds = connections.map(c => c.opportunity_id).filter((id): id is string => !!id)
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('id, title, description, status, type, creator_id, demo_images, needed_roles, interest_tags, created_at')
      .in('id', oppIds)

    if (!opportunities) return ApiResponse.ok([])

    // Fetch creator profiles
    const creatorIds = [...new Set(opportunities.map(o => o.creator_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, nickname, desired_position')
      .in('user_id', creatorIds)

    const profileMap = new Map((profiles || []).map(p => [(p as any).user_id, p]))
    const connMap = new Map(connections.map(c => [c.opportunity_id, c]))

    const result = opportunities.map(opp => ({
      ...opp,
      my_role: connMap.get(opp.id)?.assigned_role || null,
      joined_at: connMap.get(opp.id)?.connected_at || null,
      creator: profileMap.get(opp.creator_id) || null,
    }))

    return ApiResponse.ok(result)
  } catch (error) {
    console.error('My teams error:', error)
    return ApiResponse.internalError()
  }
}
