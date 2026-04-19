import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/src/lib/supabase/middleware'
import { signCookie, verifyCookie } from '@/src/lib/cookie-signature'
import { captureEdgeError } from '@/src/lib/posthog/edge'
// NOTE: src/lib/access/manifest.ts 가 단일 진실 소스.
// Phase 2 에서 아래 hiddenRoutes/publicRoutes/protectedPaths 를 manifest 로 교체 예정.
// 지금은 docs/ACCESS_POLICY.md 와 매니페스트가 의도 문서, middleware 는 실제 작동.

// 미들웨어 내부 try/catch 유틸 — 캡처 후 원래 결과로 진행하되, 치명적 실패 시
// fail-closed(403)로 빠져야 하는 블록은 별도로 래핑.
// 여기서는 "실패 시 safe-continue"를 기본으로 하고, 보안 블록에서는 기존 반환값을
// 그대로 쓰도록 상위에서 try/catch를 얹는다.
async function safeEdgeCapture(err: unknown, req: NextRequest, extra?: Record<string, unknown>) {
  try {
    await captureEdgeError(err, {
      route: req.nextUrl.pathname,
      method: req.method,
      ip:
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
      extra,
    })
  } catch {
    // fail-safe
  }
}

// Routes that are hidden in MVP mode (code preserved, UI hidden)
// Remove routes from this array to restore access
//
// 2026-04-18: /dashboard 제거 — IA 리디자인으로 Triage Home이 됐고,
// 로그인 후 기본 랜딩 라우트로 사용. 숨김 유지 시 middleware가 /explore로
// 강제 리다이렉트해서 홈이 죽은 상태가 됨.
const hiddenRoutes = [
  '/calendar',
  '/documents',
  // '/network' 제거 (2026-04-20): IA 재정비 이후 /network 는 사람 탐색 라우트로 활성화.
  //                             GNB 에서는 빠졌지만 라우트 자체는 살아있음.
  '/usage',
  '/workflow',
  '/business-plan',
  '/validated-ideas',
  '/idea-validator',
  '/project/',        // legacy /project/* flows (trailing slash to avoid matching /projects)
]

// API routes hidden in MVP mode — returns 404
// 여기 등록된 라우트는 프로덕션에서 접근 불가 (404).
// 각 route.ts 파일 상단에도 "HIDDEN ROUTE" 주석 표기됨.
// 활성화하려면 여기서 제거 + route.ts 주석 제거.
const hiddenApiRoutes = [
  '/api/ai-chat',
  '/api/dev',
  // '/api/applications' — 지원 관리·pending-count 활성 기능이므로 차단 제외
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
  '/embed/',
  '/feed',
  '/privacy',
  '/terms',
  '/status',
]

function addSecurityHeaders(response: NextResponse, allowEmbed = false) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  // /embed/* 는 외부 iframe 에 의도적 노출되므로 X-Frame-Options 를 설정하지 않음.
  // 나머지 경로는 DENY 유지 (clickjacking 방어).
  if (!allowEmbed) {
    response.headers.set('X-Frame-Options', 'DENY')
  }
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  const isDev = process.env.NODE_ENV === 'development'
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://us-assets.i.posthog.com"
    : "'self' 'unsafe-inline' https://www.googletagmanager.com https://us-assets.i.posthog.com"
  response.headers.set(
    'Content-Security-Policy',
    [
      `default-src 'self'`,
      `script-src ${scriptSrc}`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://source.unsplash.com https://plus.unsplash.com https://picsum.photos https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://k.kakaocdn.net https://phinf.pstatic.net https://ssl.pstatic.net https://www.googletagmanager.com`,
      `worker-src 'self' blob:`,
      `font-src 'self' https://fonts.gstatic.com`,
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://*.aiplatform.googleapis.com https://www.google-analytics.com https://www.googletagmanager.com https://*.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
    ].join('; ')
  )
  return response
}

