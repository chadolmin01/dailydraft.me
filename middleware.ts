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
    [
      `default-src 'self'`,
      `script-src ${scriptSrc}`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://source.unsplash.com https://plus.unsplash.com https://picsum.photos https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://k.kakaocdn.net https://phinf.pstatic.net https://ssl.pstatic.net https://www.googletagmanager.com`,
      `worker-src 'self' blob:`,
      `font-src 'self' https://fonts.gstatic.com`,
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://*.aiplatform.googleapis.com https://www.google-analytics.com https://www.googletagmanager.com`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
    ].join('; ')
  )
  return response
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // CSRF protection: block cross-origin state-changing requests to API routes
  if (pathname.startsWith('/api/') && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')

    if (origin && host) {
      // Cross-origin check: block if origin doesn't match host
      const originHost = new URL(origin).host
      if (originHost !== host) {
        return NextResponse.json({ error: { code: 'FORBIDDEN', message: '요청이 거부되었습니다' } }, { status: 403 })
      }
    } else if (!origin && pathname.startsWith('/api/cron/')) {
      // Cron routes without origin header must provide CRON_SECRET
      const authHeader = request.headers.get('authorization')
      const cronSecret = process.env.CRON_SECRET
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: { code: 'FORBIDDEN', message: '인증이 필요합니다' } }, { status: 403 })
      }
    }
  }

  // Block hidden API routes — return 404
  if (hiddenApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: '페이지를 찾을 수 없습니다' } }, { status: 404 })
  }

  // /settings → /profile/edit redirect (설정 페이지 미구현, 프로필 편집으로 대체)
  if (pathname === '/settings' || pathname.startsWith('/settings/')) {
    return NextResponse.redirect(new URL('/profile/edit', request.url))
  }

  // Block hidden pages — redirect to /explore
  // Match exact path or path with trailing segments (e.g. /project/ matches /project/abc but not /projects)
  if (hiddenRoutes.some(route => pathname === route.replace(/\/$/, '') || pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/explore', request.url))
  }

  // 랜딩페이지(`/`): 로그인 상태면 /explore로 리다이렉트
  if (pathname === '/') {
    const { user } = await updateSession(request)
    if (user) {
      return NextResponse.redirect(new URL('/explore', request.url))
    }
    return addSecurityHeaders(NextResponse.next({ request }))
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
