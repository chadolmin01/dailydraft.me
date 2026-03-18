import { createClient } from '@/src/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkViewRateLimit } from '@/src/lib/rate-limit/redis-rate-limiter'

// IP 기반 중복 조회 방지 (메모리 캐시, 15분 TTL)
const recentViews = new Map<string, number>()
const VIEW_COOLDOWN_MS = 15 * 60 * 1000

// 주기적 정리
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamp] of recentViews) {
    if (now - timestamp > VIEW_COOLDOWN_MS) recentViews.delete(key)
  }
}, 5 * 60 * 1000)

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

// Opportunity 조회수 증가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ip = getClientIP(request)

    const rateLimitResponse = await checkViewRateLimit(ip)
    if (rateLimitResponse) return rateLimitResponse

    const viewKey = `${ip}:opp:${id}`

    // 같은 IP에서 15분 내 중복 조회 무시
    const lastView = recentViews.get(viewKey)
    if (lastView && Date.now() - lastView < VIEW_COOLDOWN_MS) {
      return NextResponse.json({ success: true, deduplicated: true })
    }

    const supabase = await createClient()

    // 원자적 조회수 증가
    const { data, error } = await supabase.rpc('increment_view_count', {
      table_name: 'opportunities',
      row_id: id,
    })

    if (error) {
      // RPC가 없으면 fallback: 직접 업데이트
      const { data: currentOpp, error: fetchError } = await supabase
        .from('opportunities')
        .select('views_count')
        .eq('id', id)
        .single()

      if (fetchError) {
        return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
      }

      const newCount = ((currentOpp as { views_count: number | null }).views_count || 0) + 1
      await supabase
        .from('opportunities')
        .update({ views_count: newCount } as never)
        .eq('id', id)

      recentViews.set(viewKey, Date.now())
      return NextResponse.json({ success: true, views_count: newCount })
    }

    recentViews.set(viewKey, Date.now())
    return NextResponse.json({ success: true, views_count: data })
  } catch (_error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
