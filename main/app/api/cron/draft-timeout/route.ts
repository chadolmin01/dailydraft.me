/**
 * 초안 승인 타임아웃 — 6시간마다 실행
 *
 * 24시간 이상 pending 상태인 초안을 자동 처리:
 * - status를 'expired'로 변경
 * - project_updates에 "[미승인 초안]" 접두어로 자동 게시
 * - 운영-대시보드에 알림 게시
 *
 * 의도: 팀장이 DM을 놓쳐도 주간 업데이트가 발행되도록.
 * "[미승인 초안]" 태그로 AI 생성임을 명시하여 투명성 유지.
 *
 * Vercel Cron: "0 *\/6 * * *" (6시간마다)
 */

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture'
import { sendChannelMessage } from '@/src/lib/discord/client'

export const runtime = 'nodejs'

export const POST = withCronCapture('draft-timeout', async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized()
  }

  const admin = createAdminClient()

  // 24시간 이상 pending인 초안 조회
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: expiredDrafts } = await admin
    .from('weekly_update_drafts')
    .select('id, opportunity_id, target_user_id, week_number, title, content, update_type, source_message_count')
    .eq('status', 'pending')
    .lt('created_at', cutoff)

  if (!expiredDrafts || expiredDrafts.length === 0) {
    return ApiResponse.ok({ success: true, expired: 0 })
  }

  let published = 0
  let errors = 0

  for (const draft of expiredDrafts as {
    id: string
    opportunity_id: string
    target_user_id: string
    week_number: number
    title: string
    content: string
    update_type: string
    source_message_count: number
  }[]) {
    try {
      // 1. 초안 상태를 expired로 변경
      await admin
        .from('weekly_update_drafts')
        .update({ status: 'expired' } as never)
        .eq('id', draft.id)

      // 2. project_updates에 자동 게시 ("[미승인 초안]" 태그)
      await admin
        .from('project_updates')
        .insert({
          opportunity_id: draft.opportunity_id,
          author_id: draft.target_user_id,
          week_number: draft.week_number,
          title: `[미승인 초안] ${draft.title}`,
          content: draft.content,
          update_type: draft.update_type,
        } as never)

      published++
    } catch (error) {
      console.error('[draft-timeout] 처리 실패', { draftId: draft.id, error })
      errors++
    }
  }

  // 3. 운영-대시보드에 타임아웃 알림
  const opsDashboardId = process.env.DISCORD_OPS_DASHBOARD_CHANNEL_ID
  if (opsDashboardId && published > 0) {
    const titles = (expiredDrafts as { title: string }[])
      .map((d) => `• ${d.title}`)
      .join('\n')

    sendChannelMessage(
      opsDashboardId,
      [
        `⏰ **승인 타임아웃 알림**`,
        '',
        `${published}건의 초안이 24시간 미승인으로 자동 게시되었습니다:`,
        titles,
        '',
        '> "[미승인 초안]" 태그가 붙어 있습니다. 팀장이 나중에 수정할 수 있습니다.',
      ].join('\n')
    ).catch(() => {})
  }

  return ApiResponse.ok({
    success: true,
    expired: expiredDrafts.length,
    published,
    errors,
  })
})

export async function GET() {
  return ApiResponse.ok({ status: 'ready', timestamp: new Date().toISOString() })
}
