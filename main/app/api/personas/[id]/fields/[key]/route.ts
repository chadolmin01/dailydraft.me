import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { FIELD_CATALOG } from '@/src/lib/personas/field-catalog'
import { FIELD_KEYS, type FieldKey } from '@/src/lib/personas/types'

/**
 * PATCH /api/personas/:id/fields/:key
 * body: { value: Record<string, unknown> }
 *
 * 단일 슬롯 upsert. source='manual', confidence=1.0.
 * merge_strategy / locked는 FIELD_CATALOG의 defaultForClub 값을 기본값으로 사용.
 * (project 페르소나는 R5에서 defaultForProject로 분기.)
 *
 * RLS(persona_fields_write_editable)가 can_edit_persona()로 최종 게이트.
 */
export const PATCH = withErrorCapture(async (request, context) => {
  const { id: personaId, key } = (await context.params) as {
    id: string
    key: string
  }

  if (!FIELD_KEYS.includes(key as FieldKey)) {
    return ApiResponse.badRequest(`유효하지 않은 슬롯입니다: ${key}`)
  }
  const fieldKey = key as FieldKey
  const spec = FIELD_CATALOG[fieldKey]

  const body = await request.json().catch(() => ({}))
  const value = body.value
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return ApiResponse.badRequest('value는 객체여야 합니다 (예: { text: "..." })')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  // 권한 체크: can_edit_persona RPC (SECURITY DEFINER). INSERT는 admin client로
  // Supabase SSR cookie auth.uid() 전파 이슈 회피 (42501 RLS fail 방지).
  const admin = createAdminClient()
  const { data: canEdit, error: rpcErr } = await admin.rpc('can_edit_persona', {
    p_persona_id: personaId,
    p_user_id: user.id,
  })
  if (rpcErr) {
    console.error('[persona_fields] can_edit_persona rpc 실패:', rpcErr)
    return ApiResponse.internalError('권한 확인 실패', rpcErr.message)
  }
  if (!canEdit) {
    return ApiResponse.forbidden('이 페르소나를 편집할 권한이 없습니다')
  }

  // upsert — DB 유니크 제약 (persona_id, field_key)이 보장.
  const { data, error } = await (admin as any)
    .from('persona_fields')
    .upsert(
      {
        persona_id: personaId,
        field_key: fieldKey,
        value,
        source: 'manual',
        merge_strategy: spec.defaultForClub.merge_strategy,
        locked: spec.defaultForClub.locked,
        confidence: 1.0,
        updated_by: user.id,
      },
      { onConflict: 'persona_id,field_key' },
    )
    .select('*')
    .single()

  if (error) {
    console.error('[persona_fields] upsert 실패:', error)
    return ApiResponse.internalError(`슬롯 저장 실패: ${error.message}`, error)
  }

  return ApiResponse.ok(data)
})
