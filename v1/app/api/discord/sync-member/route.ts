import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { syncMemberToDiscord, syncAllClubMembers } from '@/src/lib/discord/sync'

/**
 * POST /api/discord/sync-member
 *
 * Draft 온보딩 완료 후 Discord 역할/닉네임 동기화 트리거.
 *
 * Body:
 *   { club_id: string, user_id?: string, bulk?: boolean }
 *
 * - user_id 생략 시 → 인증된 본인을 싱크 (온보딩 완료 시)
 * - user_id 지정 시 → 해당 유저 싱크 (관리자 전용)
 * - bulk: true → 클럽 전체 멤버 싱크 (관리자 전용)
 */
export const POST = withErrorCapture(
  async (request) => {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const body = await request.json()
    const clubId = body.club_id as string

    if (!clubId) {
      return ApiResponse.badRequest('club_id가 필요합니다')
    }

    // 클럽 존재 확인
    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('id', clubId)
      .maybeSingle()

    if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

    // 벌크 싱크 (관리자 전용)
    if (body.bulk === true) {
      // 관리자 권한 확인
      const { data: adminCheck } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .in('role', ['admin', 'owner'])
        .maybeSingle()

      if (!adminCheck) {
        return ApiResponse.forbidden('관리자만 벌크 싱크를 실행할 수 있습니다')
      }

      const result = await syncAllClubMembers(clubId)
      return ApiResponse.ok(result)
    }

    // 단일 멤버 싱크
    const targetUserId = body.user_id || user.id

    // 타인 싱크 시 관리자 권한 확인
    if (body.user_id && body.user_id !== user.id) {
      const { data: adminCheck } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .in('role', ['admin', 'owner'])
        .maybeSingle()

      if (!adminCheck) {
        return ApiResponse.forbidden('다른 멤버의 싱크는 관리자만 가능합니다')
      }
    }

    const result = await syncMemberToDiscord(clubId, targetUserId)
    return ApiResponse.ok(result)
  }
)
