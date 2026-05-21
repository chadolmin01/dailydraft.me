import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// 클라이언트 signOut() 가 호출하는 정식 경로.
export async function POST(request: NextRequest) {
  return doSignout(request, NextResponse.json({ success: true }))
}

// GET fallback — 주소창에 직접 /api/auth/signout 쳐도 동작하도록.
// 로그아웃 후 / 로 redirect.
export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin
  return doSignout(request, NextResponse.redirect(`${origin}/?signedout=1`))
}

async function doSignout(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.signOut()
  return response
}
