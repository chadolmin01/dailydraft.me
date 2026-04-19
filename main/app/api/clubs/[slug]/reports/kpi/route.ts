/**
 * GET /api/clubs/[slug]/reports/kpi — 정부/창업지원단 제출용 KPI 집계
 *
 * 왜: LINC 3.0 / RISE / 캠퍼스타운 등 정량·정성지표 증빙 자료 자동 생성.
 * Draft에 이미 쌓인 데이터만 조합하므로 운영진이 별도로 엑셀 집계할 필요 없음.
 *
 * Query:
 *   start: 집계 시작일 (ISO) — 생략 시 최근 90일
 *   end:   집계 종료일 (ISO) — 생략 시 오늘
 *   cohort: 기수 필터 (선택)
 *
 * 응답:
 *   period, counts(정량), cohorts(기수별), positions(직무별), activity(정성)
 *
 * 권한: 클럽 admin/owner 만.
 */

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const runtime = 'nodejs'
export const maxDuration = 30

export const GET = withErrorCapture(async (request, context) => {
  const { slug } = await context.params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { data: club } = await supabase
    .from('clubs')
    .select('id, name, slug, category, description')
    .eq('slug', slug)
    .maybeSingle()

  if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

  const { data: membership } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .in('role', ['admin', 'owner'])
    .maybeSingle()

  if (!membership) return ApiResponse.forbidden('운영진만 KPI 보고서를 조회할 수 있습니다')

  const now = new Date()
  const defaultStart = new Date(now)
  defaultStart.setDate(defaultStart.getDate() - 90)
  const startDate = searchParams.get('start') ? new Date(searchParams.get('start')!) : defaultStart
  const endDate = searchParams.get('end') ? new Date(searchParams.get('end')!) : now
  const cohortFilter = searchParams.get('cohort') || null
  const startISO = startDate.toISOString()
  const endISO = endDate.toISOString()

  const admin = createAdminClient()

  // 병렬 조회
  let oppQuery = admin
    .from('opportunities')
    .select('id, title, cohort, status, created_at, creator_id, interest_tags')
    .eq('club_id', club.id)
  if (cohortFilter) oppQuery = oppQuery.eq('cohort', cohortFilter)

  let memberQuery = admin
    .from('club_members')
    .select('user_id, role, cohort, status, joined_at')
    .eq('club_id', club.id)
    .eq('status', 'active')
  if (cohortFilter) memberQuery = memberQuery.eq('cohort', cohortFilter)

  const [oppRes, memberRes] = await Promise.all([oppQuery, memberQuery])
  const opportunities = oppRes.data ?? []
  const members = memberRes.data ?? []
  const oppIds: string[] = opportunities.map(o => o.id)
  const memberIds: string[] = members
    .map(m => m.user_id)
    .filter((v): v is string => typeof v === 'string')

  const [
    updatesRes,
    decisionsRes,
    tasksRes,
    resourcesRes,
    interventionsRes,
    activityRes,
    profileRes,
    acceptedRes,
  ] = await Promise.all([
    oppIds.length
      ? admin
          .from('project_updates')
          .select('id, opportunity_id, week_number, update_type, author_id, created_at')
          .in('opportunity_id', oppIds)
          .gte('created_at', startISO)
          .lte('created_at', endISO)
      : Promise.resolve({ data: [] as Array<{ id: string; opportunity_id: string; week_number: number; update_type: string; author_id: string; created_at: string | null }> }),
    admin
      .from('team_decisions')
      .select('id, decided_at, club_id')
      .eq('club_id', club.id)
      .gte('decided_at', startISO)
      .lte('decided_at', endISO),
    admin
      .from('team_tasks')
      .select('id, status, created_at, completed_at, club_id')
      .eq('club_id', club.id)
      .gte('created_at', startISO)
      .lte('created_at', endISO),
    admin
      .from('team_resources')
      .select('id, resource_type, created_at, club_id')
      .eq('club_id', club.id)
      .gte('created_at', startISO)
      .lte('created_at', endISO),
    admin
      .from('bot_interventions')
      .select('id, user_response, pattern_type, created_at, club_id')
      .eq('club_id', club.id)
      .gte('created_at', startISO)
      .lte('created_at', endISO),
    admin
      .from('member_activity_stats')
      .select('discord_user_id, week_number, year, message_count, channels_active, club_id')
      .eq('club_id', club.id),
    memberIds.length
      ? admin.from('profiles').select('user_id, nickname, desired_position').in('user_id', memberIds)
      : Promise.resolve({ data: [] as Array<{ user_id: string; nickname: string | null; desired_position: string | null }> }),
    oppIds.length
      ? admin
          .from('accepted_connections')
          .select('opportunity_id, applicant_id, assigned_role, status, connected_at')
          .in('opportunity_id', oppIds)
          .eq('status', 'active')
      : Promise.resolve({ data: [] as Array<{ opportunity_id: string; applicant_id: string; assigned_role: string | null; status: string; connected_at: string | null }> }),
  ])

  const updates = updatesRes.data ?? []
  const decisions = decisionsRes.data ?? []
  const tasks = tasksRes.data ?? []
  const resources = resourcesRes.data ?? []
  const interventions = interventionsRes.data ?? []
  const activity = activityRes.data ?? []
  const profiles = profileRes.data ?? []
  const accepted = acceptedRes.data ?? []

  const profileByUser = new Map(profiles.map(p => [p.user_id, p]))

  // 기수별 분포
  const cohortMap = new Map<string, { members: number; projects: number }>()
  for (const m of members) {
    const k = m.cohort ?? '미지정'
    const cur = cohortMap.get(k) ?? { members: 0, projects: 0 }
    cur.members += 1
    cohortMap.set(k, cur)
  }
  for (const o of opportunities) {
    const k = o.cohort ?? '미지정'
    const cur = cohortMap.get(k) ?? { members: 0, projects: 0 }
    cur.projects += 1
    cohortMap.set(k, cur)
  }
  const cohorts = Array.from(cohortMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))

  // 직무별 분포 (club_members 의 desired_position 기반)
  const positionCounts = new Map<string, number>()
  for (const m of members) {
    if (!m.user_id) continue
    const pos = profileByUser.get(m.user_id)?.desired_position ?? '미기재'
    positionCounts.set(pos, (positionCounts.get(pos) ?? 0) + 1)
  }
  const positions = Array.from(positionCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // 프로젝트 단계 분포 (가장 최근 update_type)
  const stageByProject = new Map<string, string>()
  const sortedUpdates = [...updates].sort((a, b) => {
    return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  })
  for (const u of sortedUpdates) {
    if (!stageByProject.has(u.opportunity_id)) {
      stageByProject.set(u.opportunity_id, u.update_type)
    }
  }
  const stageCounts: Record<string, number> = {
    ideation: 0, design: 0, development: 0, launch: 0, general: 0, none: 0,
  }
  for (const o of opportunities) {
    const stage = stageByProject.get(o.id) ?? 'none'
    stageCounts[stage] = (stageCounts[stage] ?? 0) + 1
  }

  // 주간 제출률 — 기간 내 주차별 업데이트 건수 / (활성 프로젝트 수 × 주차 수)
  const weeksInPeriod = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 86_400_000)))
  const submissionRate = opportunities.length > 0 && weeksInPeriod > 0
    ? Math.min(100, Math.round((updates.length / (opportunities.length * weeksInPeriod)) * 100))
    : 0

  // 봇 개입 수락률
  const accepted_count = interventions.filter(i => i.user_response === 'accepted').length
  const dismissed_count = interventions.filter(i => i.user_response === 'dismissed').length
  const responded_count = accepted_count + dismissed_count
  const interventionAcceptance = responded_count > 0
    ? Math.round((accepted_count / responded_count) * 100)
    : null

  // Discord 활동 — 기간 내 메시지 수
  const activityInPeriod = activity.filter(a => {
    const startWeekYear = startDate.getFullYear()
    const endWeekYear = endDate.getFullYear()
    return (a.year ?? 0) >= startWeekYear && (a.year ?? 0) <= endWeekYear
  })
  const totalMessages = activityInPeriod.reduce((sum, a) => sum + (a.message_count ?? 0), 0)
  const activeContributors = new Set(activityInPeriod.filter(a => (a.message_count ?? 0) > 0).map(a => a.discord_user_id)).size

  // Task 완료율
  const tasksCompleted = tasks.filter(t => t.status === 'completed').length
  const taskCompletionRate = tasks.length > 0
    ? Math.round((tasksCompleted / tasks.length) * 100)
    : null

  // 팀당 평균 구성원 (creator + accepted)
  const acceptedByOpp = new Map<string, number>()
  for (const a of accepted) {
    if (!a.opportunity_id) continue
    acceptedByOpp.set(a.opportunity_id, (acceptedByOpp.get(a.opportunity_id) ?? 0) + 1)
  }
  const totalTeamMembers = opportunities.reduce((sum, o) => sum + 1 + (acceptedByOpp.get(o.id) ?? 0), 0)
  const avgTeamSize = opportunities.length > 0
    ? Math.round((totalTeamMembers / opportunities.length) * 10) / 10
    : 0

  // 시계열 — 주차별 제출 건수 + Discord 메시지 건수 (기간 내)
  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()
  const startWeek = getISOWeek(startDate)
  const endWeek = getISOWeek(endDate)

  const timeseriesMap = new Map<string, { year: number; week: number; submissions: number; messages: number }>()

  for (let y = startYear; y <= endYear; y += 1) {
    const wStart = y === startYear ? startWeek : 1
    const wEnd = y === endYear ? endWeek : 53
    for (let w = wStart; w <= wEnd; w += 1) {
      timeseriesMap.set(`${y}-${w}`, { year: y, week: w, submissions: 0, messages: 0 })
    }
  }

  for (const u of updates) {
    if (!u.created_at) continue
    const d = new Date(u.created_at)
    const key = `${d.getFullYear()}-${getISOWeek(d)}`
    const slot = timeseriesMap.get(key)
    if (slot) slot.submissions += 1
  }

  for (const a of activity) {
    if (a.year == null || a.week_number == null) continue
    const key = `${a.year}-${a.week_number}`
    const slot = timeseriesMap.get(key)
    if (slot) slot.messages += (a.message_count ?? 0)
  }

  const timeseries = Array.from(timeseriesMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.week - b.week
  })

  // 응답
  return ApiResponse.ok({
    club: { id: club.id, name: club.name, slug: club.slug, category: club.category, description: club.description },
    period: { start: startISO, end: endISO, weeks: weeksInPeriod, cohort: cohortFilter },
    counts: {
      projects_total: opportunities.length,
      projects_active: opportunities.filter(o => o.status === 'active').length,
      projects_closed: opportunities.filter(o => o.status !== 'active').length,
      members_total: members.length,
      members_admin: members.filter(m => m.role === 'owner' || m.role === 'admin').length,
      updates_submitted: updates.length,
      submission_rate_percent: submissionRate,
      decisions_total: decisions.length,
      resources_shared: resources.length,
      tasks_total: tasks.length,
      tasks_completed: tasksCompleted,
      task_completion_rate_percent: taskCompletionRate,
      bot_interventions_total: interventions.length,
      bot_acceptance_rate_percent: interventionAcceptance,
      discord_messages_total: totalMessages,
      active_contributors: activeContributors,
      avg_team_size: avgTeamSize,
    },
    cohorts,
    positions,
    stages: {
      ideation: stageCounts.ideation ?? 0,
      design: stageCounts.design ?? 0,
      development: stageCounts.development ?? 0,
      launch: stageCounts.launch ?? 0,
      general: stageCounts.general ?? 0,
      not_started: stageCounts.none ?? 0,
    },
    timeseries,
    generated_at: new Date().toISOString(),
  })
})

function getISOWeek(d: Date): number {
  const target = new Date(d.valueOf())
  const dayNr = (d.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / (7 * 86_400_000))
}
