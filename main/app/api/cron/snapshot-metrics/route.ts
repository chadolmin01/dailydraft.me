/**
 * 일별 공개 지표 스냅샷 cron.
 *
 * 매일 자정(KST) 이전 하루의 public metrics 를 daily_metrics_snapshots 에 저장.
 * 랜딩 LiveMetrics 가 "이번 달 +N" 증감 표현에 참조.
 *
 * 실행: 매일 KST 00:05 (UTC 15:05)
 * 수동: POST /api/cron/snapshot-metrics  Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture'

export const runtime = 'nodejs'
export const maxDuration = 60

export const POST = withCronCapture('snapshot-metrics', async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized()
  }

  const admin = createAdminClient()
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  // 오늘 날짜(KST) — UTC+9. Vercel 서버가 UTC 기준이므로 9시간 더해 계산.
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const snapshotDate = kstNow.toISOString().slice(0, 10) // YYYY-MM-DD

  const [clubsRes, oppsRes, profilesRes, updatesRes, universitiesRes] = await Promise.all([
    admin.from('clubs').select('*', { count: 'exact', head: true }).eq('visibility', 'public'),
    admin.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('profile_visibility', 'public'),
    admin.from('project_updates').select('*', { count: 'exact', head: true }).gte('created_at', ninetyDaysAgo),
    admin.from('profiles').select('university').eq('profile_visibility', 'public').not('university', 'is', null).limit(5000),
  ])

  const uniqueUniversities = new Set(
    (universitiesRes.data ?? [])
      .map((p) => (p as { university?: string }).university)
      .filter((u): u is string => typeof u === 'string' && u.length > 0),
  ).size

  const snapshot = {
    snapshot_date: snapshotDate,
    clubs_public: clubsRes.count ?? 0,
    active_opportunities: oppsRes.count ?? 0,
    profiles_public: profilesRes.count ?? 0,
    weekly_updates_90d: updatesRes.count ?? 0,
    public_universities: uniqueUniversities,
  }

  // upsert — 같은 날 여러 번 호출돼도 하루 한 행만 유지
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('daily_metrics_snapshots')
    .upsert(snapshot, { onConflict: 'snapshot_date' })

  if (error) {
    return ApiResponse.internalError('스냅샷 저장 실패', error.message)
  }

  return ApiResponse.ok({
    success: true,
    snapshot_date: snapshotDate,
    metrics: snapshot,
  })
})
