/**
 * GET /api/clubs/[slug]/cohorts/[cohort]/snapshot — 기수 종료 아카이브 스냅샷
 *
 * 특정 기수의 전체 활동 기록 집계. 창업지원단 반기보고 · 졸업생 포트폴리오 용도.
 *
 * 반환:
 *   cohort_meta: 기수명, 멤버 수, 프로젝트 수, 기간
 *   members: 멤버 리스트 + 역할 + 참여 프로젝트
 *   projects: 프로젝트 + 주간 업데이트 전체 + 단계 + 팀 구성
 *   summary: 총 업데이트, 의사결정, 리소스, 메시지 집계
 *
 * 권한: 클럽 멤버 이상 (공개 스냅샷은 별도 공유 링크로 추후)
 */

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const runtime = 'nodejs'
export const maxDuration = 30

export const GET = withErrorCapture(async (_request, context) => {
  const { slug, cohort } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { data: club } = await supabase
    .from('clubs')
    .select('id, name, slug, description, category')
    .eq('slug', slug)
    .maybeSingle()

  if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

  const { data: membership } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership) return ApiResponse.forbidden('클럽 멤버만 스냅샷을 조회할 수 있습니다')

  const admin = createAdminClient()

  // 멤버 (해당 기수)
  const { data: cohortMembers = [] } = await admin
    .from('club_members')
    .select('user_id, role, cohort, status, joined_at')
    .eq('club_id', club.id)
    .eq('cohort', cohort)

  // 프로젝트 (해당 기수)
  const { data: cohortProjects = [] } = await admin
    .from('opportunities')
    .select('id, title, description, status, cohort, creator_id, created_at, interest_tags, needed_roles')
    .eq('club_id', club.id)
    .eq('cohort', cohort)
    .order('created_at', { ascending: false })

  const oppIds = (cohortProjects ?? []).map(p => p.id)
  const memberIds = Array.from(new Set([
    ...((cohortMembers ?? []).map(m => m.user_id)),
    ...((cohortProjects ?? []).map(p => p.creator_id)),
  ])).filter(Boolean) as string[]

  const [profilesRes, updatesRes, acceptedRes, decisionsRes, resourcesRes] = await Promise.all([
    memberIds.length
      ? admin.from('profiles').select('user_id, nickname, avatar_url, desired_position, university').in('user_id', memberIds)
      : Promise.resolve({ data: [] as Array<{ user_id: string; nickname: string | null; avatar_url: string | null; desired_position: string | null; university: string | null }> }),
    oppIds.length
      ? admin
          .from('project_updates')
          .select('id, opportunity_id, week_number, title, content, update_type, author_id, created_at')
          .in('opportunity_id', oppIds)
          .order('week_number', { ascending: true })
      : Promise.resolve({ data: [] as Array<{ id: string; opportunity_id: string; week_number: number; title: string; content: string; update_type: string; author_id: string; created_at: string | null }> }),
    oppIds.length
      ? admin
          .from('accepted_connections')
          .select('opportunity_id, applicant_id, assigned_role, status')
          .in('opportunity_id', oppIds)
          .eq('status', 'active')
      : Promise.resolve({ data: [] as Array<{ opportunity_id: string; applicant_id: string; assigned_role: string | null; status: string }> }),
    admin
      .from('team_decisions')
      .select('id, topic, result, decided_at, club_id')
      .eq('club_id', club.id),
    admin
      .from('team_resources')
      .select('id, url, label, resource_type, shared_by_name, created_at, club_id')
      .eq('club_id', club.id),
  ])

  const profiles = profilesRes.data ?? []
  const updates = updatesRes.data ?? []
  const accepted = acceptedRes.data ?? []
  const decisions = decisionsRes.data ?? []
  const resources = resourcesRes.data ?? []

  const profileMap = new Map(profiles.map(p => [p.user_id, p]))
  const updatesByOpp = new Map<string, typeof updates>()
  for (const u of updates) {
    const arr = updatesByOpp.get(u.opportunity_id) ?? []
    arr.push(u)
    updatesByOpp.set(u.opportunity_id, arr)
  }
  const acceptedByOpp = new Map<string, typeof accepted>()
  for (const a of accepted) {
    if (!a.opportunity_id) continue
    const arr = acceptedByOpp.get(a.opportunity_id) ?? []
    arr.push(a)
    acceptedByOpp.set(a.opportunity_id, arr)
  }

  // 기수 기간 추정
  const joinDates = (cohortMembers ?? []).map(m => m.joined_at).filter(Boolean) as string[]
  const startDate = joinDates.length > 0 ? new Date(Math.min(...joinDates.map(d => new Date(d).getTime()))).toISOString() : null
  const endDate = new Date().toISOString() // 일단 현재

  // 기수 내 의사결정/리소스 필터 (기간 기준)
  const rangeFilter = (iso: string | null) => {
    if (!iso) return false
    if (!startDate) return true
    return new Date(iso).getTime() >= new Date(startDate).getTime()
  }
  const cohortDecisions = decisions.filter(d => rangeFilter(d.decided_at))
  const cohortResources = resources.filter(r => rangeFilter(r.created_at))

  return ApiResponse.ok({
    club: { id: club.id, name: club.name, slug: club.slug, description: club.description, category: club.category },
    cohort_meta: {
      name: cohort,
      start_date: startDate,
      end_date: endDate,
      member_count: cohortMembers?.length ?? 0,
      project_count: cohortProjects?.length ?? 0,
    },
    members: (cohortMembers ?? []).filter(m => m.user_id).map(m => {
      const p = profileMap.get(m.user_id!)
      return {
        user_id: m.user_id,
        nickname: p?.nickname ?? null,
        avatar_url: p?.avatar_url ?? null,
        position: p?.desired_position ?? null,
        university: p?.university ?? null,
        role: m.role,
        status: m.status,
        joined_at: m.joined_at,
      }
    }),
    projects: (cohortProjects ?? []).map(p => {
      const teamUpdates = updatesByOpp.get(p.id) ?? []
      const teamAccepted = acceptedByOpp.get(p.id) ?? []
      const creatorProfile = profileMap.get(p.creator_id)
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status,
        created_at: p.created_at,
        interest_tags: p.interest_tags,
        creator: creatorProfile ? {
          user_id: p.creator_id,
          nickname: creatorProfile.nickname,
          position: creatorProfile.desired_position,
        } : null,
        team_members: teamAccepted.map(a => {
          const profile = profileMap.get(a.applicant_id)
          return {
            user_id: a.applicant_id,
            nickname: profile?.nickname ?? null,
            position: profile?.desired_position ?? null,
            role: a.assigned_role,
          }
        }),
        updates: teamUpdates.map(u => ({
          id: u.id,
          week_number: u.week_number,
          title: u.title,
          content: u.content,
          update_type: u.update_type,
          created_at: u.created_at,
        })),
      }
    }),
    summary: {
      total_updates: updates.length,
      total_decisions: cohortDecisions.length,
      total_resources: cohortResources.length,
    },
  })
})
