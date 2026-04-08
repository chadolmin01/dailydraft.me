import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { autoEnrollByEmail } from '@/src/lib/institution/auto-enroll'
import { captureServerError } from '@/src/lib/posthog/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/explore'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/explore'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      await captureServerError(error, { route: 'GET /auth/callback', extra: { step: 'exchangeCodeForSession' } })
    }
    if (!error) {
      // exchangeCodeForSession already returns user — no extra getUser() call needed
      const user = sessionData.user
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle()

        // OAuth 유저는 profile 행이 없을 수 있음 → 생성
        if (!profile) {
          const nickname = user.user_metadata?.full_name
            || user.user_metadata?.name
            || user.email?.split('@')[0]
            || '사용자'
          await supabase.from('profiles').insert({
            user_id: user.id,
            nickname,
            contact_email: user.email || null,
          })
          return NextResponse.redirect(`${origin}/onboarding`)
        }

        if (profile.onboarding_completed) {
          // 이메일 도메인 기반 institution 자동 등록 (진짜 non-blocking — await 하지 않음)
          autoEnrollByEmail(supabase as Parameters<typeof autoEnrollByEmail>[0], user.id, user.email || '').catch(() => {})
          return NextResponse.redirect(`${origin}/explore`)
        } else {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
