import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that are hidden in MVP mode (code preserved, UI hidden)
// Remove routes from this array to restore access
const hiddenRoutes = [
  '/dashboard',
  '/calendar',
  '/messages',
  '/documents',
  '/network',
  '/usage',
  '/workflow',
  '/business-plan',
  '/validated-ideas',
  '/idea-validator',
  '/onboarding',
  '/guide',
  '/waitlist',
  '/project/',        // legacy /project/* flows (trailing slash to avoid matching /projects)
]

// API routes hidden in MVP mode — returns 404
const hiddenApiRoutes = [
  '/api/ai-chat',
  '/api/applications',
  '/api/boosts',
  '/api/business-plan',
  '/api/event-applications',
  '/api/events',
  '/api/idea-validator',
  '/api/notifications',
  '/api/onboarding',
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
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes - redirect to login if not authenticated
  // Only active routes that require auth
  const protectedPaths = ['/profile', '/explore', '/projects', '/admin']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If logged in and trying to access login page, redirect to explore
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/explore'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
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
