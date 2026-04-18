import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { checkAIRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'
import { polishSlots } from '@/src/lib/personas/slot-polisher'
import type { PersonaFieldRow, PersonaRow } from '@/src/lib/personas/types'

/**
 * POST /api/personas/:id/polish
 * body: { instruction: string }
 *
 * 자연어 지시로 현재 저장된 슬롯들을 일괄 수정.
 * 예시 지시: "더 격식 있게", "GenZ 톤으로", "기술 전문가 독자 기준으로 다시"
 *
 * Gemini가 지시와 무관한 슬롯은 건드리지 않음. 변경된 슬롯만 upsert.
 * 기존 값은 persona_training_runs.extracted_diff에 before/after로 저장 (롤백용).
 */
export const POST = withErrorCapture(async (request, context) => {
  const { id: personaId } = (await context.params) as { id: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  // Rate limit — Gemini 호출. 초당 여러 번 polish 누르는 남용 방지.
  const rateLimitRes = await checkAIRateLimit(user.id, getClientIp(request))
  if (rateLimitRes) return rateLimitRes

  const body = await request.json().catch(() => ({}))
  const instruction = String(body.instruction ?? '').trim()
  if (!instruction || instruction.length < 3) {
    return ApiResponse.badRequest('수정 지시를 3자 이상 입력해주세요')
  }
  if (instruction.length > 300) {
    return ApiResponse.badRequest('수정 지시는 300자 이내여야 합니다')
  }

  const admin = createAdminClient()

  // 권한 체크
  const { data: canEdit, error: rpcErr } = await admin.rpc('can_edit_persona', {
    p_persona_id: personaId,
    p_user_id: user.id,
  })
  if (rpcErr) return ApiResponse.internalError('권한 확인 실패', rpcErr.message)
  if (!canEdit) return ApiResponse.forbidden('이 페르소나를 편집할 권한이 없습니다')

  // 페르소나 + 기존 슬롯 + 조직명
  const { data: persona } = await admin
    .from('personas')
    .select('*')
    .eq('id', personaId)
    .maybeSingle()
  if (!persona) return ApiResponse.notFound('페르소나를 찾을 수 없습니다')

  const { data: currentFields } = await admin
    .from('persona_fields')
    .select('*')
    .eq('persona_id', personaId)

  const fields = (currentFields ?? []) as PersonaFieldRow[]
  if (fields.length === 0) {
    return ApiResponse.badRequest(
      '아직 작성된 슬롯이 없습니다. 먼저 "AI에게 초안 받기" 또는 수동으로 슬롯을 채워주세요.',
    )
  }

  let orgName = persona.name
  if (persona.type === 'club') {
    const { data: club } = await admin
      .from('clubs')
      .select('name')
      .eq('id', persona.owner_id)
      .maybeSingle()
    if (club?.name) orgName = club.name
  }

  // Polish 실행
  const result = await polishSlots({
    orgName,
    currentFields: fields,
    instruction,
  })

  // 변경된 슬롯만 upsert. 기존 source / merge_strategy / locked 유지 (수정만 반영)
  const fieldMap = new Map(fields.map((f) => [f.field_key, f]))
  const changedSlots = result.slots.filter((s) => s.changed && !s.error)

  const upserts = changedSlots.map((s) => {
    const existing = fieldMap.get(s.field_key)!
    return {
      persona_id: personaId,
      field_key: s.field_key,
      value: s.value,
      // source는 'auto'로 — AI가 수정한 것이므로
      source: 'auto' as const,
      merge_strategy: existing.merge_strategy,
      locked: existing.locked,
      confidence: Math.max(existing.confidence, 0.8), // 회장이 명시적 지시 → 높게
      updated_by: user.id,
    }
  })

  if (upserts.length > 0) {
    const { error: upErr } = await admin
      .from('persona_fields')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(upserts as any, { onConflict: 'persona_id,field_key' })
    if (upErr) {
      console.error('[persona_polish] upsert 실패:', upErr)
      return ApiResponse.internalError(`슬롯 저장 실패: ${upErr.message}`)
    }
  }

  // 이력 기록 (롤백 가능)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('persona_training_runs') as any).insert({
    persona_id: personaId,
    trigger: 'manual',
    status: 'completed',
    model_version: 'gemini-2.5-flash-lite',
    extracted_diff: {
      source: 'ai_polish',
      instruction,
      changes: changedSlots.map((s) => ({
        field_key: s.field_key,
        before: fieldMap.get(s.field_key)?.value ?? null,
        after: s.value,
      })),
    },
    completed_at: new Date().toISOString(),
  })

  return ApiResponse.ok({
    changed_count: result.changed_count,
    skipped_count: result.skipped_count,
    changed_fields: changedSlots.map((s) => s.field_key),
  })
})
