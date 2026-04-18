import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/**
 * PATCH  /api/persona-idea-cards/:cardId — 카드 상태 업데이트 (drafted/used/dismissed)
 * DELETE /api/persona-idea-cards/:cardId — 하드 삭제
 */

async function loadCard(
  admin: ReturnType<typeof createAdminClient>,
  id: string,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from('persona_idea_cards' as never) as any)
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return { data, error } as {
    data: { id: string; persona_id: string } | null
    error: unknown
  }
}

async function canEdit(
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
  const { cardId } = (await context.params) as { cardId: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()
  const { data: row } = await loadCard(admin, cardId)
  if (!row) return ApiResponse.notFound('카드를 찾을 수 없습니다')

  if (!(await canEdit(admin, row.persona_id, user.id)))
    return ApiResponse.forbidden('권한이 없습니다')

  const body = await request.json().catch(() => ({}))
  const patch: Record<string, unknown> = {}
  for (const k of ['status', 'title', 'description', 'bundle_id']) {
    if (k in body) patch[k] = body[k]
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from('persona_idea_cards' as never) as any)
    .update(patch)
    .eq('id', cardId)
    .select('*')
    .single()

  if (error) return ApiResponse.internalError('업데이트 실패', error)
  return ApiResponse.ok({ card: data })
})

export const DELETE = withErrorCapture(async (_request, context) => {
  const { cardId } = (await context.params) as { cardId: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()
  const { data: row } = await loadCard(admin, cardId)
  if (!row) return ApiResponse.notFound('카드를 찾을 수 없습니다')

  if (!(await canEdit(admin, row.persona_id, user.id)))
    return ApiResponse.forbidden('권한이 없습니다')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('persona_idea_cards' as never) as any)
    .delete()
    .eq('id', cardId)

  if (error) return ApiResponse.internalError('삭제 실패', error)
  return ApiResponse.noContent()
})
