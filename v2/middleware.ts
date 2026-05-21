import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/src/lib/supabase/middleware'

// V2 미들웨어 — Supabase 세션 갱신 + 라우트 게이팅 + 보안 헤더.
//
// 게이팅 규칙 (spec 기반):
//   - /workspace/* : 로그인 필요 → / 로 redirect
//   - /            : 로그인되어 있으면 → /workspace 로 redirect (한 번 더 거치지 않게)
//   - /api/auth/*  : 항상 통과 (OAuth 흐름)

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return response
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // /api/auth/* 는 OAuth 콜백 + 세션 발급 경로라 게이팅 스킵 (세션 쿠키만 갱신)
  if (pathname.startsWith('/api/auth/')) {
    try {
      const { response } = await updateSession(request)
      return addSecurityHeaders(response)
    } catch {
      return addSecurityHeaders(NextResponse.next({ request }))
    }
  }

  try {
    const { response, user } = await updateSession(request)

    // 로그인 필요 라우트
    if (pathname.startsWith('/workspace') && !user) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // 로그인 상태에서 랜딩 진입 → 워크스페이스로
    if (pathname === '/' && user) {
      return NextResponse.redirect(new URL('/workspace', request.url))
    }

    return addSecurityHeaders(response)
  } catch {
    return addSecurityHeaders(NextResponse.next({ request }))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
