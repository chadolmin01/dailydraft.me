/**
 * 체크인 미제출 리마인더 — 매주 금요일 18:00 KST
 *
 * #주간-체크인 포럼에 아직 글을 안 올린 팀장에게 Discord DM 발송.
 * 팀 채널 메시지가 3개 미만인 팀도 리마인드 대상.
 *
 * Vercel Cron: "0 9 * * 5" (금요일 09:00 UTC = 18:00 KST)
 */

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture'
import { sendDirectMessage, sendChannelMessage } from '@/src/lib/discord/client'
import { getISOWeekNumber } from '@/src/lib/ghostwriter/week-utils'

export const runtime = 'nodejs'

export const POST = withCronCapture('checkin-reminder', async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized()
  }

  const admin = createAdminClient()
  const weekNumber = getISOWeekNumber(new Date())

  // 1. 이번 주차에 이미 초안이 생성된 opportunity_id 집합
  const { data: existingDrafts } = await admin
    .from('weekly_update_drafts')
    .select('opportunity_id')
    .eq('week_number', weekNumber)

  const draftedIds = new Set(
    (existingDrafts as { opportunity_id: string }[] | null)?.map((d) => d.opportunity_id) ?? []
  )

  // 2. 모든 매핑된 팀 채널 조회
  const { data: channels } = await admin
    .from('discord_team_channels')
    .select('opportunity_id, discord_channel_name, club_id')

  if (!channels || channels.length === 0) {
    return ApiResponse.ok({ success: true, reminders_sent: 0, message: '매핑된 채널 없음' })
  }

  // 3. 아직 초안이 없는 팀 = 활동 부족 or 체크인 미제출
  const missingTeams = (channels as { opportunity_id: string; discord_channel_name: string; club_id: string }[])
    .filter((ch) => !draftedIds.has(ch.opportunity_id))

  if (missingTeams.length === 0) {
    return ApiResponse.ok({ success: true, reminders_sent: 0, message: '모든 팀 제출 완료' })
  }

  // 4. 미제출 팀의 프로젝트 리더에게 DM 발송 (에스컬레이션 포함)
  const oppIds = missingTeams.map((t) => t.opportunity_id)
  const { data: opportunities } = await admin
    .from('opportunities')
    .select('id, title, creator_id')
    .in('id', oppIds)

  // 연속 미제출 주차 계산 (에스컬레이션 판단용)
  // 직전 2주차에도 draft가 없었는지 확인
  const prevWeeks = [weekNumber - 1, weekNumber - 2].filter((w) => w > 0)
  const { data: prevDrafts } = await admin
    .from('weekly_update_drafts')
    .select('opportunity_id, week_number')
    .in('week_number', prevWeeks)

  const prevDraftSet = new Set(
    (prevDrafts as { opportunity_id: string; week_number: number }[] | null)?.map(
      (d) => `${d.opportunity_id}-${d.week_number}`
    ) ?? []
  )

  // 배치로 creator Discord ID 조회 (N+1 방지)
  const creatorIds = [...new Set(
    (opportunities as { creator_id: string }[] | null)?.map((o) => o.creator_id) ?? []
  )]
  const { data: profiles } = creatorIds.length > 0
    ? await admin
        .from('profiles')
        .select('user_id, discord_user_id')
        .in('user_id', creatorIds)
    : { data: null }
  const discordIdMap = new Map(
    (profiles as { user_id: string; discord_user_id: string | null }[] | null)
      ?.filter((p) => p.discord_user_id)
      .map((p) => [p.user_id, p.discord_user_id!]) ?? []
  )

  let remindersSent = 0
  let dmFailed = 0
  let escalations = 0

  for (const opp of (opportunities as { id: string; title: string; creator_id: string }[] | null) ?? []) {
    // 연속 미제출 주차 수 계산
    let consecutiveMissing = 1 // 이번 주 미제출
    if (!prevDraftSet.has(`${opp.id}-${weekNumber - 1}`)) consecutiveMissing++
    if (!prevDraftSet.has(`${opp.id}-${weekNumber - 2}`)) consecutiveMissing++

    const discordUserId = discordIdMap.get(opp.creator_id)
    if (!discordUserId) continue

    // 에스컬레이션 레벨에 따른 메시지 강도 조절
    let dmMessage: string

    if (consecutiveMissing >= 3) {
      // 3주 연속 미제출 → 강한 경고
      dmMessage = [
        `🚨 **${weekNumber}주차 — 3주 연속 미활동 경고**`,
        '',
        `**${opp.title}** 팀이 3주 연속 활동이 부족합니다.`,
        '',
        '운영진에게도 알림이 전달되었습니다.',
        '팀 활동이 어려운 상황이라면 운영진에게 말씀해주세요.',
        '',
        '📝 **#주간-체크인**에 현재 상황을 공유해주세요.',
      ].join('\n')
      escalations++
    } else if (consecutiveMissing >= 2) {
      // 2주 연속 → 중간 경고 + 운영진 알림
      dmMessage = [
        `⚠️ **${weekNumber}주차 — 2주 연속 미활동**`,
        '',
        `**${opp.title}** 팀이 2주 연속 활동이 부족합니다.`,
        '',
        '📝 **#주간-체크인** 포럼에 이번 주 상황을 공유해주세요.',
        '간단한 한 줄이라도 괜찮습니다.',
      ].join('\n')
      escalations++
    } else {
      // 1주 미제출 → 일반 리마인더
      dmMessage = [
        `⏰ **${weekNumber}주차 체크인 리마인더**`,
        '',
        `**${opp.title}** 팀의 이번 주 활동이 아직 부족합니다.`,
        '',
        '📝 **#주간-체크인** 포럼에 이번 주 상황을 공유해주세요.',
        '일요일에 AI가 주간 업데이트 초안을 생성하려면 Discord 대화가 필요합니다.',
        '',
        '```',
        '✅ 이번 주 할 일:',
        '🔧 진행 중:',
        '🚧 블로커:',
        '```',
      ].join('\n')
    }

    try {
      await sendDirectMessage(discordUserId, dmMessage)
      remindersSent++
    } catch {
      dmFailed++
    }

    // 2주 이상 연속 미제출 시 운영진 채널에도 알림
    if (consecutiveMissing >= 2) {
      const opsDashboardId = process.env.DISCORD_OPS_DASHBOARD_CHANNEL_ID
      if (opsDashboardId) {
        const emoji = consecutiveMissing >= 3 ? '🚨' : '⚠️'
        sendChannelMessage(
          opsDashboardId,
          `${emoji} **${opp.title}** — ${consecutiveMissing}주 연속 미활동`
        ).catch(() => {})
      }
    }
  }

  // 5. 운영-대시보드 채널에도 미제출 요약 게시
  // 클럽별로 묶어서 한 번만 게시
  const clubMissing = new Map<string, string[]>()
  for (const t of missingTeams) {
    const list = clubMissing.get(t.club_id) || []
    list.push(t.discord_channel_name || '알 수 없는 팀')
    clubMissing.set(t.club_id, list)
  }

  // 운영 대시보드 채널에 게시 (환경변수 기반)
  const opsDashboardId = process.env.DISCORD_OPS_DASHBOARD_CHANNEL_ID
  if (opsDashboardId && missingTeams.length > 0) {
    const teamList = missingTeams
      .map((t) => `• ${t.discord_channel_name || '알 수 없는 팀'}`)
      .join('\n')

    await sendChannelMessage(
      opsDashboardId,
      [
        `⏰ **${weekNumber}주차 미제출 팀 알림** (금요일)`,
        '',
        `아직 활동이 부족한 팀 ${missingTeams.length}개:`,
        teamList,
        '',
        '> 일요일 AI 초안 생성까지 Discord 대화가 필요합니다.',
      ].join('\n')
    ).catch(() => {})
  }

  return ApiResponse.ok({
    success: true,
    week_number: weekNumber,
    missing_teams: missingTeams.length,
    reminders_sent: remindersSent,
    dm_failed: dmFailed,
  })
})

export async function GET() {
  return ApiResponse.ok({ status: 'ready', timestamp: new Date().toISOString() })
}

