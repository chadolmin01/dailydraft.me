import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { exchangeCodeForTokens } from '@/src/lib/google/oauth'
import { createAdminClient } from '@/src/lib/supabase/admin'

// Google OAuth 콜백.
//   1. state 검증 (CSRF)
//   2. code → tokens 교환
//   3. id_token 으로 Supabase signInWithIdToken (세션 발급)
//   4. refresh_token + access_token 을 google_tokens 에 upsert (service_role 로 RLS 우회)
//   5. /workspace 로 redirect
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error)}`)
  }
  if (!code || !state) {
    return NextResponse.redirect(`${origin}/?error=missing_code_or_state`)
  }

  const cookieStore = await cookies()
  const stateCookie = cookieStore.get('google_oauth_state')?.value
  if (!stateCookie || stateCookie !== state) {
    return NextResponse.redirect(`${origin}/?error=state_mismatch`)
  }
  cookieStore.delete('google_oauth_state')

  // 1) Code → tokens
  let tokens
  try {
    tokens = await exchangeCodeForTokens(code)
  } catch (e) {
    console.error('[google callback] token exchange failed:', e)
    return NextResponse.redirect(`${origin}/?error=token_exchange_failed`)
  }

  if (!tokens.id_token) {
    return NextResponse.redirect(`${origin}/?error=no_id_token`)
  }
  if (!tokens.refresh_token) {
    // prompt=consent 면 항상 와야 함. 없으면 사용자가 Google 계정 권한 페이지에서
    // Draft 권한을 직접 해제 후 다시 시도해야 refresh_token 발급됨.
    return NextResponse.redirect(`${origin}/?error=no_refresh_token`)
  }

  // 2) Supabase 세션 발급 — id_token 으로 signInWithIdToken
  // createServerClient 가 setAll 콜백을 통해 응답 쿠키에 세션을 심는다.
  const response = NextResponse.redirect(`${origin}/workspace`)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: sessionData, error: signInError } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: tokens.id_token,
  })

  if (signInError || !sessionData.user) {
    console.error('[google callback] signInWithIdToken failed:', signInError)
    return NextResponse.redirect(`${origin}/?error=supabase_signin_failed`)
  }

  // 3) google_tokens 에 upsert (service_role 로 RLS 우회)
  const admin = createAdminClient()
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  const { error: tokenUpsertError } = await admin.from('google_tokens').upsert({
    user_id: sessionData.user.id,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
    scope: tokens.scope,
    google_email: sessionData.user.email ?? null,
  })

  if (tokenUpsertError) {
    console.error('[google callback] google_tokens upsert failed:', tokenUpsertError)
    return NextResponse.redirect(`${origin}/?error=token_save_failed`)
  }

  return response
}
