import { NextRequest } from 'next/server'
import { createClient as createAnonClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const revalidate = 30

/**
 * GET /api/profiles/public?q=<string>&limit=<n>
 *
 * 공개 프로필 간단 검색 — CommandPalette·추후 전역 검색 UI 에서 사용.
 * profile_visibility='public' 만 반환. 로그인 불필요.
 *
 * 정렬: updated_at desc.
 * limit 기본 10, 최대 20.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 20)

  if (q.length < 2) return Response.json({ items: [] })

  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const pattern = `%${q.replace(/[%_]/g, '\\$&')}%`

  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, desired_position, university, avatar_url, updated_at')
    .eq('profile_visibility', 'public')
    .or(`nickname.ilike.${pattern},desired_position.ilike.${pattern},university.ilike.${pattern}`)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    return Response.json({ items: [], error: error.message }, { status: 200 })
  }

  return Response.json({ items: data ?? [] }, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
  })
}
