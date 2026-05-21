import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import type {
  PersonaFieldRow,
  PersonaRow,
  PersonaTemplateFieldSnapshot,
  PersonaTemplateRow,
} from '@/src/lib/personas/types'

/**
 * GET /api/personas/:id/templates
 *
 * 페르소나의 owner 기준 템플릿 목록. 같은 owner가 보관한 모든 스냅샷이 공유됨
 * (persona_id 기반이 아니라 type+owner_id 기반 저장이므로).
 *
 * RLS(persona_templates_select)가 조회 권한(can_edit_persona_owner) 게이트.
 */
export const GET = withErrorCapture(async (_request, context) => {
  const { id: personaId } = (await context.params) as { id: string }

  const supabase = await createClient()

  // 템플릿의 type/owner는 persona의 type/owner와 동일하므로 먼저 persona 조회
  const { data: persona, error: pErr } = await supabase
    .from('personas')
    .select('type, owner_id')
    .eq('id', personaId)
    .maybeSingle<{ type: string; owner_id: string }>()

  if (pErr) return ApiResponse.internalError('페르소나 조회 실패', pErr)
  if (!persona) return ApiResponse.notFound('페르소나를 찾을 수 없습니다')

  const { data, error } = await supabase
    .from('persona_templates' as never)
    .select('*')
    .eq('type', persona.type)
    .eq('owner_id', persona.owner_id)
    .order('created_at', { ascending: false })

  if (error) return ApiResponse.internalError('템플릿 조회 실패', error)

  return ApiResponse.ok({
    templates: (data ?? []) as unknown as PersonaTemplateRow[],
  })
})

/**
 * POST /api/personas/:id/templates
 * body: { name: string, description?: string }
 *
 * 현재 persona_fields를 스냅샷으로 직렬화해 persona_templates insert.
 * name은 같은 owner 내 UNIQUE (23505면 중복 이름 오류).
 *
 * Supabase SSR cookie auth.uid() 이슈 회피 위해 INSERT는 admin client.
 * 권한은 can_edit_persona_owner RPC로 선검증.
 */
export const POST = withErrorCapture(async (request, context) => {
  const { id: personaId } = (await context.params) as { id: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json().catch(() => ({}))
  const name = String(body.name ?? '').trim()
  const description = body.description
    ? String(body.description).trim().slice(0, 500) || null
    : null

  if (!name) return ApiResponse.badRequest('템플릿 이름을 입력해주세요')
  if (name.length > 80) {
    return ApiResponse.badRequest('템플릿 이름은 80자 이내여야 합니다')
  }

  const admin = createAdminClient()

  // 페르소나 조회
  const { data: persona } = await admin
    .from('personas')
    .select('*')
    .eq('id', personaId)
    .maybeSingle<PersonaRow>()
  if (!persona) return ApiResponse.notFound('페르소나를 찾을 수 없습니다')

  // 권한 체크 (RPC 타입 자동생성 전이라 any 캐스팅)
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
  if (!canEdit) {
    return ApiResponse.forbidden('이 페르소나를 편집할 권한이 없습니다')
  }

  // 현재 필드 로드 → 스냅샷 직렬화
  const { data: fields, error: fErr } = await admin
    .from('persona_fields')
    .select('field_key, value, source, locked, merge_strategy')
    .eq('persona_id', personaId)

  if (fErr) return ApiResponse.internalError('필드 조회 실패', fErr.message)

  const snapshot: PersonaTemplateFieldSnapshot[] = (
    (fields ?? []) as Array<Pick<
      PersonaFieldRow,
      'field_key' | 'value' | 'source' | 'locked' | 'merge_strategy'
    >>
  ).map((f) => ({
    field_key: f.field_key,
    value: f.value,
    source: f.source,
    locked: f.locked,
    merge_strategy: f.merge_strategy,
  }))

  // Insert
  const { data, error } = await admin
    .from('persona_templates' as never)
    .insert({
      type: persona.type,
      owner_id: persona.owner_id,
      name,
      description,
      fields_snapshot: snapshot as unknown as Record<string, unknown>[],
      source_persona_id: persona.id,
      created_by: user.id,
    } as never)
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      return ApiResponse.badRequest('이미 같은 이름의 템플릿이 있습니다')
    }
    console.error('[persona_templates] insert 실패:', error)
    return ApiResponse.internalError(`템플릿 저장 실패: ${error.message}`)
  }

  return ApiResponse.created(data)
})
