import { NextResponse } from 'next/server'
import { buildAuthUrl } from '@/src/lib/google/oauth'

// Google OAuth 시작 — state 쿠키 발급 후 Google 동의 화면으로 redirect.
// state 는 CSRF 방어: callback 에서 쿠키와 대조해 일치하지 않으면 거부.
// NOTE: cookies() API 대신 response.cookies.set 사용 — Route Handler 에서 양쪽 모두
// 동작해야 하지만 sameSite=lax 의 redirect 시나리오에서 response 에 직접 다는 게 안정적.
export async function GET() {
  const state = crypto.randomUUID()
  const response = NextResponse.redirect(buildAuthUrl(state))

  response.cookies.set('google_oauth_state', state, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 분
  })

  return response
}
