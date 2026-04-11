import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/**
 * GET /api/clubs/[slug]/stats — 클럽 통계 집계
 *
 * 반환: 멤버 수(상태별), 기수별 멤버 수, 프로젝트 수, 업데이트 수, 활성 초대코드 수
 */
export const GET = withErrorCapture(
  async (_request, context) => {
    const { slug } = await context.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

    // 병렬로 모든 통계 쿼리 실행
    // status: 마이그레이션 적용 후 타입 재생성하면 정상화
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [membersRes, projectsRes, updatesRes, codesRes, pendingRes] = await Promise.all([
      // 전체 멤버 (active only, ghost 포함)
      (supabase as any)
        .from('club_members')
        .select('role, cohort, status, user_id')
        .eq('club_id', club.id),

      // 프로젝트 수
      supabase
        .from('opportunities')
        .select('id, cohort', { count: 'exact', head: false })
        .eq('club_id', club.id),

      // 주간 업데이트 수
      supabase
        .from('project_updates')
        .select('id', { count: 'exact', head: true })
        .in('opportunity_id',
          // 서브쿼리 대신 2단계 쿼리
          (await supabase
            .from('opportunities')
            .select('id')
            .eq('club_id', club.id)
          ).data?.map(o => o.id) || []
        ),

      // 활성 초대코드 수
      supabase
        .from('club_invite_codes')
        .select('id', { count: 'exact', head: true })
        .eq('club_id', club.id)
        .eq('is_active', true),

      // 승인 대기 수
      supabase
        .from('club_members')
        .select('id', { count: 'exact', head: true })
        .eq('club_id', club.id)
        .eq('status', 'pending'),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const members: any[] = membersRes.data || []

    // 멤버 상태별 집계
    const activeMembers = members.filter(m => m.status === 'active')
    const realMembers = activeMembers.filter(m => m.user_id !== null)
    const ghostMembers = activeMembers.filter(m => m.user_id === null)

    // 기수별 집계
    const cohortCounts: Record<string, number> = {}
    for (const m of activeMembers) {
      if (m.cohort) {
        cohortCounts[m.cohort] = (cohortCounts[m.cohort] || 0) + 1
      }
    }

    // 역할별 집계
    const roleCounts = {
      owner: activeMembers.filter(m => m.role === 'owner').length,
      admin: activeMembers.filter(m => m.role === 'admin').length,
      member: activeMembers.filter(m => m.role === 'member').length,
      alumni: members.filter(m => m.role === 'alumni').length,
    }

    return ApiResponse.ok({
      members: {
        total: activeMembers.length,
        real: realMembers.length,
        ghost: ghostMembers.length,
        by_role: roleCounts,
        by_cohort: cohortCounts,
      },
      pending_approvals: pendingRes.count ?? 0,
      projects: projectsRes.data?.length ?? 0,
      updates: updatesRes.count ?? 0,
      active_invite_codes: codesRes.count ?? 0,
    })
  }
)
