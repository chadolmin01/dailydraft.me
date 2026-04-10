import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// GET /api/clubs/[slug]/updates — 클럽 소속 전체 팀의 주간 업데이트 (운영자 뷰)
// 성민님 최우선 페인: "매주 각 MVP 팀 진행 과정 추적이 지옥"
// 이 엔드포인트가 그 고통을 한 화면으로 푼다.
export const GET = withErrorCapture(
  async (request, context) => {
    const { slug } = await context.params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const weekNumber = searchParams.get('week')
      ? parseInt(searchParams.get('week')!)
      : undefined
    const cohort = searchParams.get('cohort')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(parseInt(limitParam) || 50, 100) : 50

    // 1. 클럽 확인
    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!club) {
      return ApiResponse.notFound('클럽을 찾을 수 없습니다')
    }

    // 2. 클럽 소속 프로젝트 조회
    let oppQuery = supabase
      .from('opportunities')
      .select('id, title, status, creator_id, cohort')
      .eq('club_id', club.id)

    if (cohort) {
      oppQuery = oppQuery.eq('cohort', cohort)
    }

    const { data: opportunities, error: oppError } = await oppQuery

    if (oppError) {
      return ApiResponse.internalError(oppError.message)
    }

    if (!opportunities || opportunities.length === 0) {
      return ApiResponse.ok({
        projects: [],
        summary: { total_projects: 0, updated_this_week: 0, missing_updates: 0 },
      })
    }

    const oppIds = opportunities.map(o => o.id)
    const oppMap = new Map(opportunities.map(o => [o.id, o]))

    // 3. 해당 프로젝트들의 주간 업데이트 조회
    let updateQuery = supabase
      .from('project_updates')
      .select('id, opportunity_id, author_id, week_number, title, content, update_type, created_at')
      .in('opportunity_id', oppIds)
      .order('week_number', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (weekNumber !== undefined) {
      updateQuery = updateQuery.eq('week_number', weekNumber)
    }

    const { data: updates, error: updateError } = await updateQuery

    if (updateError) {
      return ApiResponse.internalError(updateError.message)
    }

    // 4. 작성자 프로필 일괄 조회
    const authorIds = [...new Set((updates || []).map(u => u.author_id).filter(Boolean))]
    let profileMap: Record<string, { nickname: string | null; avatar_url: string | null }> = {}
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nickname, avatar_url')
        .in('user_id', authorIds)

      profileMap = Object.fromEntries(
        (profiles || []).map(p => [p.user_id, { nickname: p.nickname, avatar_url: p.avatar_url }])
      )
    }

    // 5. 프로젝트별로 그룹핑
    const updatesByProject = new Map<string, typeof updates>()
    for (const u of updates || []) {
      const list = updatesByProject.get(u.opportunity_id) || []
      list.push(u)
      updatesByProject.set(u.opportunity_id, list)
    }

    // 6. 최신 주차 번호 계산 (summary용)
    const latestWeek = (updates || []).length > 0
      ? Math.max(...(updates || []).map(u => u.week_number))
      : 0

    const projectsWithUpdates = new Set(
      (updates || [])
        .filter(u => u.week_number === latestWeek)
        .map(u => u.opportunity_id)
    )

    const projects = opportunities.map(opp => {
      const projUpdates = updatesByProject.get(opp.id) || []
      const latestUpdate = projUpdates[0] || null

      return {
        id: opp.id,
        title: opp.title,
        status: opp.status,
        cohort: opp.cohort,
        latest_update: latestUpdate
          ? {
              id: latestUpdate.id,
              week_number: latestUpdate.week_number,
              title: latestUpdate.title,
              content: latestUpdate.content,
              update_type: latestUpdate.update_type,
              created_at: latestUpdate.created_at,
              author: profileMap[latestUpdate.author_id] || null,
            }
          : null,
        update_count: projUpdates.length,
        has_latest_week: projectsWithUpdates.has(opp.id),
      }
    })

    // 미제출 팀 먼저, 그 다음 최신순 정렬
    projects.sort((a, b) => {
      if (a.has_latest_week !== b.has_latest_week) {
        return a.has_latest_week ? 1 : -1
      }
      return (b.latest_update?.created_at ?? '') > (a.latest_update?.created_at ?? '') ? 1 : -1
    })

    return ApiResponse.ok({
      projects,
      summary: {
        total_projects: opportunities.length,
        updated_this_week: projectsWithUpdates.size,
        missing_updates: opportunities.length - projectsWithUpdates.size,
        latest_week: latestWeek,
      },
    })
  }
)
