import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/src/lib/supabase/middleware'

// V2 미니멀 미들웨어 — Supabase 세션 갱신 + 보안 헤더만.
// V1 미들웨어의 hidden routes / onboarding 강제 / hidden API 차단 / CSRF 차단 로직은
// V2 가 라우트·플로우를 정한 뒤 다시 가져옴 (v1/middleware.ts 참조).

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return response
}

export async function middleware(request: NextRequest) {
  try {
    const { response } = await updateSession(request)
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
