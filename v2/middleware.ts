import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/src/lib/supabase/middleware'

// V2 미들웨어 — Supabase 세션 갱신 + 라우트 게이팅 + 보안 헤더.
//
// 게이팅 규칙 (spec 기반):
//   - /workspace/* : 로그인 필요 → / 로 redirect
//   - /            : 로그인되어 있으면 → /workspace 로 redirect (한 번 더 거치지 않게)
//   - /api/auth/*  : 항상 통과 (OAuth 흐름)

// CSP (Content Security Policy) — XSS 방어선.
// V2 가 외부에서 로드하는 것들:
//   - script: Google Picker (apis.google.com) + Next.js 인라인 (unsafe-inline 필요)
//   - style: Pretendard CDN (jsdelivr) + Tailwind 인라인 (unsafe-inline)
//   - font: Google Fonts (gstatic) + Pretendard (jsdelivr)
//   - frame: Picker (accounts.google.com 등)
//   - img: Supabase storage + Google avatars + data:/blob:
//   - connect: Supabase REST/Realtime + Google APIs (Drive/Sheets/Gmail)
//
// Dev 모드에서는 'unsafe-eval' 도 필요 (Next.js HMR).
function buildCsp(isDev: boolean): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      'https://apis.google.com',
    ],
    'style-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://*.supabase.co',
      'https://lh3.googleusercontent.com',
      'https://*.googleusercontent.com',
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://www.googleapis.com',
      'https://oauth2.googleapis.com',
      'https://gmail.googleapis.com',
      'https://sheets.googleapis.com',
      'https://accounts.google.com',
    ],
    'frame-src': [
      "'self'",
      'https://accounts.google.com',
      'https://content.googleapis.com',
      'https://docs.google.com',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  }
  return Object.entries(directives)
    .map(([k, v]) => `${k} ${v.join(' ')}`)
    .join('; ')
}

const IS_DEV = process.env.NODE_ENV === 'development'
const CSP = buildCsp(IS_DEV)

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Content-Security-Policy', CSP)
  return response
}

const STATE_CHANGING_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // CSRF 보호 — /api/* 의 상태 변경 요청은 same-origin 만 허용.
  // V2 는 외부 webhook 없음. OAuth 콜백은 GET 이라 적용 안 됨.
  if (pathname.startsWith('/api/') && STATE_CHANGING_METHODS.includes(request.method)) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    if (origin && host) {
      try {
        const originHost = new URL(origin).host
        if (originHost !== host) {
          return NextResponse.json(
            { error: { code: 'FORBIDDEN', message: '요청이 거부되었습니다' } },
            { status: 403 },
          )
        }
      } catch {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: '요청이 거부되었습니다' } },
          { status: 403 },
        )
      }
    } else if (!origin) {
      // Origin 없으면 Referer 폴백 검사 (일부 브라우저가 same-origin 시 Origin 생략)
      const referer = request.headers.get('referer')
      if (referer) {
        try {
          const refererHost = new URL(referer).host
          if (refererHost !== host) {
            return NextResponse.json(
              { error: { code: 'FORBIDDEN', message: '요청이 거부되었습니다' } },
              { status: 403 },
            )
          }
        } catch {
          return NextResponse.json(
            { error: { code: 'FORBIDDEN', message: '요청이 거부되었습니다' } },
            { status: 403 },
          )
        }
      } else {
        // Origin / Referer 둘 다 없음 → 비브라우저 요청 → 차단
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: '요청이 거부되었습니다' } },
          { status: 403 },
        )
      }
    }
  }

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
