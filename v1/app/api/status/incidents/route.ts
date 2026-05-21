import { NextRequest } from 'next/server'
import { createClient as createAnonClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const revalidate = 60  // 1분 ISR

/**
 * GET /api/status/incidents?since=<iso>&limit=<n>
 *
 * 공개 인시던트 이력. 로그인 불필요. 최근 30일 기본.
 * /status 페이지 + 외부 모니터링 통합에 쓰임.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const since = searchParams.get('since') ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)

  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // generated types 에 status_incidents 반영 전까지 cast.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('status_incidents')
    .select('id, title, severity, status, started_at, resolved_at, affected_components, summary, timeline')
    .gte('started_at', since)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({
    incidents: data ?? [],
    since,
    fetched_at: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
