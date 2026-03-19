import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/src/lib/supabase/middleware'
import { signCookie, verifyCookie } from '@/src/lib/cookie-signature'

// Routes that are hidden in MVP mode (code preserved, UI hidden)
// Remove routes from this array to restore access
const hiddenRoutes = [
  '/dashboard',
  '/calendar',
  '/documents',
  '/network',
  '/usage',
  '/workflow',
  '/business-plan',
  '/validated-ideas',
  '/idea-validator',
  '/waitlist',
  '/project/',        // legacy /project/* flows (trailing slash to avoid matching /projects)
]

// API routes hidden in MVP mode — returns 404
const hiddenApiRoutes = [
  '/api/ai-chat',
  '/api/dev',
  '/api/applications',
  '/api/boosts',
  '/api/business-plan',
  '/api/event-applications',
  '/api/events',
  '/api/idea-validator',
  // '/api/notifications',  // 알림 기능 활성화됨
  '/api/payments',
  '/api/payment-status',
  '/api/pdf-structure',
  '/api/prd',
  '/api/profile/analyze',
  '/api/profile/extract',
  '/api/profile/activity',
  '/api/profile/insights',
  '/api/startup-ideas',
  '/api/subscriptions',
  '/api/usage',
  '/api/waitlist',
  '/api/webhooks/tosspayments',
  '/api/cron/analyze-startup-ideas',
  '/api/cron/expire-boosts',
  '/api/cron/ingest-crawled-events',
  '/api/cron/process-payment-failures',
  '/api/cron/send-emails',
  '/api/cron/sync-events',
  '/api/cron/sync-external-events',
  '/api/cron/sync-startup-ideas',
  '/api/cron/weekly-digest',
]

// 퍼블릭 라우트 — Supabase auth 완전 스킵
const publicRoutes = [
  '/',
  '/explore',
  '/guide',
  '/auth/',
  '/p/',
]

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  const isDev = process.env.NODE_ENV === 'development'
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com"
    : "'self' 'unsafe-inline' https://www.googletagmanager.com"
  response.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://generativelanguage.googleapis.com; frame-ancestors 'none'`
  )
  return response
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // CSRF protection: block cross-origin state-changing requests to API routes
  if (pathname.startsWith('/api/') && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    // Allow requests with no origin (server-to-server, cron jobs)
    // Block requests where origin doesn't match host
    if (origin && host) {
      const originHost = new URL(origin).host
      if (originHost !== host) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
  }

  // Block hidden API routes — return 404
  if (hiddenApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Block hidden pages — redirect to /explore
  // Match exact path or path with trailing segments (e.g. /project/ matches /project/abc but not /projects)
  if (hiddenRoutes.some(route => pathname === route.replace(/\/$/, '') || pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/explore', request.url))
  }

  // 퍼블릭 라우트 → Supabase 클라이언트 생성 자체를 스킵, 즉시 반환
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  )
  if (isPublicRoute) {
    return addSecurityHeaders(NextResponse.next({ request }))
  }

  // 비-퍼블릭 라우트만 auth 플로우 실행
  const { response, supabase, user } = await updateSession(request)

  // Protected routes - redirect to login if not authenticated
  const protectedPaths = ['/profile', '/projects', '/admin', '/messages', '/notifications', '/onboarding', '/dashboard', '/documents', '/calendar', '/network', '/usage', '/workflow']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If logged in and trying to access login page, redirect to explore
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/explore'
    return NextResponse.redirect(url)
  }

  // Mandatory onboarding: redirect unboarded users to /onboarding
  const onboardingExemptPaths = ['/onboarding', '/auth/', '/api/', '/login', '/dev/', '/guide']
  const needsOnboardingCheck = user && !onboardingExemptPaths.some(p => pathname.startsWith(p)) && pathname !== '/'

  if (needsOnboardingCheck) {
    // Cookie 캐싱: onboarding 완료 후에는 DB 쿼리 스킵
    // HMAC-SHA256 서명으로 쿠키 위조 방지
    const onboardingCookie = request.cookies.get('onboarding_completed')?.value
    const verified = onboardingCookie ? await verifyCookie(onboardingCookie) : null

    if (verified !== 'true') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single()

      if (!profile || !profile.onboarding_completed) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }

      // 완료된 경우 서명된 쿠키로 캐싱 (24시간)
      if (profile?.onboarding_completed) {
        const signedValue = await signCookie('true')
        response.cookies.set('onboarding_completed', signedValue, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24, // 24시간
        })
      }
    }
  }

  return addSecurityHeaders(response)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
