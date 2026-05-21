import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { buildAuthUrl } from '@/src/lib/google/oauth'

// Google OAuth 시작 — state 쿠키 발급 후 Google 동의 화면으로 redirect.
// state 는 CSRF 방어: callback 에서 쿠키와 대조해 일치하지 않으면 거부.
export async function GET() {
  const state = crypto.randomUUID()
  const cookieStore = await cookies()

  cookieStore.set('google_oauth_state', state, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 분
  })

  return NextResponse.redirect(buildAuthUrl(state))
}
