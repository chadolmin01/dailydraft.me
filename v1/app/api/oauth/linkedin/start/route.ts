import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

/**
 * GET /api/oauth/linkedin/start?persona_id=<uuid>&return_to=<path>
 *
 * LinkedIn OAuth 시작 — 회장이 "LinkedIn 연결" 클릭 시 리다이렉트 엔드포인트.
 *
 * 흐름:
 *   1. persona_id + return_to를 state로 서명해 짧은 쿠키에 저장
 *   2. LinkedIn authorize URL로 302 리다이렉트
 *   3. 콜백이 state 검증 후 토큰 저장 → return_to로 이동
 *
 * scope: openid profile w_member_social — 개인 프로필에 글 게시
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const personaId = searchParams.get('persona_id')
  const returnTo = searchParams.get('return_to') || '/'

  if (!personaId) return ApiResponse.badRequest('persona_id가 필요합니다')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const clientId = process.env.LINKEDIN_CLIENT_ID
  if (!clientId) {
    return ApiResponse.internalError(
      'LINKEDIN_CLIENT_ID 환경변수가 설정되지 않았습니다',
    )
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    'http://localhost:3000'
  const redirectUri = `${appUrl}/api/oauth/linkedin/callback`

  // state: CSRF 방어 + 콜백에서 persona_id·return_to 복원용
  // 쿠키로 전달 (서명된 JWT 대신 단순 랜덤+쿠키). CSRF는 쿠키 state 일치 검증으로.
  const stateNonce = randomBytes(16).toString('base64url')
  const stateData = {
    nonce: stateNonce,
    persona_id: personaId,
    return_to: returnTo,
    user_id: user.id,
  }
  const stateB64 = Buffer.from(JSON.stringify(stateData)).toString('base64url')

  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', stateNonce)
  authUrl.searchParams.set('scope', 'openid profile w_member_social')

  const res = NextResponse.redirect(authUrl.toString())

  // 쿠키에 state data 저장. 콜백에서 state 쿼리파람과 nonce 일치 검증.
  // httpOnly + secure(prod) + sameSite=lax(OAuth는 third-party 리다이렉트)
  res.cookies.set('linkedin_oauth_state', stateB64, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10분
  })

  return res
}
