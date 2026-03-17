import { createClient } from '@/src/lib/supabase/server'
import { NextResponse } from 'next/server'

// 캐시: 10분 유지
let cache: { tags: { tag: string; count: number }[]; at: number } | null = null
const CACHE_TTL = 10 * 60 * 1000

export async function GET() {
  try {
    // 캐시 히트
    if (cache && Date.now() - cache.at < CACHE_TTL) {
      return NextResponse.json({ tags: cache.tags })
    }

    const supabase = await createClient()

    // 활성 프로젝트의 interest_tags 집계
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('interest_tags')
      .eq('status', 'active')
      .limit(200)

    if (error) throw error

    const tagCounts: Record<string, number> = {}

    for (const opp of opportunities || []) {
      const tags = (opp as { interest_tags: string[] | null }).interest_tags
      if (!tags) continue
      for (const tag of tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      }
    }

    const sorted = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }))

    // 캐시 저장
    cache = { tags: sorted, at: Date.now() }

    return NextResponse.json({ tags: sorted })
  } catch {
    return NextResponse.json({ tags: [] })
  }
}
