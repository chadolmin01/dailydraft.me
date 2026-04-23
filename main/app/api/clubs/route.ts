import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { captureServerEvent } from '@/src/lib/posthog/server'
import { notifyClubVerificationSubmitted } from '@/src/lib/notifications/create-notification'

/**
 * GET /api/clubs — 공개 클럽 목록 (Explore 탭용)
 *
 * Query params:
 *   q        — 이름/설명 검색
 *   category — 카테고리 필터
 *   limit    — 페이지 크기 (기본 20, 최대 50)
 *   offset   — 오프셋 (기본 0)
 *
 * 인증 불요 — 공개 브라우징 API.
 * visibility='public' 클럽만 반환. 멤버 수는 club_members count로 계산.
 */
export const GET = withErrorCapture(async (request) => {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const q = searchParams.get('q')?.trim() || ''
  const category = searchParams.get('category') || ''
  const my = searchParams.get('my') === '1'
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50)
  const offset = Number(searchParams.get('offset')) || 0

  // ?my=1: 현재 유저가 소속된 클럽만 반환
  if (my) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.ok({ items: [], total: 0 })

    const { data: memberships } = await supabase
      .from('club_members')
      .select('club_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(limit)

    if (!memberships || memberships.length === 0) {
      return ApiResponse.ok({ items: [], total: 0 })
    }

    const myClubIds = memberships.map(m => m.club_id)
    const { data: myClubs } = await supabase
      .from('clubs')
      .select('id, slug, name, description, logo_url, category')
      .in('id', myClubIds)

    if (!myClubs || myClubs.length === 0) {
      return ApiResponse.ok({ items: [], total: 0 })
    }

    // 1회 쿼리로 전체 멤버 수 집계 — N+1 방지
    const { data: memberRows } = await supabase
      .from('club_members')
      .select('club_id')
      .in('club_id', myClubIds)
    const countMap: Record<string, number> = {}
    memberRows?.forEach(m => { countMap[m.club_id] = (countMap[m.club_id] || 0) + 1 })

    const items = myClubs.map(club => ({
      id: club.id,
      slug: club.slug,
      name: club.name,
      description: club.description,
      logo_url: club.logo_url,
      category: club.category,
      member_count: countMap[club.id] ?? 0,
    }))

    return ApiResponse.ok({ items, total: items.length })
  }

  let query = supabase
    .from('clubs')
    .select('id, slug, name, description, logo_url, category, created_at')
    // 공개 목록은 verified 만 — pending/rejected 는 creator + admin 전용 (RLS 로도 이중 방어)
    .eq('claim_status', 'verified')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
  }
  if (category) {
    query = query.eq('category', category)
  }

  const { data: clubs, error } = await query

  if (error) return ApiResponse.internalError(error.message)
  if (!clubs || clubs.length === 0) return ApiResponse.ok({ items: [], total: 0 })

  // 1회 쿼리로 전체 멤버 수 집계 — N+1 방지
  const clubIds = clubs.map(c => c.id)
  const { data: memberRows } = await supabase
    .from('club_members')
    .select('club_id')
    .in('club_id', clubIds)
  const countMap: Record<string, number> = {}
  memberRows?.forEach(m => { countMap[m.club_id] = (countMap[m.club_id] || 0) + 1 })

  // 공식 등록 뱃지 batch populate — 카드에 "✓ 경희대" 표시용.
  // 이전엔 API 응답에 badges 없어서 ClubsListClient/ExploreClubGrid 에서 아예 뱃지 렌더 못 함.
  const { data: credentials } = await supabase
    .from('club_credentials')
    .select('club_id, credential_type, university_id')
    .in('club_id', clubIds)
    .eq('credential_type', 'university')
  const univIds = Array.from(new Set(
    (credentials ?? []).map(c => c.university_id).filter(Boolean),
  )) as string[]
  let univMap: Record<string, { name: string; short_name: string | null }> = {}
  if (univIds.length > 0) {
    const { data: univs } = await supabase
      .from('universities')
      .select('id, name, short_name')
      .in('id', univIds)
    univMap = Object.fromEntries(
      (univs ?? []).map(u => [u.id, { name: u.name, short_name: u.short_name }]),
    )
  }
  const badgesByClub: Record<string, Array<{ type: string; university: { name: string; short_name: string | null } | null }>> = {}
  for (const c of credentials ?? []) {
    if (!badgesByClub[c.club_id]) badgesByClub[c.club_id] = []
    badgesByClub[c.club_id].push({
      type: c.credential_type,
      university: c.university_id ? univMap[c.university_id] ?? null : null,
    })
  }

  const items = clubs.map(club => ({
    id: club.id,
    slug: club.slug,
    name: club.name,
    description: club.description,
    logo_url: club.logo_url,
    category: club.category,
    member_count: countMap[club.id] ?? 0,
    badges: badgesByClub[club.id] ?? [],
  }))

  // CDN 캐시: 공개 클럽 목록은 자주 변하지 않음. 60s fresh + 300s stale-while-revalidate.
  // 검색어·카테고리 필터는 URL 쿼리 다르므로 캐시 키가 분리됨.
  return NextResponse.json(
    { items, total: items.length },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    },
  )
})

// 슬러그 예약어 (라우팅 충돌 방지)
const RESERVED_SLUGS = new Set([
  'admin', 'api', 'login', 'logout', 'signup', 'settings',
  'new', 'edit', 'club', 'clubs', 'dashboard', 'explore',
  'profile', 'notifications', 'search', 'home', 'about',
])

