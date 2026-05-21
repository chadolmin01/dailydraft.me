import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

// GET /api/env-check
//   - 배포 후 환경변수 설정 누락 진단용. 값은 절대 노출 안 하고 boolean 만.
//   - 로그인된 매니저만 호출 가능 (운영자 외 노출 X)
//   - 키마다 length 도 같이 (4 미만이면 placeholder/오타 의심)

const REQUIRED_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'ANTHROPIC_API_KEY',
] as const

const OPTIONAL_KEYS = [
  'NEXT_PUBLIC_GOOGLE_API_KEY',  // Picker
  'NEXT_PUBLIC_APP_URL',
] as const

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const checkKey = (k: string) => {
    const v = process.env[k]
    return { set: !!v, length: v?.length ?? 0 }
  }

  return NextResponse.json({
    required: Object.fromEntries(REQUIRED_KEYS.map(k => [k, checkKey(k)])),
    optional: Object.fromEntries(OPTIONAL_KEYS.map(k => [k, checkKey(k)])),
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV ?? 'local',
  })
}
