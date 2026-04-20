/**
 * GET  /api/personas/:id — persona + fields (by persona id, not owner)
 * PATCH /api/personas/:id — 부분 업데이트 (inherit_from_parent · name · term_end_at 등)
 *
 * RLS 가 can_view_persona / can_edit_persona 로 게이트하므로 서버측 중복 검증은 최소.
 * PATCH 는 화이트리스트 필드만 허용 — status·owner_id 같은 중요 필드는 전용 엔드포인트로 분리.
 */

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import type { PersonaFieldRow, PersonaRow } from '@/src/lib/personas/types'

const PATCH_WHITELIST = new Set([
  'name',
  'inherit_from_parent',
  'term_end_at',
  'parent_persona_id',
])

export const GET = withErrorCapture(async (_request, context) => {
  const { id } = (await context.params) as { id: string }

  const supabase = await createClient()

  const { data: persona, error: pErr } = await supabase
    .from('personas')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (pErr) return ApiResponse.internalError('페르소나 조회 실패', pErr)
  if (!persona) return ApiResponse.notFound('페르소나를 찾을 수 없습니다')

  const { data: fields } = await supabase
    .from('persona_fields')
    .select('*')
    .eq('persona_id', id)

  return ApiResponse.ok({
    persona: persona as PersonaRow,
    fields: (fields ?? []) as PersonaFieldRow[],
  })
})

export const PATCH = withErrorCapture(async (request, context) => {
  const { id } = (await context.params) as { id: string }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json().catch(() => ({}))
  if (!body || typeof body !== 'object') {
    return ApiResponse.badRequest('body 는 object 여야 합니다')
  }

  const patch: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    if (PATCH_WHITELIST.has(k)) patch[k] = v
  }

  if (Object.keys(patch).length === 0) {
    return ApiResponse.badRequest('수정 가능한 필드가 없습니다')
  }

  const admin = createAdminClient()

  // 편집 권한 확인 — RLS 도 막지만 선 검증으로 403 응답 명확화
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: canEdit } = await (admin as any).rpc('can_edit_persona', {
    p_persona_id: id,
    p_user_id: user.id,
  })
  if (!canEdit) return ApiResponse.forbidden('편집 권한이 없습니다')

  const { data, error } = await admin
    .from('personas')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(patch as any)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    return ApiResponse.internalError(`업데이트 실패: ${error.message}`, error)
  }

  return ApiResponse.ok(data as PersonaRow)
})
