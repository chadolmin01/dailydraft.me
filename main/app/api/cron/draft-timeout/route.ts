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
import { sendChannelMessage, sendDirectMessage } from '@/src/lib/discord/client'

export const runtime = 'nodejs'

export const POST = withCronCapture('draft-timeout', async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized()
  }

  const admin = createAdminClient()

  // pending 상태인 초안 조회 (클럽별 timeout_hours가 다를 수 있으므로 전체 조회 후 필터)
  const { data: pendingDrafts } = await admin
    .from('weekly_update_drafts')
    .select('id, opportunity_id, target_user_id, week_number, title, content, update_type, source_message_count, created_at')
    .eq('status', 'pending')

  if (!pendingDrafts || pendingDrafts.length === 0) {
    return ApiResponse.ok({ success: true, expired: 0 })
  }

  // 클럽별 timeout_hours 조회 (opportunity → club 매핑 필요)
  const oppIds = [...new Set(pendingDrafts.map(d => d.opportunity_id))]
  const { data: teamChannels } = await admin
    .from('discord_team_channels')
    .select('club_id, opportunity_id')
    .in('opportunity_id', oppIds)

  const oppToClub = new Map<string, string>()
  for (const tc of (teamChannels || [])) {
    oppToClub.set(tc.opportunity_id, tc.club_id)
  }

  const clubIds = [...new Set(oppToClub.values())]
  const { data: allSettings } = await admin
    .from('club_ghostwriter_settings')
    .select('club_id, timeout_hours')
    .in('club_id', clubIds)

  const clubTimeout = new Map<string, number>()
  for (const s of (allSettings || [])) {
    clubTimeout.set(s.club_id, s.timeout_hours)
  }

  // 클럽별 timeout_hours에 따라 만료 여부 판단
  const now = Date.now()
  const expiredDrafts = pendingDrafts.filter(draft => {
    const clubId = oppToClub.get(draft.opportunity_id)
    const hours = clubId ? (clubTimeout.get(clubId) ?? 24) : 24
    const cutoff = now - hours * 60 * 60 * 1000
    return new Date(draft.created_at).getTime() < cutoff
  })

  if (expiredDrafts.length === 0) {
    return ApiResponse.ok({ success: true, expired: 0 })
  }

  let published = 0
  let errors = 0

  for (const draft of expiredDrafts) {
    try {
      // 1. 초안 상태를 expired로 변경
      await admin
        .from('weekly_update_drafts')
        .update({ status: 'expired' })
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
        })

      published++

      // 3. 팀장에게 DM 알림 — 자동 게시됐음을 알려줌
      try {
        const { data: profile } = await admin
          .from('profiles')
          .select('discord_user_id')
          .eq('user_id', draft.target_user_id)
          .single()
        const discordUserId = profile?.discord_user_id
        if (discordUserId) {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://draft.is'
          await sendDirectMessage(
            discordUserId,
            [
              `⏰ **${draft.week_number}주차 초안이 자동 게시되었습니다**`,
              '',
              `24시간 동안 확인되지 않아 "[미승인 초안]" 태그로 자동 게시되었습니다.`,
              `내용을 수정하려면 아래 링크에서 편집하세요.`,
              '',
              `${baseUrl}/drafts/${draft.id}`,
            ].join('\n')
          )
        }
      } catch (err) {
        console.warn('[draft-timeout] 타임아웃 DM 발송 실패', err)
      }
    } catch (error) {
      console.error('[draft-timeout] 처리 실패', { draftId: draft.id, error })
      errors++
    }
  }

  // 3. 운영-대시보드에 타임아웃 알림
  const opsDashboardId = process.env.DISCORD_OPS_DASHBOARD_CHANNEL_ID
  if (opsDashboardId && published > 0) {
    const titles = expiredDrafts
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
