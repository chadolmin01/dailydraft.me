import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/**
 * POST /api/clubs/[slug]/members/[memberId]/approve — 멤버 승인/거절
 *
 * Body: { action: 'approve' | 'reject' }
 *
 * approve → status = 'active', Discord 싱크 트리거
 * reject → status = 'rejected' (감사 기록 보존)
 */
export const POST = withErrorCapture(
  async (request, context) => {
    const { slug, memberId } = await context.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

    // admin 권한 확인
    const { data: membership } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', club.id)
      .eq('user_id', user.id)
      .in('role', ['admin', 'owner'])
      .maybeSingle()

    if (!membership) {
      return ApiResponse.forbidden('관리자만 승인/거절할 수 있습니다')
    }

    const body = await request.json()
    const action = body.action as string

    if (!['approve', 'reject'].includes(action)) {
      return ApiResponse.badRequest('action은 approve 또는 reject여야 합니다')
    }

    // 대상 멤버 확인 (pending 상태만)
    // status: 마이그레이션 적용 후 타입 재생성하면 정상화
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: target } = await (supabase as any)
      .from('club_members')
      .select('id, user_id, status')
      .eq('id', memberId)
      .eq('club_id', club.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (!target) {
      return ApiResponse.notFound('승인 대기 중인 멤버를 찾을 수 없습니다')
    }

    const newStatus = action === 'approve' ? 'active' : 'rejected'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (supabase as any)
      .from('club_members')
      .update({ status: newStatus })
      .eq('id', memberId)
      .select('id, user_id, role, cohort, status')
      .single()

    if (error) return ApiResponse.internalError(error.message)

    // 승인 시 Discord 싱크 (fire-and-forget)
    if (action === 'approve' && target?.user_id) {
      import('@/src/lib/discord/sync')
        .then(({ syncMemberToDiscord }) => syncMemberToDiscord(club.id, target.user_id))
        .catch(e => console.warn('[approve] Discord sync failed:', e))
    }

    const result = { ...(updated || {}), message: action === 'approve' ? '멤버가 승인되었습니다' : '멤버가 거절되었습니다' }
    return ApiResponse.ok(result)
  }
)
