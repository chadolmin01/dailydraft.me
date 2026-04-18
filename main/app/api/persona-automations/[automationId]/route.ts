import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import {
  computeNextRunAt,
  type Frequency,
} from '@/src/lib/personas/automation-schedule'

/**
 * PATCH  /api/persona-automations/:automationId — 부분 업데이트 (active 토글 등)
 * DELETE /api/persona-automations/:automationId — 삭제
 *
 * 권한: can_edit_persona (automation.persona_id 경유)
 */

async function loadAutomation(admin: ReturnType<typeof createAdminClient>, id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from('persona_automations' as never) as any)
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return { data, error } as {
    data: {
      id: string
      persona_id: string
      frequency: Frequency
      run_hour: number
      run_minute: number
      run_weekday: number | null
      run_day_of_month: number | null
    } | null
    error: unknown
  }
}

async function ensureEditable(
  admin: ReturnType<typeof createAdminClient>,
  personaId: string,
  userId: string,
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any).rpc('can_edit_persona', {
    p_persona_id: personaId,
    p_user_id: userId,
  })
  return !!data
}

export const PATCH = withErrorCapture(async (request, context) => {
  const { automationId } = (await context.params) as { automationId: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()
  const { data: row, error: rErr } = await loadAutomation(admin, automationId)
  if (rErr) return ApiResponse.internalError('조회 실패', rErr as Error)
  if (!row) return ApiResponse.notFound('자동화를 찾을 수 없습니다')

  const editable = await ensureEditable(admin, row.persona_id, user.id)
  if (!editable) return ApiResponse.forbidden('권한이 없습니다')

  const body = await request.json().catch(() => ({}))
  const patch: Record<string, unknown> = {}
  for (const key of [
    'event_type',
    'frequency',
    'run_hour',
    'run_minute',
    'run_weekday',
    'run_day_of_month',
    'daily_count',
    'auto_publish',
    'default_metadata',
    'active',
  ]) {
    if (key in body) patch[key] = body[key]
  }

  // 스케줄 관련 필드가 바뀌면 next_run_at 재계산
  const scheduleChanged =
    'frequency' in patch ||
    'run_hour' in patch ||
    'run_minute' in patch ||
    'run_weekday' in patch ||
    'run_day_of_month' in patch ||
    'active' in patch
  if (scheduleChanged) {
    const merged = { ...row, ...patch } as {
      frequency: Frequency
      run_hour: number
      run_minute: number
      run_weekday: number | null
      run_day_of_month: number | null
      active?: boolean
    }
    if (patch.active === false) {
      patch.next_run_at = null
    } else {
      patch.next_run_at = computeNextRunAt({
        frequency: merged.frequency,
        run_hour: merged.run_hour,
        run_minute: merged.run_minute,
        run_weekday: merged.run_weekday,
        run_day_of_month: merged.run_day_of_month,
      })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from('persona_automations' as never) as any)
    .update(patch)
    .eq('id', automationId)
    .select('*')
    .single()

  if (error) return ApiResponse.internalError('업데이트 실패', error)
  return ApiResponse.ok({ automation: data })
})

export const DELETE = withErrorCapture(async (_request, context) => {
  const { automationId } = (await context.params) as { automationId: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()
  const { data: row } = await loadAutomation(admin, automationId)
  if (!row) return ApiResponse.notFound('자동화를 찾을 수 없습니다')

  const editable = await ensureEditable(admin, row.persona_id, user.id)
  if (!editable) return ApiResponse.forbidden('권한이 없습니다')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('persona_automations' as never) as any)
    .delete()
    .eq('id', automationId)

  if (error) return ApiResponse.internalError('삭제 실패', error)
  return ApiResponse.noContent()
})
