/**
 * GET /api/clubs/[slug]/members/export — 멤버 목록 CSV 다운로드.
 *
 * 쓰임새:
 *   - 학기말 성과 보고
 *   - 알럼나이 DB 이전 (다른 툴 migration 가능성)
 *   - 창업지원단 제출 자료
 *
 * query:
 *   cohort — 특정 기수만 필터
 *   include_contact=1 — 이메일·연락처 포함 (admin 동의 필요)
 *
 * 권한: admin/owner 만.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const runtime = 'nodejs'

function escapeCsvField(v: unknown): string {
  const s = v == null ? '' : String(v)
  if (s.includes(',') || s.includes('\n') || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export const GET = withErrorCapture(async (request, context) => {
  const { slug } = await context.params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const cohortFilter = searchParams.get('cohort')
  const includeContact = searchParams.get('include_contact') === '1'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { data: club } = await supabase
    .from('clubs')
    .select('id, name')
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

  if (!membership) return ApiResponse.forbidden('운영진만 내보낼 수 있습니다')

  const admin = createAdminClient()

  let memberQuery = admin
    .from('club_members')
    .select('user_id, role, cohort, status, joined_at, display_role')
    .eq('club_id', club.id)
    .order('joined_at', { ascending: false })

  if (cohortFilter) memberQuery = memberQuery.eq('cohort', cohortFilter)

  const { data: members = [] } = await memberQuery
  const userIds = (members ?? [])
    .map(m => m.user_id)
    .filter((v): v is string => typeof v === 'string')

  const profileCols = includeContact
    ? 'user_id, nickname, desired_position, university, major, contact_email, portfolio_url, github_url, linkedin_url'
    : 'user_id, nickname, desired_position, university, major'

  const { data: profiles = [] } = userIds.length > 0
    ? await admin.from('profiles').select(profileCols).in('user_id', userIds)
    : { data: [] }

  type ProfileRow = {
    user_id?: string
    nickname?: string | null
    desired_position?: string | null
    university?: string | null
    major?: string | null
    contact_email?: string | null
    portfolio_url?: string | null
    github_url?: string | null
    linkedin_url?: string | null
  }
  const profileMap = new Map<string, ProfileRow>()
  for (const p of profiles as ProfileRow[]) {
    if (p.user_id) profileMap.set(p.user_id, p)
  }

  const ROLE_LABEL: Record<string, string> = {
    owner: '대표',
    admin: '운영진',
    member: '멤버',
    alumni: '졸업',
  }

  const headers = includeContact
    ? ['이름', '역할', '기수', '상태', '가입일', '포지션', '학교', '학과', '이메일', '포트폴리오', 'GitHub', 'LinkedIn']
    : ['이름', '역할', '기수', '상태', '가입일', '포지션', '학교', '학과']

  const rows = (members ?? []).map(m => {
    const p = m.user_id ? profileMap.get(m.user_id) : undefined
    const base = [
      p?.nickname ?? '익명',
      m.display_role || ROLE_LABEL[m.role] || m.role,
      m.cohort ?? '',
      m.status === 'alumni' ? '졸업' : m.status === 'active' ? '활동 중' : m.status,
      m.joined_at ? new Date(m.joined_at).toLocaleDateString('ko-KR') : '',
      p?.desired_position ?? '',
      p?.university ?? '',
      p?.major ?? '',
    ]
    if (includeContact) {
      base.push(
        p?.contact_email ?? '',
        p?.portfolio_url ?? '',
        p?.github_url ?? '',
        p?.linkedin_url ?? '',
      )
    }
    return base
  })

  const csvLines = [
    headers.map(escapeCsvField).join(','),
    ...rows.map(r => r.map(escapeCsvField).join(',')),
  ]
  const csv = '\uFEFF' + csvLines.join('\n')

  const cohortSuffix = cohortFilter ? `_${cohortFilter}기` : ''
  const filename = `${club.name}_멤버${cohortSuffix}_${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
})
