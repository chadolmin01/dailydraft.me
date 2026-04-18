import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/**
 * DELETE /api/personas/:id/channels/:credentialId
 *
 * 특정 채널 연결 해제. active=false 소프트 삭제.
 * RLS: 편집자만 (persona_channel_credentials_write)
 */
export const DELETE = withErrorCapture(async (_request, context) => {
  const { id: personaId, credentialId } = (await context.params) as {
    id: string
    credentialId: string
  }
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

  const { error } = await admin
    .from('persona_channel_credentials')
    .update({ active: false, encrypted_token: null })
    .eq('id', credentialId)
    .eq('persona_id', personaId)

  if (error) return ApiResponse.internalError('해제 실패', error)

  return ApiResponse.noContent()
})
