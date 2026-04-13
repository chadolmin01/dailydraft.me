import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// ── 허용된 PATCH 필드 ──
const UPDATABLE_FIELDS = new Set([
  'name', 'description', 'logo_url', 'visibility', 'require_approval', 'category',
])

// GET /api/clubs/[slug] — 클럽 상세 조회 (공개)
export const GET = withErrorCapture(
  async (_request, context) => {
    const { slug } = await context.params
    const supabase = await createClient()

    const { data: club, error } = await supabase
      .from('clubs')
      .select(`
        id, slug, name, description, logo_url, category,
        visibility, require_approval,
        created_by, created_at, updated_at
      `)
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      return ApiResponse.internalError(error.message)
    }
    if (!club) {
      return ApiResponse.notFound('클럽을 찾을 수 없습니다')
    }

    // 멤버 수 (real + ghost)
    const { count: memberCount } = await supabase
      .from('club_members')
      .select('id', { count: 'exact', head: true })
      .eq('club_id', club.id)

    // 기수 목록
    const { data: cohorts } = await supabase
      .from('club_members')
      .select('cohort')
      .eq('club_id', club.id)
      .not('cohort', 'is', null)

    const uniqueCohorts = [...new Set((cohorts || []).map(c => c.cohort))]
      .filter(Boolean)
      .sort()

    // 뱃지 (credentials)
    const { data: credentials } = await supabase
      .from('club_credentials')
      .select(`
        id, credential_type, verification_method, verified_at,
        university_id
      `)
      .eq('club_id', club.id)

    // university 이름 조회 (credentials에 university_id가 있는 경우)
    const universityIds = (credentials || [])
      .map(c => c.university_id)
      .filter(Boolean) as string[]

    let universities: Record<string, { name: string; short_name: string | null }> = {}
    if (universityIds.length > 0) {
      const { data: univData } = await supabase
        .from('universities')
        .select('id, name, short_name')
        .in('id', universityIds)

      universities = Object.fromEntries(
        (univData || []).map(u => [u.id, { name: u.name, short_name: u.short_name }])
      )
    }

    const badges = (credentials || []).map(c => ({
      id: c.id,
      type: c.credential_type,
      method: c.verification_method,
      verified_at: c.verified_at,
      university: c.university_id ? universities[c.university_id] : null,
    }))

    // owner 프로필
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('user_id, nickname, avatar_url')
      .eq('user_id', club.created_by)
      .maybeSingle()

    // 현재 로그인 유저의 클럽 내 역할 조회 (비로그인이면 null)
    // 의도: 멤버 목록은 페이지네이션(limit 50)이라 admin이 누락될 수 있음.
    // 별도 1건 쿼리로 확실하게 본인 역할을 반환.
    let myRole: string | null = null
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser) {
      const { data: myMembership } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', club.id)
        .eq('user_id', currentUser.id)
        .maybeSingle()

      myRole = myMembership?.role ?? null
    }

    return ApiResponse.ok({
      ...club,
      member_count: memberCount ?? 0,
      cohorts: uniqueCohorts,
      badges,
      owner: ownerProfile || { user_id: club.created_by, nickname: null, avatar_url: null },
      my_role: myRole,
    })
  }
)

// PATCH /api/clubs/[slug] — 클럽 설정 변경 (admin/owner)
export const PATCH = withErrorCapture(
  async (request, context) => {
    const { slug } = await context.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    // 클럽 조회
    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

    // admin 권한 확인 (RLS가 처리하지만 명시적으로도 체크)
    const { data: membership } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', club.id)
      .eq('user_id', user.id)
      .in('role', ['admin', 'owner'])
      .maybeSingle()

    if (!membership) {
      return ApiResponse.forbidden('관리자만 클럽 설정을 변경할 수 있습니다')
    }

    const body = await request.json()

    // 허용된 필드만 필터
    const updates: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(body)) {
      if (UPDATABLE_FIELDS.has(key)) {
        updates[key] = value
      }
    }

    if (Object.keys(updates).length === 0) {
      return ApiResponse.badRequest('변경할 항목이 없습니다')
    }

    // visibility 값 검증
    if (updates.visibility && !['public', 'school_only', 'private'].includes(updates.visibility as string)) {
      return ApiResponse.badRequest('visibility는 public, school_only, private 중 하나여야 합니다')
    }

    const { data: updated, error } = await supabase
      .from('clubs')
      .update(updates)
      .eq('id', club.id)
      .select()
      .single()

    if (error) {
      return ApiResponse.internalError('설정 변경에 실패했습니다', error.message)
    }

    return ApiResponse.ok(updated)
  }
)

// DELETE /api/clubs/[slug] — 클럽 삭제 (owner, soft delete)
export const DELETE = withErrorCapture(
  async (request, context) => {
    const { slug } = await context.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

    // owner만 삭제 가능
    const { data: ownership } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', club.id)
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .maybeSingle()

    if (!ownership) {
      return ApiResponse.forbidden('클럽 소유자만 삭제할 수 있습니다')
    }

    // confirm 필수 (실수 방지)
    const body = await request.json().catch(() => ({}))
    if (body.confirm !== true) {
      return ApiResponse.badRequest('삭제를 확인하려면 confirm: true를 전달해주세요')
    }

    // Soft delete: deleted_at 설정
    const { error } = await supabase
      .from('clubs')
      // deleted_at: 마이그레이션 적용 후 타입 재생성하면 정상화
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq('id', club.id)

    if (error) {
      return ApiResponse.internalError('클럽 삭제에 실패했습니다', error.message)
    }

    return ApiResponse.ok({ message: '클럽이 삭제되었습니다', slug })
  }
)
