import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/**
 * DELETE /api/persona-templates/:templateId
 *
 * 템플릿 삭제. can_edit_persona_owner로 권한 선검증 후 admin 삭제.
 */
export const DELETE = withErrorCapture(async (_request, context) => {
  const { templateId } = (await context.params) as { templateId: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()

  // 템플릿 조회 (type/owner 확보)
  const { data: template } = await admin
    .from('persona_templates' as never)
    .select('type, owner_id')
    .eq('id', templateId)
    .maybeSingle<{ type: string; owner_id: string }>()
  if (!template) return ApiResponse.notFound('템플릿을 찾을 수 없습니다')

  // 권한 체크
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: canEdit, error: rpcErr } = await (admin as any).rpc(
    'can_edit_persona_owner',
    {
      p_type: template.type,
      p_owner_id: template.owner_id,
      p_user_id: user.id,
    },
  )
  if (rpcErr) return ApiResponse.internalError('권한 확인 실패', rpcErr.message)
  if (!canEdit) return ApiResponse.forbidden('권한이 없습니다')

  const { error } = await admin
    .from('persona_templates' as never)
    .delete()
    .eq('id', templateId)

  if (error) {
    console.error('[persona_templates] delete 실패:', error)
    return ApiResponse.internalError(`삭제 실패: ${error.message}`)
  }

  return ApiResponse.noContent()
})
