import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { writeAuditLog, extractAuditContext } from '@/src/lib/audit'

// ── 허용된 PATCH 필드 ──
const UPDATABLE_FIELDS = new Set([
  'name', 'description', 'logo_url', 'visibility', 'require_approval', 'category',
  'team_channel_visibility',
])

// GET /api/clubs/[slug] — 클럽 상세 조회 (공개)
// 이전: 7개 쿼리 순차 (club → count → cohorts → credentials → universities → owner → membership).
// 개선: Phase 1 (club+auth 병렬) → Phase 2 (5개 쿼리 병렬) → Phase 3 (universities 의존성만 직렬).
// 결과: 2~3 라운드트립으로 축소.
export const GET = withErrorCapture(
  async (_request, context) => {
    const { slug } = await context.params
    const supabase = await createClient()

    // Phase 1: club + 현재 유저 (서로 독립)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [clubResult, authResult] = await Promise.all([
      (supabase as any)
        .from('clubs')
        .select(`
          id, slug, name, description, logo_url, category,
          visibility, require_approval, team_channel_visibility,
          created_by, created_at, updated_at,
          claim_status, university_id,
          verification_submitted_at, verification_reviewed_at, verification_note,
          verification_documents
        `)
        .eq('slug', slug)
        .maybeSingle(),
      supabase.auth.getUser(),
    ])

    if (clubResult.error) {
      return ApiResponse.internalError(clubResult.error.message)
    }
    if (!clubResult.data) {
      return ApiResponse.notFound('클럽을 찾을 수 없습니다')
    }

    const club = clubResult.data
    const currentUser = authResult.data.user

    // Phase 2: club.id 에 의존하는 5개 쿼리 병렬
    const [memberCountResult, cohortsResult, credentialsResult, ownerResult, membershipResult] = await Promise.all([
      supabase
        .from('club_members')
        .select('id', { count: 'exact', head: true })
        .eq('club_id', club.id),
      supabase
        .from('club_members')
        .select('cohort')
        .eq('club_id', club.id)
        .not('cohort', 'is', null),
      supabase
        .from('club_credentials')
        .select('id, credential_type, verification_method, verified_at, university_id')
        .eq('club_id', club.id),
      supabase
        .from('profiles')
        .select('user_id, nickname, avatar_url')
        .eq('user_id', club.created_by)
        .maybeSingle(),
      currentUser
        ? supabase
            .from('club_members')
            .select('role')
            .eq('club_id', club.id)
            .eq('user_id', currentUser.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    const uniqueCohorts = [...new Set((cohortsResult.data || []).map(c => c.cohort))]
      .filter(Boolean)
      .sort()

    // Phase 3: credentials 결과로 university 조회 (의존성)
    const credentials = credentialsResult.data || []
    const universityIds = credentials
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

    const badges = credentials.map(c => ({
      id: c.id,
      type: c.credential_type,
      method: c.verification_method,
      verified_at: c.verified_at,
      university: c.university_id ? universities[c.university_id] : null,
    }))

    const myRole = (membershipResult.data as { role?: string } | null)?.role ?? null

    return ApiResponse.ok({
      ...club,
      member_count: memberCountResult.count ?? 0,
      cohorts: uniqueCohorts,
      badges,
      owner: ownerResult.data || { user_id: club.created_by, nickname: null, avatar_url: null },
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

    // team_channel_visibility 값 검증
    if (updates.team_channel_visibility && !['isolated', 'open'].includes(updates.team_channel_visibility as string)) {
      return ApiResponse.badRequest('team_channel_visibility는 isolated, open 중 하나여야 합니다')
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

    // P0-2 감사 로그
    writeAuditLog(supabase, {
      actorUserId: user.id,
      action: 'clubs.soft_delete',
      targetType: 'clubs',
      targetId: club.id,
      context: extractAuditContext(request, { slug }),
    })

    return ApiResponse.ok({ message: '클럽이 삭제되었습니다', slug })
  }
)
