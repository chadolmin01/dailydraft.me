import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { captureServerEvent } from '@/src/lib/posthog/server'

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

  const items = clubs.map(club => ({
    id: club.id,
    slug: club.slug,
    name: club.name,
    description: club.description,
    logo_url: club.logo_url,
    category: club.category,
    member_count: countMap[club.id] ?? 0,
  }))

  return ApiResponse.ok({ items, total: items.length })
})

// 슬러그 예약어 (라우팅 충돌 방지)
const RESERVED_SLUGS = new Set([
  'admin', 'api', 'login', 'logout', 'signup', 'settings',
  'new', 'edit', 'club', 'clubs', 'dashboard', 'explore',
  'profile', 'notifications', 'search', 'home', 'about',
])

/**
 * POST /api/clubs — 새 클럽 생성
 *
 * Body: { name, slug?, description?, logo_url? }
 *
 * slug 미제공 시 name에서 자동 생성.
 * DB 트리거(auto_add_club_owner)가 생성자를 owner로 자동 등록.
 */
export const POST = withErrorCapture(async (request) => {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json()
  const { name, description, logo_url } = body

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return ApiResponse.badRequest('클럽 이름은 2자 이상이어야 합니다')
  }

  if (name.trim().length > 50) {
    return ApiResponse.badRequest('클럽 이름은 50자 이하여야 합니다')
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

  // 슬러그 검증
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

  // 클럽 생성 (트리거가 owner 자동 등록)
  const { data: club, error } = await supabase
    .from('clubs')
    .insert({
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      logo_url: logo_url || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return ApiResponse.internalError('클럽 생성에 실패했습니다', error.message)
  }

  // Funnel Stage 3a: 클럽 생성 = 운영자 전환 모먼트
  // 대시보드/사이드바가 운영자 모드로 진입하는 핵심 활성화 이벤트.
  captureServerEvent('club_created', {
    userId: user.id,
    clubId: club.id,
    slug: club.slug,
  }).catch(() => {})

  return ApiResponse.created(club)
})