async function middlewareImpl(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname

  // CSRF 예외: 외부 서비스 webhook (Discord, 결제 등)은 cross-origin POST가 정상
  const csrfExemptPaths = [
    '/api/discord/interactions',
    '/api/webhooks/',
  ]
  const isCsrfExempt = csrfExemptPaths.some(p => pathname.startsWith(p))

  // CSRF protection: block cross-origin state-changing requests to API routes
  if (!isCsrfExempt && pathname.startsWith('/api/') && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
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
    } else if (!origin) {
      // No Origin header — check Referer as fallback (some browsers omit Origin for same-origin requests)
      const referer = request.headers.get('referer')
      if (referer) {
        try {
          const refererHost = new URL(referer).host
          if (refererHost !== host) {
            return NextResponse.json({ error: { code: 'FORBIDDEN', message: '요청이 거부되었습니다' } }, { status: 403 })
          }
          // Referer matches host → same-origin, allow
        } catch {
          return NextResponse.json({ error: { code: 'FORBIDDEN', message: '요청이 거부되었습니다' } }, { status: 403 })
        }
      } else {
        // No Origin AND no Referer → block non-browser requests
        return NextResponse.json({ error: { code: 'FORBIDDEN', message: '요청이 거부되었습니다' } }, { status: 403 })
      }
    }
  }

  // Block hidden API routes — return 404
  if (hiddenApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: '페이지를 찾을 수 없습니다' } }, { status: 404 })
  }

  // /settings → /profile redirect (설정 페이지 미구현, 프로필로 대체)
  if (pathname === '/settings' || pathname.startsWith('/settings/')) {
    return NextResponse.redirect(new URL('/profile', request.url))
  }

  // Block hidden pages — redirect to /explore
  // Match exact path or path with trailing segments (e.g. /project/ matches /project/abc but not /projects)
  if (hiddenRoutes.some(route => pathname === route.replace(/\/$/, '') || pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/explore', request.url))
  }

  // 랜딩페이지(`/`): 로그인 상태면 /dashboard(Triage Home)로 리다이렉트.
  // 2026-04-18: 이전엔 /explore로 갔으나 IA 리디자인으로 /dashboard 가 진짜 홈이 됨.
  if (pathname === '/') {
    const { user } = await updateSession(request)
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return addSecurityHeaders(NextResponse.next({ request }))
  }

  // 퍼블릭 라우트 → Supabase 클라이언트 생성 자체를 스킵, 즉시 반환
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  )
  if (isPublicRoute) {
    const isEmbed = pathname.startsWith('/embed/')
    return addSecurityHeaders(NextResponse.next({ request }), isEmbed)
  }

  // 비-퍼블릭 라우트만 auth 플로우 실행
  const { response, supabase, user } = await updateSession(request)

  // Protected routes - redirect to login if not authenticated
  const protectedPaths = ['/profile', '/projects', '/admin', '/messages', '/notifications', '/onboarding', '/dashboard', '/documents', '/calendar', '/network', '/usage', '/workflow', '/institution']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If logged in and trying to access login page, redirect to dashboard (home)
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
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

    if (verified !== `${user.id}:true`) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single()

      if (!profile || !profile.onboarding_completed) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }

      // 완료된 경우 서명된 쿠키로 캐싱 (24시간, user ID 바인딩)
      if (profile?.onboarding_completed) {
        const signedValue = await signCookie(`${user.id}:true`)
        response.cookies.set('onboarding_completed', signedValue, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24, // 24시간
        })
      }
    }
  }

  return addSecurityHeaders(response)
}

/**
 * 전역 try/catch — 미들웨어 내부 예외가 사용자 응답을 500으로 터뜨리지 않도록.
 * 보안상 민감한 CSRF/hidden/auth 블록은 이미 throw 없이 return으로 처리되므로
 * 이 catch는 updateSession/DB 호출 등 I/O 실패만 잡는다. 실패 시 캡처 후
 * 다음 미들웨어(= 응답 통과)로 넘겨 앱이 완전히 멈추는 것을 방지.
 */
export async function middleware(request: NextRequest) {
  try {
    return await middlewareImpl(request)
  } catch (err) {
    await safeEdgeCapture(err, request)
    // fail-open: 미들웨어 오류가 전체 사이트를 다운시키지 않도록.
    // 보안 분기는 이미 실행된 후이거나 throw 전에 return 되는 구조.
    return NextResponse.next({ request })
  }
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
