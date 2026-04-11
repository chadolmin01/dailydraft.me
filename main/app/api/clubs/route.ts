import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

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

  return ApiResponse.created(club)
})
