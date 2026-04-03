import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { getInstitutionId } from '@/src/lib/institution/auth'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return ApiResponse.unauthorized()

    const institutionId = await getInstitutionId(supabase, user.id)
    if (!institutionId) return ApiResponse.forbidden('기관 관리자 권한이 필요합니다')

    // Parallel: institution info + all members (not just students)
    const [institutionResult, allMembersResult] = await Promise.all([
      supabase
        .from('institutions')
        .select('name, university, type')
        .eq('id', institutionId)
        .single(),
      supabase
        .from('institution_members')
        .select('user_id, role, joined_at')
        .eq('institution_id', institutionId)
        .eq('status', 'active'),
    ])

    const institution = institutionResult.data
    const allMembers = allMembersResult.data || []
    const studentMembers = allMembers.filter((m) => m.role === 'student')
    const mentorCount = allMembers.filter((m) => m.role === 'mentor').length
    const memberIds = allMembers.map((m) => m.user_id)
    const studentIds = studentMembers.map((m) => m.user_id)

    // Guard against unbounded .in() clauses (PostgREST URL length limit)
    if (memberIds.length > 500) {
      return ApiResponse.badRequest('소속 멤버가 500명을 초과합니다. 관리자에게 문의해주세요.')
    }

    if (memberIds.length === 0) {
      return ApiResponse.ok({
        period: `${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월`,
        generatedAt: new Date().toISOString(),
        institution: institution || { name: '', university: '', type: '' },
        stats: {
          totalMembers: 0,
          activeStudents: 0,
          mentors: 0,
          teamsFormed: 0,
          businessPlans: 0,
          activeOpportunities: 0,
          applicationsCount: 0,
          recentJoins: 0,
        },
        members: [],
        teams: [],
      })
    }

    // Parallel: profiles, teams, business plans, recent joins
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const [profilesResult, teamsResult, plansResult, recentJoinsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('user_id, nickname, major, skills, interest_tags')
        .in('user_id', memberIds),
      supabase
        .from('opportunities')
        .select('id, title, creator_id, status, created_at')
        .in('creator_id', memberIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('validated_ideas')
        .select('user_id')
        .in('user_id', memberIds),
      supabase
        .from('institution_members')
        .select('*', { count: 'exact', head: true })
        .eq('institution_id', institutionId)
        .gte('joined_at', sevenDaysAgo),
    ])

    const profileMap: Record<string, any> = {}
    ;(profilesResult.data || []).forEach((p) => { profileMap[p.user_id] = p })

    const teams = teamsResult.data || []
    const plans = plansResult.data || []
    const recentJoins = recentJoinsResult.count || 0

    // Get application counts, activity metrics for teams (depends on team IDs)
    const opportunityIds = teams.map((t) => t.id)
    let applications: { opportunity_id: string }[] = []
    let teamMemberCounts: Record<string, number> = {}
    let updateCounts: Record<string, number> = {}
    let lastUpdateAt: Record<string, string> = {}
    let coffeeChatCounts: Record<string, number> = {}
    if (opportunityIds.length > 0) {
      const [appResult, acceptedResult, updatesResult, coffeeChatsResult] = await Promise.all([
        supabase
          .from('applications')
          .select('opportunity_id')
          .in('opportunity_id', opportunityIds),
        supabase
          .from('applications')
          .select('opportunity_id')
          .in('opportunity_id', opportunityIds)
          .eq('status', 'accepted'),
        supabase
          .from('project_updates')
          .select('opportunity_id, created_at')
          .in('opportunity_id', opportunityIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('coffee_chats')
          .select('opportunity_id')
          .in('opportunity_id', opportunityIds),
      ])
      applications = appResult.data || []

      ;(acceptedResult.data || []).forEach((a) => {
        teamMemberCounts[a.opportunity_id] = (teamMemberCounts[a.opportunity_id] || 0) + 1
      })

      // Aggregate update counts and last update time
      ;(updatesResult.data || []).forEach((u) => {
        updateCounts[u.opportunity_id] = (updateCounts[u.opportunity_id] || 0) + 1
        if (!lastUpdateAt[u.opportunity_id]) {
          lastUpdateAt[u.opportunity_id] = u.created_at // already ordered desc
        }
      })

      // Aggregate coffee chat counts
      ;(coffeeChatsResult.data || []).forEach((c) => {
        if (c.opportunity_id) {
          coffeeChatCounts[c.opportunity_id] = (coffeeChatCounts[c.opportunity_id] || 0) + 1
        }
      })
    }

    // Get creator nicknames from profileMap (already fetched)
    const creatorNames: Record<string, string> = {}
    Object.entries(profileMap).forEach(([userId, profile]) => {
      creatorNames[userId] = profile.nickname
    })

    // Build reports
    const planCountByUser = plans.reduce((acc: Record<string, number>, p) => {
      acc[p.user_id] = (acc[p.user_id] || 0) + 1
      return acc
    }, {})

    const teamCountByUser = teams.reduce((acc: Record<string, number>, t) => {
      acc[t.creator_id] = (acc[t.creator_id] || 0) + 1
      return acc
    }, {})

    const memberReport = studentMembers.map((m) => {
      const profile = profileMap[m.user_id]
      return {
        name: profile?.nickname || '이름 없음',
        major: profile?.major || null,
        skills: (profile?.skills || []).map((s: any) => s.name),
        teamCount: teamCountByUser[m.user_id] || 0,
        businessPlanCount: planCountByUser[m.user_id] || 0,
        joinedAt: m.joined_at,
      }
    })

    const teamReport = teams.map((t) => ({
      id: t.id,
      title: t.title,
      creator: creatorNames[t.creator_id] || '알 수 없음',
      memberCount: (teamMemberCounts?.[t.id] || 0) + 1, // +1 for creator
      status: t.status,
      createdAt: t.created_at,
      updateCount: updateCounts[t.id] || 0,
      lastUpdateAt: lastUpdateAt[t.id] || null,
      coffeeChatCount: coffeeChatCounts[t.id] || 0,
    }))

    return ApiResponse.ok({
      period: `${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월`,
      generatedAt: new Date().toISOString(),
      institution: institution || { name: '', university: '', type: '' },
      stats: {
        totalMembers: memberIds.length,
        activeStudents: studentIds.length,
        mentors: mentorCount,
        teamsFormed: teams.length,
        businessPlans: plans.length,
        activeOpportunities: teams.filter((t) => t.status === 'active').length,
        applicationsCount: applications.length,
        recentJoins,
      },
      members: memberReport,
      teams: teamReport,
    })
  } catch {
    return ApiResponse.internalError('리포트 생성 중 오류가 발생했습니다')
  }
}
