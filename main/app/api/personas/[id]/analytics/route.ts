import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/**
 * GET /api/personas/:id/analytics
 *
 * 성과 대시보드용 집계.
 *
 * 현재는 외부 플랫폼 실측 지표(노출·좋아요) 수집 파이프가 없어서
 * DB에서 뽑을 수 있는 "발행 활동" 지표만 제공.
 *   - 총 발행 수
 *   - 채널별 분포
 *   - 시간대·요일 히트맵 (언제 많이 발행했는지)
 *   - 최근 발행 리스트
 *
 * 외부 지표(노출·반응)는 R3.4+에서 LinkedIn Analytics API / Discord 반응 수집 연동 후 추가.
 */
export const GET = withErrorCapture(async (request, context) => {
  const { id: personaId } = (await context.params) as { id: string }
  const { searchParams } = new URL(request.url)
  const days = Math.min(Number(searchParams.get('days')) || 30, 180)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: canView } = await (admin as any).rpc('can_view_persona', {
    p_persona_id: personaId,
    p_user_id: user.id,
  })
  if (!canView) return ApiResponse.forbidden('권한이 없습니다')

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  // 발행된 outputs 로드
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: published } = await (admin.from('persona_outputs') as any)
    .select(
      'id, channel_format, published_at, destination, bundle_id, generated_content',
    )
    .eq('persona_id', personaId)
    .eq('status', 'published')
    .gte('published_at', since)
    .order('published_at', { ascending: false })
    .limit(500)

  type Row = {
    id: string
    channel_format: string
    published_at: string
    destination: string | null
    bundle_id: string | null
    generated_content: string
  }

  const rows = (published ?? []) as Row[]

  // 채널별 분포
  const byChannel: Record<string, number> = {}
  for (const r of rows) {
    byChannel[r.channel_format] = (byChannel[r.channel_format] ?? 0) + 1
  }

  // 시간대·요일 히트맵 (KST 기준)
  const hourHist = Array.from({ length: 24 }, () => 0)
  const weekdayHist = Array.from({ length: 7 }, () => 0) // 월=0 ... 일=6
  for (const r of rows) {
    const d = new Date(r.published_at)
    // KST offset
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
    hourHist[kst.getUTCHours()]++
    const wd = (kst.getUTCDay() + 6) % 7
    weekdayHist[wd]++
  }

  // 일별 타임라인 (최근 30일, 기본값)
  const dayMap = new Map<string, number>()
  for (const r of rows) {
    const d = new Date(r.published_at)
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
    const key = kst.toISOString().slice(0, 10) // YYYY-MM-DD KST
    dayMap.set(key, (dayMap.get(key) ?? 0) + 1)
  }

  // 최근 5개 발행
  const recent = rows.slice(0, 5).map((r) => ({
    id: r.id,
    bundle_id: r.bundle_id,
    channel_format: r.channel_format,
    published_at: r.published_at,
    destination: r.destination,
    content_preview: r.generated_content.slice(0, 120),
  }))

  return ApiResponse.ok({
    summary: {
      total_published: rows.length,
      by_channel: byChannel,
      period_days: days,
    },
    hour_hist: hourHist,
    weekday_hist: weekdayHist,
    daily: Array.from(dayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    recent,
  })
})
