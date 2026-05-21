import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { FIELD_KEYS } from '@/src/lib/personas/types'
import type {
  FieldKey,
  PersonaRow,
  PersonaTemplateFieldSnapshot,
} from '@/src/lib/personas/types'

/**
 * POST /api/personas/:id/restore-template
 * body: { template_id: string }
 *
 * 템플릿의 fields_snapshot을 현재 페르소나 persona_fields에 일괄 upsert.
 * 덮어쓰기 시맨틱 — 기존 값이 있으면 교체. 원하지 않는 슬롯은 snapshot에서 뺀 상태로 저장돼야 함.
 *
 * 템플릿의 type/owner가 페르소나와 일치해야 안전.
 */
export const POST = withErrorCapture(async (request, context) => {
  const { id: personaId } = (await context.params) as { id: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json().catch(() => ({}))
  const templateId = String(body.template_id ?? '').trim()
  if (!templateId) return ApiResponse.badRequest('template_id가 필요합니다')

  const admin = createAdminClient()

  // 페르소나 조회
  const { data: persona } = await admin
    .from('personas')
    .select('*')
    .eq('id', personaId)
    .maybeSingle<PersonaRow>()
  if (!persona) return ApiResponse.notFound('페르소나를 찾을 수 없습니다')

  // 권한 체크
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: canEdit, error: rpcErr } = await (admin as any).rpc(
    'can_edit_persona_owner',
    {
      p_type: persona.type,
      p_owner_id: persona.owner_id,
      p_user_id: user.id,
    },
  )
  if (rpcErr) return ApiResponse.internalError('권한 확인 실패', rpcErr.message)
  if (!canEdit) return ApiResponse.forbidden('권한이 없습니다')

  // 템플릿 조회 + 일치성 검사
  const { data: template } = await admin
    .from('persona_templates' as never)
    .select('*')
    .eq('id', templateId)
    .maybeSingle<{
      type: string
      owner_id: string
      fields_snapshot: PersonaTemplateFieldSnapshot[]
    }>()
  if (!template) return ApiResponse.notFound('템플릿을 찾을 수 없습니다')

  if (
    template.type !== persona.type ||
    template.owner_id !== persona.owner_id
  ) {
    return ApiResponse.badRequest(
      '이 템플릿은 다른 소속의 페르소나에서 만들어져 복원할 수 없습니다',
    )
  }

  // 스냅샷 필터링 — 유효한 field_key만
  const snapshot = (template.fields_snapshot ?? []).filter(
    (s): s is PersonaTemplateFieldSnapshot =>
      !!s && FIELD_KEYS.includes(s.field_key as FieldKey),
  )

  if (snapshot.length === 0) {
    return ApiResponse.badRequest('이 템플릿에는 복원할 슬롯이 없습니다')
  }

  const upserts = snapshot.map((s) => ({
    persona_id: personaId,
    field_key: s.field_key,
    value: s.value,
    source: s.source,
    locked: s.locked,
    merge_strategy: s.merge_strategy,
    confidence: 1.0, // 회장이 명시적으로 복원한 것 = 완전 신뢰
    updated_by: user.id,
  }))

  const { error: upErr } = await admin
    .from('persona_fields')
    .upsert(upserts as never, { onConflict: 'persona_id,field_key' })

  if (upErr) {
    console.error('[restore_template] upsert 실패:', upErr)
    return ApiResponse.internalError(`복원 실패: ${upErr.message}`)
  }

  // training_runs 기록 (롤백 추적)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('persona_training_runs') as any).insert({
    persona_id: personaId,
    trigger: 'manual',
    status: 'completed',
    model_version: null,
    extracted_diff: {
      source: 'template_restore',
      template_id: templateId,
      slot_count: snapshot.length,
      restored_fields: snapshot.map((s) => s.field_key),
    },
    completed_at: new Date().toISOString(),
  })

  return ApiResponse.ok({
    restored_count: snapshot.length,
    restored_fields: snapshot.map((s) => s.field_key),
  })
})
