import { createAdminClient } from '@/src/lib/supabase/admin'
import { refreshAccessToken } from './oauth'

// google_tokens 는 RLS 가 모든 클라이언트 접근 차단 → service_role 로만 읽고 쓴다.
// 토큰 만료 60초 전부터 refresh 발동 (race condition 방어).
const REFRESH_BUFFER_MS = 60 * 1000

/**
 * 현재 매니저의 유효한 access_token 을 반환.
 * 만료됐거나 곧 만료될 거면 refresh_token 으로 갱신 후 google_tokens 업데이트.
 *
 * 호출자 책임: userId 는 반드시 인증된 세션의 user.id 여야 함 (route handler 에서
 * supabase.auth.getUser() 로 검증 후 전달).
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const admin = createAdminClient()

  const { data: tokenRow, error } = await admin
    .from('google_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(`google_tokens read failed: ${error.message}`)
  if (!tokenRow) throw new Error('google_tokens missing — 다시 로그인 필요')

  const expiresAt = new Date(tokenRow.expires_at).getTime()
  const now = Date.now()

  // 아직 유효 (버퍼 안 들어옴) → 그대로 반환
  if (expiresAt - now > REFRESH_BUFFER_MS) {
    return tokenRow.access_token
  }

  // 만료 임박 → refresh
  const refreshed = await refreshAccessToken(tokenRow.refresh_token)
  const newExpiresAt = new Date(now + refreshed.expires_in * 1000).toISOString()

  const { error: updateError } = await admin
    .from('google_tokens')
    .update({
      access_token: refreshed.access_token,
      expires_at: newExpiresAt,
      scope: refreshed.scope,
    })
    .eq('user_id', userId)

  if (updateError) {
    console.error('[google tokens] update after refresh failed:', updateError)
  }

  return refreshed.access_token
}
