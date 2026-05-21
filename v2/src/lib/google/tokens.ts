import { createAdminClient } from '@/src/lib/supabase/admin'
import { refreshAccessToken } from './oauth'

// google_tokens 는 RLS 가 모든 클라이언트 접근 차단 → service_role 로만 읽고 쓴다.
// 토큰 만료 60초 전부터 refresh 발동 (race condition 방어).
const REFRESH_BUFFER_MS = 60 * 1000

/**
 * 매니저가 Google 권한을 다시 연결해야 하는 상황 표시용 에러.
 * 라우트 핸들러는 이걸 catch 해서 401 + reauth 플래그로 응답 → 클라이언트가 재로그인 UX 트리거.
 *
 * 발생 시나리오:
 *   - google_tokens 행 자체가 없음 (최초 로그인 안 했거나 삭제됨)
 *   - refresh_token 이 Google 에서 무효화됨 (사용자가 Google 계정 권한 페이지에서 제거,
 *     장기간 미사용, 비밀번호 변경 등)
 */
export class GoogleAuthRequiredError extends Error {
  readonly code = 'GOOGLE_AUTH_REQUIRED'
  constructor(message = 'Google 권한 재연결이 필요합니다') {
    super(message)
    this.name = 'GoogleAuthRequiredError'
  }
}

/**
 * 현재 매니저의 유효한 access_token 을 반환.
 * 만료됐거나 곧 만료될 거면 refresh_token 으로 갱신 후 google_tokens 업데이트.
 *
 * 호출자 책임: userId 는 반드시 인증된 세션의 user.id 여야 함 (route handler 에서
 * supabase.auth.getUser() 로 검증 후 전달).
 *
 * Throws:
 *   - GoogleAuthRequiredError: 재인증 필요 (사용자가 Google 권한 재연결해야 함)
 *   - Error: 기타 (DB 연결 실패 등)
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const admin = createAdminClient()

  const { data: tokenRow, error } = await admin
    .from('google_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(`google_tokens read failed: ${error.message}`)
  if (!tokenRow) throw new GoogleAuthRequiredError('Google 계정 연결 정보가 없습니다. 다시 연결해 주세요.')

  const expiresAt = new Date(tokenRow.expires_at).getTime()
  const now = Date.now()

  // 아직 유효 (버퍼 안 들어옴) → 그대로 반환
  if (expiresAt - now > REFRESH_BUFFER_MS) {
    return tokenRow.access_token
  }

  // 만료 임박 → refresh 시도
  try {
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
  } catch (e) {
    // Google 의 invalid_grant 등은 refresh_token 자체가 무효 → 재인증 필요
    const msg = (e as Error).message
    if (msg.includes('invalid_grant') || msg.includes('400') || msg.includes('401')) {
      throw new GoogleAuthRequiredError('Google 권한이 만료되었습니다. 다시 연결해 주세요.')
    }
    // 네트워크 일시 오류 등은 그대로 throw (라우트가 5xx 반환)
    throw e
  }
}
