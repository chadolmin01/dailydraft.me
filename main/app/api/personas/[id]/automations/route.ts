import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { EVENT_TYPES, type EventType } from '@/src/lib/personas/types'
import {
  computeNextRunAt,
  type Frequency,
} from '@/src/lib/personas/automation-schedule'

/**
 * GET  /api/personas/:id/automations — 자동화 스케줄 목록
 * POST /api/personas/:id/automations — 새 자동화 생성
 *
 * 권한: can_edit_persona (쓰기), can_view_persona (읽기)
 */

export const GET = withErrorCapture(async (_request, context) => {
  const { id: personaId } = (await context.params) as { id: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: canView } = await (admin as any).rpc('can_view_persona', {
    p_persona_id: personaId,
    p_user_id: user.id,
  })
  if (!canView) return ApiResponse.forbidden('권한이 없습니다')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from('persona_automations' as never) as any)
    .select('*')
    .eq('persona_id', personaId)
    .order('created_at', { ascending: false })

  if (error) return ApiResponse.internalError('자동화 조회 실패', error)
  return ApiResponse.ok({ automations: data ?? [] })
})

export const POST = withErrorCapture(async (request, context) => {
  const { id: personaId } = (await context.params) as { id: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: canEdit } = await (admin as any).rpc('can_edit_persona', {
    p_persona_id: personaId,
    p_user_id: user.id,
  })
  if (!canEdit) return ApiResponse.forbidden('권한이 없습니다')

  const body = await request.json().catch(() => ({}))
  const {
    event_type,
    frequency,
    run_hour,
    run_minute,
    run_weekday,
    run_day_of_month,
    daily_count,
    auto_publish,
    default_metadata,
    active,
  } = body as {
    event_type?: string
    frequency?: string
    run_hour?: number
    run_minute?: number
    run_weekday?: number | null
    run_day_of_month?: number | null
    daily_count?: number
    auto_publish?: boolean
    default_metadata?: Record<string, unknown>
    active?: boolean
  }

  if (!EVENT_TYPES.includes(event_type as EventType)) {
    return ApiResponse.badRequest(`유효하지 않은 event_type: ${event_type}`)
  }
  if (!['daily', 'weekly', 'biweekly', 'monthly'].includes(frequency ?? '')) {
    return ApiResponse.badRequest(`유효하지 않은 frequency: ${frequency}`)
  }

  const cfg = {
    frequency: frequency as Frequency,
    run_hour: clamp(run_hour ?? 9, 0, 23),
    run_minute: clamp(run_minute ?? 0, 0, 59),
    run_weekday: run_weekday ?? null,
    run_day_of_month: run_day_of_month ?? null,
  }

  const nextRunAt = computeNextRunAt(cfg)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from('persona_automations' as never) as any)
    .insert({
      persona_id: personaId,
      event_type,
      frequency: cfg.frequency,
      run_hour: cfg.run_hour,
      run_minute: cfg.run_minute,
      run_weekday: cfg.run_weekday,
      run_day_of_month: cfg.run_day_of_month,
      daily_count: clamp(daily_count ?? 1, 1, 5),
      auto_publish: auto_publish === true,
      default_metadata: default_metadata ?? {},
      active: active !== false,
      next_run_at: nextRunAt,
      created_by: user.id,
    })
    .select('*')
    .single()

  if (error) return ApiResponse.internalError('자동화 생성 실패', error)
  return ApiResponse.created({ automation: data })
})

function clamp(n: number, min: number, max: number): number {
  if (typeof n !== 'number' || Number.isNaN(n)) return min
  return Math.max(min, Math.min(max, Math.floor(n)))
}