/**
 * POST /api/clubs — 새 클럽 생성 (공식 인증 요청)
 *
 * Body:
 *   { name, slug?, description?, logo_url?,
 *     university_id (REQUIRED),
 *     verification_documents: {
 *       representative_name (REQUIRED),
 *       representative_email (REQUIRED),
 *       founding_year (REQUIRED, 2000~current),
 *       activity_summary (REQUIRED, 50~500자),
 *       website_url?, sns_url?, charter_url?,
 *     }
 *   }
 *
 * 동작:
 * - claim_status='pending' 으로 insert (RLS 로 creator/admin 만 조회 가능)
 * - DB 트리거(auto_add_club_owner)가 생성자를 owner 로 자동 등록
 * - Draft platform admin 이 /admin/clubs-moderation 에서 승인/거부
 */
export const POST = withErrorCapture(async (request) => {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json().catch(() => ({}))
  const {
    name,
    description,
    logo_url,
    university_id,
    verification_documents,
  } = body as {
    name?: string
    description?: string
    logo_url?: string
    university_id?: string
    verification_documents?: {
      representative_name?: string
      representative_email?: string
      founding_year?: number
      activity_summary?: string
      website_url?: string
      sns_url?: string
      charter_url?: string
    }
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return ApiResponse.badRequest('클럽 이름은 2자 이상이어야 합니다')
  }
  if (name.trim().length > 50) {
    return ApiResponse.badRequest('클럽 이름은 50자 이하여야 합니다')
  }

  // 학교 선택 필수
  if (!university_id || typeof university_id !== 'string') {
    return ApiResponse.badRequest('소속 학교를 선택해 주세요')
  }
  const { data: univ } = await supabase
    .from('universities')
    .select('id')
    .eq('id', university_id)
    .maybeSingle()
  if (!univ) {
    return ApiResponse.badRequest('선택하신 학교를 찾을 수 없습니다')
  }

  // 증빙 필수 필드 검증
  if (!verification_documents || typeof verification_documents !== 'object') {
    return ApiResponse.badRequest('증빙 정보를 입력해 주세요')
  }
  const docs = verification_documents
  const errors: Record<string, string> = {}
  if (!docs.representative_name?.trim()) errors.representative_name = '대표자 이름을 입력해 주세요'
  if (!docs.representative_email?.trim()) errors.representative_email = '대표자 이메일을 입력해 주세요'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(docs.representative_email.trim())) {
    errors.representative_email = '올바른 이메일 형식이 아닙니다'
  }
  const thisYear = new Date().getFullYear()
  if (!docs.founding_year || typeof docs.founding_year !== 'number'
    || docs.founding_year < 2000 || docs.founding_year > thisYear) {
    errors.founding_year = `창립 연도를 2000~${thisYear} 사이로 입력해 주세요`
  }
  const summary = docs.activity_summary?.trim() ?? ''
  if (summary.length < 50) errors.activity_summary = '활동 요약을 50자 이상 입력해 주세요'
  else if (summary.length > 500) errors.activity_summary = '활동 요약은 500자 이하로 입력해 주세요'

  // URL 유효성 (선택 필드들, 값 있을 때만 검증)
  const urlFields: Array<keyof typeof docs> = ['website_url', 'sns_url', 'charter_url']
  for (const field of urlFields) {
    const v = docs[field]
    if (v && typeof v === 'string' && v.trim()) {
      try { new URL(v.trim()) } catch { errors[field as string] = '올바른 URL 형식이 아닙니다' }
    }
  }

  if (Object.keys(errors).length > 0) {
    return ApiResponse.badRequest('입력값이 유효하지 않습니다', errors)
  }

  // 슬러그 생성: 제공되면 사용, 아니면 name에서 생성
  let slug = body.slug?.trim()?.toLowerCase()
  if (!slug) {
    slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30)

    // 한글만 있는 경우 타임스탬프 추가
    if (!slug || slug === '-') {
      slug = `club-${Date.now().toString(36)}`
    }
  }

  if (!/^[a-z0-9가-힣][a-z0-9가-힣-]{0,28}[a-z0-9가-힣]$/.test(slug) && slug.length < 2) {
    return ApiResponse.badRequest('슬러그는 2-30자의 영문 소문자, 숫자, 한글, 하이픈만 가능합니다')
  }
  if (RESERVED_SLUGS.has(slug)) {
    return ApiResponse.badRequest('사용할 수 없는 슬러그입니다')
  }

  // 중복 확인
  const { data: existing } = await supabase
    .from('clubs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (existing) {
    return ApiResponse.badRequest('이미 사용 중인 슬러그입니다')
  }

  // 클럽 생성 — claim_status 는 default('pending') 사용, DB 트리거가 owner 자동 등록
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: club, error } = await (supabase as any)
    .from('clubs')
    .insert({
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      logo_url: logo_url || null,
      created_by: user.id,
      university_id,
      verification_submitted_at: new Date().toISOString(),
      verification_documents: {
        representative_name: docs.representative_name!.trim(),
        representative_email: docs.representative_email!.trim(),
        founding_year: docs.founding_year,
        activity_summary: summary,
        website_url: docs.website_url?.trim() || null,
        sns_url: docs.sns_url?.trim() || null,
        charter_url: docs.charter_url?.trim() || null,
      },
    })
    .select('id, slug, name, claim_status')
    .single()

  if (error) {
    return ApiResponse.internalError('클럽 생성에 실패했습니다', error.message)
  }

  // Funnel: 인증 요청 접수 (club_created 는 승인 시점으로 이동)
  captureServerEvent('club_verification_requested', {
    userId: user.id,
    clubId: club.id,
    slug: club.slug,
    universityId: university_id,
  }).catch(() => {})

  // 신청 접수 알림 — event_notifications 로 통일 (이전엔 legacy notifications 테이블에 들어가 UI 누락)
  await notifyClubVerificationSubmitted(user.id, club.name, club.slug)

  return ApiResponse.created({ ...club, claim_status: 'pending' })
})
