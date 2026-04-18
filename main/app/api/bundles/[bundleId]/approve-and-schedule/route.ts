import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/**
 * POST /api/bundles/:bundleId/approve-and-schedule
 * body: { scheduled_at: ISO string }
 *
 * 번들을 "승인하되 바로 발행하진 않고" 자동 발행 가능 채널들에만 scheduled_at을 세팅.
 * 크론(/api/cron/publish-scheduled)이 도달 시간에 실제로 발행합니다.
 *
 * 왜 approveBundle을 재사용하지 않는가:
 *   approveBundle는 "지금 바로 발행" 경로 — Discord 포럼·LinkedIn API를 동기 호출합니다.
 *   예약 경로에선 크론이 시간 맞춰 발행해야 하므로, 여기선 외부 호출 없이 상태만 세팅합니다.
 *
 * 권한: can_edit_persona (bundle.persona_id 경유)
 */
export const POST = withErrorCapture(async (request, context) => {
  const { bundleId } = (await context.params) as { bundleId: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json().catch(() => ({}))
  const parsed = new Date(body.scheduled_at)
  if (Number.isNaN(parsed.getTime())) {
    return ApiResponse.badRequest('유효한 날짜가 아닙니다')
  }
  if (parsed.getTime() < Date.now() - 60_000) {
    return ApiResponse.badRequest('과거 시간으로는 예약할 수 없습니다')
  }
  const scheduledAt = parsed.toISOString()

  const admin = createAdminClient()

  // 1) 번들 로드 + 권한 검증
  const { data: bundle, error: bErr } = await admin
    .from('persona_output_bundles')
    .select('id, persona_id, status')
    .eq('id', bundleId)
    .maybeSingle<{ id: string; persona_id: string; status: string }>()
  if (bErr) return ApiResponse.internalError('번들 조회 실패', bErr)
  if (!bundle) return ApiResponse.notFound('번들을 찾을 수 없습니다')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: canEdit } = await (admin as any).rpc('can_edit_persona', {
    p_persona_id: bundle.persona_id,
    p_user_id: user.id,
  })
  if (!canEdit) return ApiResponse.forbidden('권한이 없습니다')

  const now = new Date().toISOString()

  // 2) 번들 상태 = approved (published가 아님. 크론이 output 다 발행하면 그때 published로 전이)
  const { error: bUpdErr } = await admin
    .from('persona_output_bundles')
    .update({ status: 'approved', approved_by: user.id, approved_at: now })
    .eq('id', bundleId)
  if (bUpdErr) return ApiResponse.internalError('번들 승인 실패', bUpdErr)

  // 3) 자동 발행 가능 outputs만 scheduled_at 세팅
  //    is_copy_only=false인 것만 크론 대상. is_copy_only=true는 복사 전용이라 예약 의미 없음.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: scheduled, error: sErr } = await (admin.from('persona_outputs') as any)
    .update({
      scheduled_at: scheduledAt,
      scheduled_by: user.id,
      status: 'approved',
    })
    .eq('bundle_id', bundleId)
    .eq('is_copy_only', false)
    .select('id, channel_format')

  if (sErr) return ApiResponse.internalError('예약 설정 실패', sErr)

  return ApiResponse.ok({
    bundle_id: bundleId,
    scheduled_at: scheduledAt,
    scheduled_count: (scheduled ?? []).length,
    scheduled_outputs: scheduled ?? [],
  })
})
