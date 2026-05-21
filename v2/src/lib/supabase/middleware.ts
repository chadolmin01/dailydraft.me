import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          } catch {
            // Server Component에서 호출된 경우 무시 (middleware 전용)
          }
        },
      },
    }
  )

  // getSession()은 로컬 JWT 검증만 하므로 빠름 (네트워크 호출 없음)
  // getUser()는 Supabase 서버에 매번 요청 → 미들웨어에서 병목
  // 미들웨어는 라우팅 판단용이므로 session으로 충분, 실제 인증은 API/서버 컴포넌트에서 getUser() 사용
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  return { response, supabase, user }
}
