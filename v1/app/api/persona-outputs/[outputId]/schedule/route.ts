import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/**
 * POST /api/persona-outputs/:outputId/schedule
 * body: { scheduled_at: ISO string | null }
 *
 * 단일 persona_output의 예약 시간 설정 또는 해제 (null).
 * 크론(/api/cron/publish-scheduled)이 5분마다 scheduled_at <= now() 인 것들을 자동 발행.
 *
 * 권한: can_edit_persona (persona_outputs.persona_id 경유).
 */
export const POST = withErrorCapture(async (request, context) => {
  const { outputId } = (await context.params) as { outputId: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json().catch(() => ({}))
  let scheduledAt: string | null = null
  if (body.scheduled_at !== null && body.scheduled_at !== undefined) {
    const parsed = new Date(body.scheduled_at)
    if (Number.isNaN(parsed.getTime())) {
      return ApiResponse.badRequest('유효한 날짜가 아닙니다')
    }
    if (parsed.getTime() < Date.now() - 60_000) {
      return ApiResponse.badRequest('과거 시간으로는 예약할 수 없습니다')
    }
    scheduledAt = parsed.toISOString()
  }

  const admin = createAdminClient()

  // output → persona_id 조회
  const { data: output } = await admin
    .from('persona_outputs')
    .select('persona_id, status, is_copy_only')
    .eq('id', outputId)
    .maybeSingle<{ persona_id: string; status: string; is_copy_only: boolean }>()
  if (!output) return ApiResponse.notFound('출력물을 찾을 수 없습니다')

  // 권한 확인
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: canEdit } = await (admin as any).rpc('can_edit_persona', {
    p_persona_id: output.persona_id,
    p_user_id: user.id,
  })
  if (!canEdit) return ApiResponse.forbidden('권한이 없습니다')

  // 복사 전용 채널에 예약 시도 → 경고만 (UI에서 알림용. 여전히 저장은 허용해 날짜 리마인드 용도)
  if (output.is_copy_only && scheduledAt) {
    // 그대로 진행 — 크론이 is_copy_only면 자동 발행 없이 리마인드만 추후 구현
  }

  // 이미 발행된 것은 예약 변경 불가
  if (output.status === 'published' && scheduledAt) {
    return ApiResponse.badRequest('이미 발행된 글은 예약할 수 없습니다')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('persona_outputs') as any)
    .update({
      scheduled_at: scheduledAt,
      scheduled_by: scheduledAt ? user.id : null,
    })
    .eq('id', outputId)

  if (error) {
    console.error('[schedule] update 실패:', error)
    return ApiResponse.internalError(`예약 저장 실패: ${error.message}`)
  }

  return ApiResponse.ok({ scheduled_at: scheduledAt })
})
