/**
 * GET /api/users/[targetId]/public-activity — 공개 프로필 활동 이력
 *
 * 공개 프로필 (/u/[id]) 에 노출할 알럼나이/현역 포트폴리오 데이터.
 * 대상 유저가 profile_visibility='public' 일 때만 응답.
 *
 * 반환:
 *   clubs: 소속 동아리 이력 (기수/역할 포함, archived 포함)
 *   projects: 참여 프로젝트 (creator = 자신 또는 accepted_connections)
 *   contributions: 주간 업데이트 작성 건수, 최근 기여 등
 *
 * 왜 anon client: 비로그인도 포트폴리오 링크를 볼 수 있어야 함. RLS 가 알아서 막음.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { createAdminClient } from '@/src/lib/supabase/admin'

export const runtime = 'nodejs'

const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export const GET = withErrorCapture(async (_request, context) => {
  const { targetId: userId } = await context.params

  // 공개 프로필 여부 확인
  const { data: profile } = await anonClient
    .from('profiles')
    .select('user_id, profile_visibility')
    .eq('user_id', userId)
    .maybeSingle()

  if (!profile) return ApiResponse.notFound('프로필을 찾을 수 없습니다')
  if (profile.profile_visibility !== 'public') {
    return ApiResponse.ok({ clubs: [], projects: [], contributions: { updates: 0, latest_update_at: null } })
  }

  const admin = createAdminClient()

  // 소속 클럽
  const [clubRes, createdProjectsRes, acceptedRes] = await Promise.all([
    admin
      .from('club_members')
      .select('role, cohort, joined_at, status, club:clubs!inner(id, slug, name, logo_url, category)')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false }),
    admin
      .from('opportunities')
      .select('id, title, status, cohort, created_at, interest_tags, club_id')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('accepted_connections')
      .select('opportunity_id, assigned_role, connected_at, status')
      .eq('applicant_id', userId)
      .eq('status', 'active'),
  ])

  const acceptedOppIds: string[] = (acceptedRes.data ?? [])
    .map(a => a.opportunity_id)
    .filter((v): v is string => typeof v === 'string')
  const acceptedRoleByOpp = new Map(
    (acceptedRes.data ?? []).map(a => [a.opportunity_id, a.assigned_role] as const)
  )

  const { data: acceptedOpps = [] } = acceptedOppIds.length
    ? await admin
        .from('opportunities')
        .select('id, title, status, cohort, created_at, interest_tags, club_id')
        .in('id', acceptedOppIds)
    : { data: [] as Array<{ id: string; title: string; status: string | null; cohort: string | null; created_at: string; interest_tags: string[] | null; club_id: string | null }> }

  const clubIds = Array.from(new Set([
    ...(createdProjectsRes.data ?? []).map(p => p.club_id),
    ...(acceptedOpps ?? []).map(p => p.club_id),
  ].filter((v): v is string => typeof v === 'string')))

  const { data: clubLookup = [] } = clubIds.length
    ? await admin.from('clubs').select('id, slug, name').in('id', clubIds)
    : { data: [] as Array<{ id: string; slug: string; name: string }> }
  const clubById = new Map((clubLookup ?? []).map(c => [c.id, c]))

  const { data: updates = [] } = await admin
    .from('project_updates')
    .select('id, created_at, opportunity_id, week_number')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .limit(200)

  const latestUpdate = (updates ?? [])[0]

  // 프로젝트 합치기 (중복 제거)
  type ProjectRow = {
    id: string
    title: string
    status: string | null
    cohort: string | null
    created_at: string
    interest_tags: string[] | null
    club: { slug: string; name: string } | null
    role: string
  }
  const projectMap = new Map<string, ProjectRow>()

  for (const p of createdProjectsRes.data ?? []) {
    projectMap.set(p.id, {
      id: p.id,
      title: p.title,
      status: p.status,
      cohort: p.cohort,
      created_at: p.created_at ?? new Date(0).toISOString(),
      interest_tags: p.interest_tags,
      club: p.club_id ? (clubById.get(p.club_id) ?? null) : null,
      role: 'creator',
    })
  }

  for (const p of acceptedOpps ?? []) {
    if (projectMap.has(p.id)) continue
    projectMap.set(p.id, {
      id: p.id,
      title: p.title,
      status: p.status,
      cohort: p.cohort,
      created_at: p.created_at ?? new Date(0).toISOString(),
      interest_tags: p.interest_tags,
      club: p.club_id ? (clubById.get(p.club_id) ?? null) : null,
      role: acceptedRoleByOpp.get(p.id) ?? 'member',
    })
  }

  // CDN 캐시: 공개 활동 이력은 자주 변하지 않음 (새 업데이트·프로젝트 가입 시에만).
  // 60s fresh + 600s stale-while-revalidate → /u/[id] 공유 링크 크롤러·재방문 성능 개선.
  return NextResponse.json(
    {
      clubs: (clubRes.data ?? []).map(m => ({
        role: m.role,
        cohort: m.cohort,
        joined_at: m.joined_at,
        status: m.status,
        club: m.club as unknown as { id: string; slug: string; name: string; logo_url: string | null; category: string | null } | null,
      })),
      projects: Array.from(projectMap.values()).sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
      contributions: {
        updates: (updates ?? []).length,
        latest_update_at: latestUpdate?.created_at ?? null,
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
      },
    },
  )
})
