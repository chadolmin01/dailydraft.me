/**
 * GET /api/clubs/[slug]/certificate?user_id= — 활동 증명서 데이터
 *
 * 본인 것만 요청 가능 (user_id 미지정 시 자기 자신).
 * Admin 은 다른 멤버 조회 가능.
 *
 * 반환: 클럽 정보 + 기수 이력 + 참여 프로젝트 + 업데이트 건수
 * 취업·대학원·장학금 제출용 "이 학생이 우리 동아리에서 실제로 활동했다" 증빙.
 */

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const runtime = 'nodejs'

export const GET = withErrorCapture(async (request, context) => {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { searchParams } = new URL(request.url)
  const targetUserId = searchParams.get('user_id') ?? user.id

  const { data: club } = await supabase
    .from('clubs')
    .select('id, name, slug, category, description')
    .eq('slug', slug)
    .maybeSingle()

  if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

  // 권한: 본인 또는 admin/owner
  if (targetUserId !== user.id) {
    const { data: membership } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', club.id)
      .eq('user_id', user.id)
      .in('role', ['admin', 'owner'])
      .maybeSingle()
    if (!membership) return ApiResponse.forbidden('본인 또는 운영진만 발급할 수 있습니다')
  }

  const admin = createAdminClient()

  // 대상 멤버십 이력 (기수별로 여러 개 가능성)
  const { data: memberships = [] } = await admin
    .from('club_members')
    .select('role, cohort, status, joined_at, display_role')
    .eq('club_id', club.id)
    .eq('user_id', targetUserId)
    .order('joined_at', { ascending: true })

  if (!memberships || memberships.length === 0) {
    return ApiResponse.forbidden('이 클럽의 멤버 기록이 없습니다')
  }

  // 프로필
  const { data: profile } = await admin
    .from('profiles')
    .select('user_id, nickname, university, major, desired_position')
    .eq('user_id', targetUserId)
    .maybeSingle()

  // 참여 프로젝트 (creator 또는 accepted member)
  const { data: createdOpps = [] } = await admin
    .from('opportunities')
    .select('id, title, cohort, created_at, status')
    .eq('club_id', club.id)
    .eq('creator_id', targetUserId)

  const { data: acceptedRows = [] } = await admin
    .from('accepted_connections')
    .select('opportunity_id, assigned_role, status')
    .eq('applicant_id', targetUserId)

  const acceptedOppIds = (acceptedRows ?? [])
    .map(a => a.opportunity_id)
    .filter((v): v is string => typeof v === 'string')
  const { data: acceptedOppsData = [] } = acceptedOppIds.length > 0
    ? await admin
        .from('opportunities')
        .select('id, title, cohort, created_at, status, club_id')
        .in('id', acceptedOppIds)
        .eq('club_id', club.id)
    : { data: [] as Array<{ id: string; title: string; cohort: string | null; created_at: string; status: string | null; club_id: string | null }> }

  const roleByOpp = new Map(
    (acceptedRows ?? [])
      .filter(a => typeof a.opportunity_id === 'string')
      .map(a => [a.opportunity_id as string, a.assigned_role])
  )

  type ProjectRow = {
    id: string
    title: string
    cohort: string | null
    created_at: string
    status: string | null
    role: 'creator' | string
  }

  const projectMap = new Map<string, ProjectRow>()
  for (const p of createdOpps ?? []) {
    projectMap.set(p.id, {
      id: p.id,
      title: p.title,
      cohort: p.cohort,
      created_at: p.created_at ?? new Date(0).toISOString(),
      status: p.status,
      role: 'creator',
    })
  }
  for (const p of acceptedOppsData ?? []) {
    if (projectMap.has(p.id)) continue
    projectMap.set(p.id, {
      id: p.id,
      title: p.title,
      cohort: p.cohort,
      created_at: p.created_at ?? new Date(0).toISOString(),
      status: p.status,
      role: roleByOpp.get(p.id) ?? 'member',
    })
  }

  const projects = Array.from(projectMap.values())
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // 작성 업데이트 건수
  const { count: updateCount = 0 } = await admin
    .from('project_updates')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', targetUserId)

  // 기간 계산 (최초 가입일 ~ 졸업/현재)
  const firstJoin = memberships[0]?.joined_at ?? null
  const latestRole = memberships[memberships.length - 1]
  const isAlumni = memberships.some(m => m.status === 'alumni' || m.role === 'alumni')
  const endDate = isAlumni ? new Date().toISOString() : null

  return ApiResponse.ok({
    club: { id: club.id, name: club.name, slug: club.slug, category: club.category },
    profile: {
      nickname: profile?.nickname ?? '이름 미지정',
      university: profile?.university ?? null,
      major: profile?.major ?? null,
      position: profile?.desired_position ?? null,
    },
    memberships: (memberships ?? []).map(m => ({
      role: m.role,
      cohort: m.cohort,
      status: m.status,
      joined_at: m.joined_at,
      display_role: m.display_role,
    })),
    summary: {
      first_joined_at: firstJoin,
      end_date: endDate,
      is_alumni: isAlumni,
      highest_role: memberships.reduce((max, m) => {
        const rank: Record<string, number> = { owner: 4, admin: 3, member: 2, alumni: 1 }
        return (rank[m.role] ?? 0) > (rank[max] ?? 0) ? m.role : max
      }, latestRole.role),
      cohorts: Array.from(new Set((memberships ?? []).map(m => m.cohort).filter(Boolean))),
      projects_count: projects.length,
      updates_count: updateCount ?? 0,
    },
    projects,
    generated_at: new Date().toISOString(),
  })
})
