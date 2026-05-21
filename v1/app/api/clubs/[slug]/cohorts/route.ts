import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const runtime = 'nodejs'

/**
 * GET /api/clubs/[slug]/cohorts
 *
 * 클럽의 모든 기수 목록 + per-기수 요약 (멤버 수, 졸업 비율, 최근 활동).
 *
 * "운영 기록" 누적이 Draft 의 핵심 약속인데 그동안 운영자가 과거 기수를
 * 훑어볼 수 있는 단일 진입점이 없었음. /clubs/[slug]/cohorts 페이지 제공용.
 */
export const GET = withErrorCapture(
  async (_request: NextRequest, ctx: { params: Promise<{ slug: string }> }) => {
    const { slug } = await ctx.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const { data: club } = await supabase
      .from('clubs')
      .select('id, name')
      .eq('slug', slug)
      .maybeSingle()
    if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

    // 현재 유저가 클럽 멤버인지 확인 (admin/member 둘 다 허용)
    const { data: membership } = await supabase
      .from('club_members')
      .select('role, status')
      .eq('club_id', club.id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!membership) return ApiResponse.forbidden('클럽 멤버만 조회 가능합니다')

    // 모든 멤버를 가져와 기수별로 집계
    const { data: members } = await supabase
      .from('club_members')
      .select('cohort, status, joined_at')
      .eq('club_id', club.id)
      .not('cohort', 'is', null)

    // 집계: 기수별 total/active/alumni, earliest joined_at
    interface Agg {
      total: number
      active: number
      alumni: number
      earliest: string | null
      latest: string | null
    }
    const byCohort: Record<string, Agg> = {}
    for (const m of members ?? []) {
      const c = m.cohort as string | null
      if (!c) continue
      if (!byCohort[c]) {
        byCohort[c] = { total: 0, active: 0, alumni: 0, earliest: null, latest: null }
      }
      const agg = byCohort[c]
      agg.total += 1
      if (m.status === 'alumni') agg.alumni += 1
      else if (m.status === 'active') agg.active += 1
      if (m.joined_at) {
        if (!agg.earliest || m.joined_at < agg.earliest) agg.earliest = m.joined_at
        if (!agg.latest || m.joined_at > agg.latest) agg.latest = m.joined_at
      }
    }

    // 기수별 프로젝트 수도 집계 (opportunities.cohort)
    const { data: opps } = await supabase
      .from('opportunities')
      .select('cohort, status')
      .eq('club_id', club.id)
      .not('cohort', 'is', null)
    const projectsByCohort: Record<string, { total: number; active: number }> = {}
    for (const o of opps ?? []) {
      const c = o.cohort as string | null
      if (!c) continue
      if (!projectsByCohort[c]) projectsByCohort[c] = { total: 0, active: 0 }
      projectsByCohort[c].total += 1
      if (o.status === 'active') projectsByCohort[c].active += 1
    }

    const items = Object.entries(byCohort)
      .map(([cohort, agg]) => ({
        cohort,
        member_count: agg.total,
        active_count: agg.active,
        alumni_count: agg.alumni,
        first_joined_at: agg.earliest,
        last_joined_at: agg.latest,
        project_count: projectsByCohort[cohort]?.total ?? 0,
        active_project_count: projectsByCohort[cohort]?.active ?? 0,
        // 상태: active 멤버가 0 이면 완전 졸업, 나머지는 진행 중
        status: agg.active === 0 ? 'graduated' : 'ongoing',
      }))
      .sort((a, b) => {
        // 기수 문자열 역순 정렬 (최신 기수가 위). 숫자 우선, 아니면 문자열 비교.
        const na = Number(a.cohort)
        const nb = Number(b.cohort)
        if (!isNaN(na) && !isNaN(nb)) return nb - na
        return b.cohort.localeCompare(a.cohort, 'ko')
      })

    return ApiResponse.ok({ club: { id: club.id, name: club.name }, cohorts: items })
  },
)
