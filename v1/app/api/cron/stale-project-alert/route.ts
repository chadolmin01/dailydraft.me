/**
 * Stale Project Alert — 매주 월요일 09:00 KST
 *
 * 프로젝트가 14일 넘게 업데이트가 없으면 creator 에게 알림.
 * Draft 의 핵심 약속 "주간 기록 누적"이 실제로 작동하도록 하는 retention hook.
 *
 * Vercel Cron: "0 0 * * 1" (월요일 00:00 UTC = 09:00 KST)
 */

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture'
import { createNotification } from '@/src/lib/notifications/create-notification'

export const runtime = 'nodejs'

const STALE_THRESHOLD_DAYS = 14

export const POST = withCronCapture('stale-project-alert', async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized()
  }

  const admin = createAdminClient()
  const staleCutoff = new Date(Date.now() - STALE_THRESHOLD_DAYS * 86_400_000).toISOString()

  // 1. 활성 프로젝트 목록
  const { data: opps, error: oppErr } = await admin
    .from('opportunities')
    .select('id, title, creator_id, created_at, club_id')
    .eq('status', 'active')
    .lt('created_at', staleCutoff) // 생성된 지 14일 넘은 것만 — 갓 만든 프로젝트는 제외

  if (oppErr) {
    console.error('[stale-project-alert] opps query failed:', oppErr)
    return ApiResponse.internalError(oppErr.message)
  }
  if (!opps || opps.length === 0) {
    return ApiResponse.ok({ checked: 0, alerted: 0 })
  }

  // 2. 각 프로젝트의 최근 업데이트 시각 batch 조회
  const oppIds = opps.map(o => o.id)
  const { data: updates } = await admin
    .from('project_updates')
    .select('opportunity_id, created_at')
    .in('opportunity_id', oppIds)
    .order('created_at', { ascending: false })

  // opp_id → 가장 최근 update created_at
  const latestUpdate: Record<string, string> = {}
  for (const u of updates ?? []) {
    const oppId = u.opportunity_id as string
    if (!latestUpdate[oppId]) {
      latestUpdate[oppId] = u.created_at as string
    }
  }

  // 3. stale 판정 + 최근 14일 내 이미 alert 보낸 적 있나 중복 방지
  // notification_type = 'project_update' (reuse existing type), metadata.kind = 'stale-alert'
  const { data: recentAlerts } = await admin
    .from('event_notifications')
    .select('user_id, metadata, created_at')
    .eq('notification_type', 'project_update')
    .gte('created_at', staleCutoff)

  const alertedRecently = new Set<string>()
  for (const a of recentAlerts ?? []) {
    const meta = a.metadata as Record<string, string> | null
    if (meta?.kind === 'stale-alert' && meta?.opportunity_id) {
      alertedRecently.add(`${a.user_id}:${meta.opportunity_id}`)
    }
  }

  let alertedCount = 0
  for (const opp of opps) {
    const lastUpdateIso = latestUpdate[opp.id] ?? opp.created_at
    const daysSince = Math.floor((Date.now() - new Date(lastUpdateIso).getTime()) / 86_400_000)
    if (daysSince < STALE_THRESHOLD_DAYS) continue
    if (!opp.creator_id) continue

    const dedupeKey = `${opp.creator_id}:${opp.id}`
    if (alertedRecently.has(dedupeKey)) continue

    // 알림 발송 — createNotification 이 push + in-app 둘 다 fire
    await createNotification({
      userId: opp.creator_id,
      type: 'project_update',
      title: '프로젝트 업데이트가 밀렸어요',
      message: `"${opp.title}" 가 ${daysSince}일째 업데이트가 없습니다. 이번 주 활동을 간단히 기록해 주세요.`,
      link: `/projects/${opp.id}`,
      metadata: {
        kind: 'stale-alert',
        opportunity_id: opp.id,
        days_since: String(daysSince),
      },
    })
    alertedCount += 1
  }

  return ApiResponse.ok({
    checked: opps.length,
    alerted: alertedCount,
    threshold_days: STALE_THRESHOLD_DAYS,
  })
})
