import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/**
 * GET /api/clubs/[slug]/teams — 클럽 소속 팀(프로젝트)별 멤버 + 현황
 *
 * 두 가지 뷰를 한 번에 제공:
 * 1. 팀 로스터: 어떤 팀에 누가 있는지
 * 2. 팀 현황: 이번 주 업데이트 제출 여부, 주차 정보
 *
 * accepted_connections RLS가 creator/applicant만 허용하므로
 * 클럽 admin은 adminClient로 조회
 */
export const GET = withErrorCapture(
  async (request, context) => {
    const { slug } = await context.params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const cohort = searchParams.get('cohort')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    // 1. 클럽 확인 + 권한 체크
    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

    // 멤버 여부 확인 (로스터는 멤버면 볼 수 있음)
    const admin = createAdminClient()
    const { data: membership } = await admin
      .from('club_members')
      .select('role')
      .eq('club_id', club.id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!membership) return ApiResponse.forbidden('클럽 멤버만 조회할 수 있습니다')

    // 2. 클럽 소속 프로젝트 조회
    let oppQuery = admin
      .from('opportunities')
      .select('id, title, status, creator_id, cohort, created_at')
      .eq('club_id', club.id)
      .order('created_at', { ascending: false })

    if (cohort) {
      oppQuery = oppQuery.eq('cohort', cohort)
    }

    const { data: opportunities, error: oppError } = await oppQuery
    if (oppError) return ApiResponse.internalError(oppError.message)
    if (!opportunities || opportunities.length === 0) {
      return ApiResponse.ok({ teams: [], summary: { total_teams: 0, updated_this_week: 0, missing_updates: 0 } })
    }

    const oppIds = opportunities.map(o => o.id)

    // 3. 병렬: 팀원(accepted_connections) + 업데이트 + 크리에이터 프로필
    const [connectionsRes, updatesRes] = await Promise.all([
      // 팀원 조회 (admin client — RLS 우회)
      admin
        .from('accepted_connections')
        .select('id, opportunity_id, applicant_id, assigned_role, connected_at')
        .in('opportunity_id', oppIds)
        .eq('status', 'active'),

      // 최근 업데이트 조회
      admin
        .from('project_updates')
        .select('id, opportunity_id, week_number, title, update_type, created_at')
        .in('opportunity_id', oppIds)
        .order('created_at', { ascending: false }),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connections: any[] = connectionsRes.data || []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any[] = updatesRes.data || []

    // 4. 프로필 일괄 조회 (팀원 + 크리에이터)
    const allUserIds = new Set<string>()
    for (const c of connections) allUserIds.add(c.applicant_id)
    for (const o of opportunities) allUserIds.add(o.creator_id)

    const profileMap = new Map<string, { nickname: string | null; avatar_url: string | null; desired_position: string | null }>()

    if (allUserIds.size > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('user_id, nickname, avatar_url, desired_position')
        .in('user_id', [...allUserIds])

      for (const p of profiles || []) {
        profileMap.set(p.user_id, {
          nickname: p.nickname,
          avatar_url: p.avatar_url,
          desired_position: p.desired_position,
        })
      }
    }

    // 5. 프로젝트별 그룹핑
    const connectionsByOpp = new Map<string, typeof connections>()
    for (const c of connections) {
      const list = connectionsByOpp.get(c.opportunity_id) || []
      list.push(c)
      connectionsByOpp.set(c.opportunity_id, list)
    }

    const updatesByOpp = new Map<string, typeof updates>()
    for (const u of updates) {
      const list = updatesByOpp.get(u.opportunity_id) || []
      list.push(u)
      updatesByOpp.set(u.opportunity_id, list)
    }

    // 6. 현재 주차 계산 (가장 최근 업데이트 기준)
    const latestWeek = updates.length > 0
      ? Math.max(...updates.map(u => u.week_number))
      : 0

    const updatedThisWeek = new Set(
      updates.filter(u => u.week_number === latestWeek).map(u => u.opportunity_id)
    )

    // 7. 응답 조립
    const teams = opportunities.map(opp => {
      const teamConnections = connectionsByOpp.get(opp.id) || []
      const teamUpdates = updatesByOpp.get(opp.id) || []
      const latestUpdate = teamUpdates[0] || null

      // 크리에이터 + 팀원
      const creatorProfile = profileMap.get(opp.creator_id)
      const members = [
        // 크리에이터 (리더)
        {
          user_id: opp.creator_id,
          nickname: creatorProfile?.nickname || null,
          avatar_url: creatorProfile?.avatar_url || null,
          role: 'leader',
          position: creatorProfile?.desired_position || null,
        },
        // 팀원들
        ...teamConnections.map(c => {
          const profile = profileMap.get(c.applicant_id)
          return {
            user_id: c.applicant_id,
            nickname: profile?.nickname || null,
            avatar_url: profile?.avatar_url || null,
            role: c.assigned_role || 'member',
            position: profile?.desired_position || null,
          }
        }),
      ]

      // 프로젝트 생성일 기준 주차 계산
      const createdAt = new Date(opp.created_at as string)
      const now = new Date()
      const weeksSinceCreation = Math.max(1, Math.ceil(
        (now.getTime() - createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000)
      ))

      // 업데이트 상태 판단
      let updateStatus: 'complete' | 'missing' | 'overdue'
      if (updatedThisWeek.has(opp.id)) {
        updateStatus = 'complete'
      } else if (latestUpdate) {
        const daysSinceUpdate = (now.getTime() - new Date(latestUpdate.created_at).getTime()) / (24 * 60 * 60 * 1000)
        updateStatus = daysSinceUpdate > 14 ? 'overdue' : 'missing'
      } else {
        updateStatus = teamUpdates.length === 0 ? 'missing' : 'overdue'
      }

      return {
        id: opp.id,
        title: opp.title,
        status: opp.status,
        cohort: opp.cohort,
        created_at: opp.created_at,
        members,
        member_count: members.length,
        current_week: weeksSinceCreation,
        update_count: teamUpdates.length,
        update_status: updateStatus,
        latest_update: latestUpdate
          ? {
              week_number: latestUpdate.week_number,
              title: latestUpdate.title,
              update_type: latestUpdate.update_type,
              created_at: latestUpdate.created_at,
            }
          : null,
      }
    })

    // 미제출 팀 먼저
    teams.sort((a, b) => {
      const statusOrder = { overdue: 0, missing: 1, complete: 2 }
      return (statusOrder[a.update_status] ?? 1) - (statusOrder[b.update_status] ?? 1)
    })

    return ApiResponse.ok({
      teams,
      summary: {
        total_teams: teams.length,
        updated_this_week: updatedThisWeek.size,
        missing_updates: teams.length - updatedThisWeek.size,
        latest_week: latestWeek,
      },
    })
  }
)
