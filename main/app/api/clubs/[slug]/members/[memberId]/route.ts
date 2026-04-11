import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/**
 * PATCH /api/clubs/[slug]/members/[memberId] — 멤버 역할 변경/제거
 *
 * Body: { role?: 'admin' | 'member' | 'alumni', cohort?: string, action?: 'remove' }
 *
 * 권한 규칙:
 * - admin → member 역할만 변경 가능
 * - owner → admin/member 역할 변경 가능
 * - owner는 이 API로 지정 불가 (소유권 이전은 별도)
 * - owner 자신은 제거 불가
 */
export const PATCH = withErrorCapture(
  async (request, context) => {
    const { slug, memberId } = await context.params
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

    // 요청자 권한 확인
    const { data: myMembership } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', club.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!myMembership || !['admin', 'owner'].includes(myMembership.role)) {
      return ApiResponse.forbidden('관리자만 멤버를 관리할 수 있습니다')
    }

    // 대상 멤버 조회
    const { data: target } = await supabase
      .from('club_members')
      .select('id, user_id, role, cohort')
      .eq('id', memberId)
      .eq('club_id', club.id)
      .maybeSingle()

    if (!target) return ApiResponse.notFound('멤버를 찾을 수 없습니다')

    const body = await request.json()

    // 제거 액션
    if (body.action === 'remove') {
      if (target.role === 'owner') {
        return ApiResponse.badRequest('소유자는 제거할 수 없습니다')
      }

      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('id', memberId)

      if (error) return ApiResponse.internalError(error.message)
      return ApiResponse.ok({ message: '멤버가 제거되었습니다' })
    }

    // 역할 변경
    const updates: Record<string, unknown> = {}

    if (body.role) {
      const newRole = body.role as string

      // owner는 이 API로 지정 불가
      if (newRole === 'owner') {
        return ApiResponse.badRequest('소유자 역할은 이 API로 지정할 수 없습니다')
      }

      // admin이 다른 admin의 역할을 바꾸려는 경우 차단
      if (myMembership.role === 'admin' && target.role === 'admin') {
        return ApiResponse.forbidden('관리자는 다른 관리자의 역할을 변경할 수 없습니다')
      }

      // admin은 admin 역할 부여 불가 (owner만 가능)
      if (myMembership.role === 'admin' && newRole === 'admin') {
        return ApiResponse.forbidden('관리자 역할 부여는 소유자만 가능합니다')
      }

      if (!['admin', 'member', 'alumni'].includes(newRole)) {
        return ApiResponse.badRequest('역할은 admin, member, alumni 중 하나여야 합니다')
      }

      updates.role = newRole
    }

    if (body.cohort !== undefined) {
      updates.cohort = body.cohort
    }

    if (Object.keys(updates).length === 0) {
      return ApiResponse.badRequest('변경할 항목이 없습니다')
    }

    const { data: updated, error } = await supabase
      .from('club_members')
      .update(updates)
      .eq('id', memberId)
      .select('id, user_id, role, cohort, status')
      .single()

    if (error) return ApiResponse.internalError(error.message)

    return ApiResponse.ok(updated)
  }
)
