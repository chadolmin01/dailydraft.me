import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/**
 * GET /api/personas/:id/channels
 *
 * 페르소나에 연결된 외부 채널 상태 목록.
 * encrypted_token은 절대 반환 안 함 — connected 여부 + account_ref + expires_at만.
 */
export const GET = withErrorCapture(async (_request, context) => {
  const { id: personaId } = (await context.params) as { id: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()

  const { data: rows, error } = await admin
    .from('persona_channel_credentials')
    .select('id, channel_type, account_ref, scope, expires_at, active, installed_by, created_at')
    .eq('persona_id', personaId)
    .eq('active', true)

  if (error) return ApiResponse.internalError('채널 조회 실패', error)

  const now = Date.now()
  const channels = (rows ?? []).map((r) => ({
    id: r.id,
    channel_type: r.channel_type,
    account_ref: r.account_ref,
    scope: r.scope,
    connected: true,
    expired:
      !!r.expires_at && new Date(r.expires_at as string).getTime() < now,
    expires_at: r.expires_at,
    installed_by_me: r.installed_by === user.id,
  }))

  return ApiResponse.ok({ channels })
})
