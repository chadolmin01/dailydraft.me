import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse, isValidUUID } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// GET /api/clubs/[slug]/members — 기수별 멤버 목록 (공개)
export const GET = withErrorCapture(
  async (request, context) => {
    const { slug } = await context.params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const cohort = searchParams.get('cohort')
    const role = searchParams.get('role')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(parseInt(limitParam) || 50, 200) : 50
    const offset = parseInt(searchParams.get('offset') || '0') || 0

    // 클럽 ID 조회
    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!club) {
      return ApiResponse.notFound('클럽을 찾을 수 없습니다')
    }

    // 멤버 쿼리
    let query = supabase
      .from('club_members')
      .select('id, user_id, ghost_name, ghost_metadata, role, cohort, joined_at', {
        count: 'exact',
      })
      .eq('club_id', club.id)
      .order('joined_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (cohort) {
      query = query.eq('cohort', cohort)
    }
    if (role) {
      query = query.eq('role', role)
    }

    const { data: members, error, count } = await query

    if (error) {
      return ApiResponse.internalError(error.message)
    }

    // real member의 프로필 일괄 조회
    const realUserIds = (members || [])
      .map(m => m.user_id)
      .filter(Boolean) as string[]

    let profileMap: Record<string, { nickname: string | null; avatar_url: string | null }> = {}
    if (realUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nickname, avatar_url')
        .in('user_id', realUserIds)

      profileMap = Object.fromEntries(
        (profiles || []).map(p => [p.user_id, { nickname: p.nickname, avatar_url: p.avatar_url }])
      )
    }

    // ghost member는 익명화 (ghost_name을 직접 노출하지 않음)
    // 의도: 개인정보 보호. ghost_name은 DB에만, 공개 UI는 익명 ID.
    // 본인 클레임 전까지 실명 비공개.
    const enriched = (members || []).map((m, idx) => {
      if (m.user_id) {
        // real member
        const profile = profileMap[m.user_id]
        return {
          id: m.id,
          type: 'real' as const,
          user_id: m.user_id,
          nickname: profile?.nickname ?? null,
          avatar_url: profile?.avatar_url ?? null,
          role: m.role,
          cohort: m.cohort,
          joined_at: m.joined_at,
          // ghost_metadata의 학과/캠퍼스 등은 real에선 불필요
        }
      } else {
        // ghost member — 익명 ID로 표시
        const meta = (m.ghost_metadata || {}) as Record<string, unknown>
        return {
          id: m.id,
          type: 'ghost' as const,
          user_id: null,
          nickname: `멤버 ${String(offset + idx + 1).padStart(3, '0')}`,
          avatar_url: null,
          role: m.role,
          cohort: m.cohort,
          joined_at: m.joined_at,
          department: meta.department ?? meta.notes ?? null,
        }
      }
    })

    return ApiResponse.ok({
      members: enriched,
      total: count ?? 0,
      limit,
      offset,
    })
  }
)

// POST /api/clubs/[slug]/members — owner/admin이 직접 멤버 추가
// 양방향 초대의 "관리자 직접 추가" 쪽 (코드 없이 user_id로 바로 추가)
export const POST = withErrorCapture(
  async (request, context) => {
    const { slug } = await context.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    // 1. 클럽 확인 (require_approval도 함께 조회)
    const { data: club } = await supabase
      .from('clubs')
      .select('id, require_approval')
      .eq('slug', slug)
      .maybeSingle()

    if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

    // 2. 요청자가 owner/admin인지 확인
    const { data: requester } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', club.id)
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .maybeSingle()

    if (!requester) {
      return ApiResponse.forbidden('멤버를 추가할 권한이 없습니다')
    }

    const body = await request.json()
    const targetUserId = body.user_id?.trim()
    const role = body.role || 'member'
    const cohort = body.cohort || null

    if (!targetUserId || !isValidUUID(targetUserId)) {
      return ApiResponse.badRequest('유효한 사용자 ID가 필요합니다')
    }

    // role 검증:
    // - owner 직접 부여 불가 (소유권 이전은 별도 플로우)
    // - admin 역할은 owner만 부여 가능
    if (role === 'owner') {
      return ApiResponse.badRequest('owner 역할은 직접 부여할 수 없습니다')
    }
    if (role === 'admin' && requester.role !== 'owner') {
      return ApiResponse.forbidden('admin 역할은 owner만 부여할 수 있습니다')
    }
    if (!['admin', 'member', 'alumni'].includes(role)) {
      return ApiResponse.badRequest('유효하지 않은 역할입니다')
    }

    // 3. 이미 멤버인지 확인
    const { data: existing } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', club.id)
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (existing) {
      return ApiResponse.badRequest('이미 이 클럽의 멤버입니다')
    }

    // 4. 대상 유저 존재 확인
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('user_id, nickname')
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (!targetProfile) {
      return ApiResponse.notFound('해당 사용자를 찾을 수 없습니다')
    }

    // 5. 멤버 추가
    // 관리자가 직접 추가하는 경우에도 승인제 설정을 존중
    // require_approval=true → pending, 아니면 active
    const status = club.require_approval ? 'pending' : 'active'

    const { data: newMember, error } = await supabase
      .from('club_members')
      .insert({
        club_id: club.id,
        user_id: targetUserId,
        role,
        cohort,
        status,
      })
      .select()
      .single()

    if (error) {
      return ApiResponse.internalError(error.message)
    }

    return ApiResponse.ok({
      ...newMember,
      nickname: targetProfile.nickname,
    })
  }
)
