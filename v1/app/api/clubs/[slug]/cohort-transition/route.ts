/**
 * 기수 전환 일괄처리 API
 *
 * POST /api/clubs/[slug]/cohort-transition
 *
 * 1. 현재 기수 멤버 전원을 alumni로 변경
 * 2. 새 기수 번호 설정
 * 3. Discord 채널 아카이브 (선택)
 *
 * 운영진(admin/owner)만 호출 가능.
 * 되돌리기 어려운 작업이므로 confirm 플래그 필수.
 */

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const POST = withErrorCapture(
  async (request, context) => {
    const { slug } = await context.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const body = await request.json()
    const { new_cohort, confirm } = body as { new_cohort?: string; confirm?: boolean }

    if (!new_cohort?.trim()) {
      return ApiResponse.badRequest('new_cohort가 필요합니다 (예: "2기")')
    }

    if (!confirm) {
      return ApiResponse.badRequest('confirm: true를 포함해야 합니다. 이 작업은 되돌리기 어렵습니다.')
    }

    // 1. 클럽 확인 + 권한 체크
    const admin = createAdminClient()

    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

    const { data: membership } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', club.id)
      .eq('user_id', user.id)
      .maybeSingle()

    const role = (membership as { role?: string } | null)?.role
    if (!role || !['admin', 'owner'].includes(role)) {
      return ApiResponse.forbidden('운영진만 기수 전환을 수행할 수 있습니다')
    }

    // 2. 현재 활동 멤버를 alumni로 전환
    const { data: currentMembers, error: fetchError } = await admin
      .from('club_members')
      .select('id, user_id, role, cohort')
      .eq('club_id', club.id)
      .neq('role', 'alumni')

    if (fetchError) return ApiResponse.internalError(fetchError.message)

    const memberIds = (currentMembers || []).map((m: { id: string }) => m.id)

    if (memberIds.length > 0) {
      const { error: updateError } = await admin
        .from('club_members')
        .update({ role: 'alumni' } as never)
        .in('id', memberIds)

      if (updateError) return ApiResponse.internalError(updateError.message)
    }

    // 3. 운영진(admin/owner)은 새 기수에도 유지 — 새 멤버로 재등록
    const admins = (currentMembers || []).filter(
      (m: { role: string }) => ['admin', 'owner'].includes(m.role)
    )

    for (const adm of admins as { user_id: string; role: string }[]) {
      if (!adm.user_id) continue
      await admin
        .from('club_members')
        .upsert({
          club_id: club.id,
          user_id: adm.user_id,
          role: adm.role,
          cohort: new_cohort,
        } as never, { onConflict: 'club_id,user_id' })
    }

    return ApiResponse.ok({
      success: true,
      previous_members_archived: memberIds.length,
      admins_carried_over: admins.length,
      new_cohort,
      message: `${memberIds.length}명을 alumni로 전환하고 ${new_cohort}를 시작했습니다`,
    })
  }
)
