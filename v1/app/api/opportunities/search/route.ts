import { NextRequest } from 'next/server'
import { createClient as createAnonClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const revalidate = 30

/**
 * GET /api/opportunities/search?q=<string>&limit=<n>
 *
 * 공개 프로젝트 간단 검색 — CommandPalette(Cmd+K)·추후 전역 검색 UI 에서 사용.
 * RLS·visibility 공개 조건에서만 결과 반환. 로그인 불필요.
 *
 * ilike '%q%' on title/description. 정렬: created_at desc.
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
    .from('opportunities')
    .select('id, title, description, status, type, created_at')
    .eq('status', 'active')
    .or(`title.ilike.${pattern},description.ilike.${pattern}`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return Response.json({ items: [], error: error.message }, { status: 200 })
  }

  return Response.json({ items: data ?? [] }, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
  })
}
