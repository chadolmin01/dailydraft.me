import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { getInstitutionId } from '@/src/lib/institution/auth'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const GET = withErrorCapture(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return ApiResponse.unauthorized()

  const institutionId = await getInstitutionId(supabase, user.id)
  if (!institutionId) return ApiResponse.forbidden('기관 관리자 권한이 필요합니다')

  // Get all member user_ids for this institution
  const { data: members } = await supabase
    .from('institution_members')
    .select('user_id, role')
    .eq('institution_id', institutionId)
    .eq('status', 'active')

  const memberIds = (members || []).map((m) => m.user_id)
  const studentIds = (members || []).filter((m) => m.role === 'student').map((m) => m.user_id)
  const mentorCount = (members || []).filter((m) => m.role === 'mentor').length

  // Guard against unbounded .in() clauses
  if (memberIds.length > 500) {
    return ApiResponse.badRequest('소속 멤버가 500명을 초과합니다. 관리자에게 문의해주세요.')
  }

  if (memberIds.length === 0) {
    return ApiResponse.ok({
      totalMembers: 0,
      activeStudents: 0,
      mentors: 0,
      teamsFormed: 0,
      businessPlans: 0,
      activeOpportunities: 0,
      applicationsCount: 0,
      recentJoins: 0,
    })
  }

  // Parallel queries for stats
  const [
    { count: teamsFormed },
    { count: businessPlans },
    { count: activeOpportunities },
    opportunityIdsResult,
    { count: recentJoins },
  ] = await Promise.all([
    supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .in('creator_id', memberIds),
    supabase
      .from('validated_ideas')
      .select('*', { count: 'exact', head: true })
      .in('user_id', memberIds),
    supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .in('creator_id', memberIds)
      .eq('status', 'active'),
    supabase
      .from('opportunities')
      .select('id')
      .in('creator_id', memberIds),
    supabase
      .from('institution_members')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', institutionId)
      .gte('joined_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  // Get application count separately (depends on opportunity IDs)
  const oppIds = (opportunityIdsResult.data || []).map((o) => o.id)
  let applicationsCount = 0
  if (oppIds.length > 0) {
    const { count } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .in('opportunity_id', oppIds)
    applicationsCount = count || 0
  }

  return ApiResponse.ok({
    totalMembers: memberIds.length,
    activeStudents: studentIds.length,
    mentors: mentorCount,
    teamsFormed: teamsFormed || 0,
    businessPlans: businessPlans || 0,
    activeOpportunities: activeOpportunities || 0,
    applicationsCount,
    recentJoins: recentJoins || 0,
  })
})
