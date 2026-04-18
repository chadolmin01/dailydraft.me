import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/**
 * POST /api/personas/:id/reset
 *
 * 페르소나의 모든 persona_fields 삭제.
 * personas 본체는 유지 (학습 이력 / 발행 이력 보존).
 * 상속받은 필드는 resolve 시 다시 부모에서 merge되므로 별도 처리 불요.
 *
 * RLS의 persona_fields_write_editable(DELETE 포함)이 can_edit_persona()로 최종 게이트.
 */
export const POST = withErrorCapture(async (_request, context) => {
  const { id: personaId } = (await context.params) as { id: string }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { error } = await (supabase as any)
    .from('persona_fields')
    .delete()
    .eq('persona_id', personaId)

  if (error) {
    return ApiResponse.internalError('초기화에 실패했습니다', error)
  }

  return ApiResponse.noContent()
})
