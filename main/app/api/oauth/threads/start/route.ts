import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { applyRateLimit, getClientIp } from '@/src/lib/rate-limit'

/**
 * GET /api/oauth/threads/start?persona_id=<uuid>&return_to=<path>
 *
 * Threads(Meta) OAuth 시작 — "Threads 연결" 버튼 클릭 시 진입.
 *
 * 흐름:
 *   1. persona_id + return_to를 state 쿠키에 base64 저장 (CSRF nonce 포함)
 *   2. Threads authorize URL(threads.net/oauth/authorize)로 302
 *   3. 콜백이 state 검증 + code → long-lived token 교환
 *
 * scope: threads_basic, threads_content_publish
 *   - threads_basic: 프로필 읽기 (user id, username)
 *   - threads_content_publish: 글 게시 (App Review 필수 승인 scope)
 *
 * 주의:
 *   - Threads는 LinkedIn과 달리 redirect_uri가 "개발자 앱에 미리 등록된 정확한 URL"과 일치해야 함
 *   - HTTPS 필수 (localhost는 개발용 테스트 유저에 한해 허용)
 */
export async function GET(request: NextRequest) {
  // Rate limit: OAuth 시작은 악의적 반복 호출(브루트 포스 state 생성, 리다이렉트 루프 유발)을
  // 방어하기 위해 IP 기반 제한 적용. 정상 플로우는 분당 1회 미만이라 사용자 영향 없음.
  const rlRes = applyRateLimit(null, getClientIp(request))
  if (rlRes) return rlRes

  const { searchParams } = new URL(request.url)
  const personaId = searchParams.get('persona_id')
  const returnTo = searchParams.get('return_to') || '/'

  if (!personaId) return ApiResponse.badRequest('persona_id가 필요합니다')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const clientId = process.env.THREADS_CLIENT_ID
  if (!clientId) {
    return ApiResponse.internalError(
      'THREADS_CLIENT_ID 환경변수가 설정되지 않았습니다',
    )
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    'http://localhost:3000'
  const redirectUri = `${appUrl}/api/oauth/threads/callback`

  const stateNonce = randomBytes(16).toString('base64url')
  const stateData = {
    nonce: stateNonce,
    persona_id: personaId,
    return_to: returnTo,
    user_id: user.id,
  }
  const stateB64 = Buffer.from(JSON.stringify(stateData)).toString('base64url')

  const authUrl = new URL('https://threads.net/oauth/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('state', stateNonce)
  authUrl.searchParams.set(
    'scope',
    'threads_basic,threads_content_publish',
  )

  const res = NextResponse.redirect(authUrl.toString())
  res.cookies.set('threads_oauth_state', stateB64, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  })

  return res
}
