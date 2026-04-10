/**
 * Ghostwriter Cron: 매주 일요일 저녁 실행
 *
 * 흐름:
 * 1. discord_team_channels에서 매핑된 모든 채널 조회
 * 2. 각 채널의 1주일치 Discord 메시지 fetch
 * 3. AI로 주간 업데이트 초안 생성
 * 4. weekly_update_drafts에 저장
 * 5. 대상 팀원(프로젝트 리더)에게 Discord DM으로 승인 요청
 *
 * 메시지 부족 팀은 리마인드 웹훅 발송 (이미 구현된 send-club-webhook 활용)
 */

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture'
import { fetchChannelMessages, fetchPinnedMessages } from '@/src/lib/discord/client'
import { generateWeeklyDraft, type HarnessContext } from '@/src/lib/discord/ghostwriter'
import { sendClubUpdateRemindWebhook } from '@/src/lib/webhooks/send-club-webhook'
import { postDashboardSummary } from '@/src/lib/discord/dashboard-summary'
import { notifyDraftReady } from './notify'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5분 (팀이 많을 경우 대비)

export const POST = withCronCapture('ghostwriter-generate', async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized()
  }

  const admin = createAdminClient()

  // 1. 매핑된 모든 Discord 채널 조회
  const { data: channels, error: channelsError } = await admin
    .from('discord_team_channels')
    .select(`
      id,
      club_id,
      opportunity_id,
      discord_channel_id,
      discord_channel_name,
      last_fetched_message_id
    `)

  if (channelsError || !channels || channels.length === 0) {
    return ApiResponse.ok({
      success: true,
      message: '매핑된 Discord 채널이 없습니다',
      processed: 0,
    })
  }

  // 현재 주차 계산 (연도 기반 ISO week)
  const now = new Date()
  const weekNumber = getISOWeekNumber(now)

  const results = {
    processed: 0,
    draftsCreated: 0,
    remindsSent: 0,
    errors: 0,
  }

  // 클럽별로 그룹핑 (리마인드 발송 시 묶어서)
  const clubChannels = new Map<string, typeof channels>()
  for (const ch of channels) {
    const list = clubChannels.get(ch.club_id) || []
    list.push(ch)
    clubChannels.set(ch.club_id, list)
  }

  for (const [clubId, clubChs] of clubChannels) {
    const lowActivityTeams: string[] = []
    // 운영-대시보드 요약용 데이터 수집
    const dashboardDrafts: {
      opportunityId: string
      projectTitle: string
      status: 'pending' | 'approved' | 'rejected' | 'expired'
      teamStatus: string
      teamStatusReason: string
      sourceMessageCount: number
    }[] = []

    for (const ch of clubChs) {
      results.processed++

      try {
        // 2. Discord 메시지 fetch
        const messages = await fetchChannelMessages(ch.discord_channel_id, {
          after: ch.last_fetched_message_id || undefined,
          maxMessages: 500,
        })

        // last_fetched_message_id 갱신
        if (messages.length > 0) {
          const lastId = messages[messages.length - 1].id
          await admin
            .from('discord_team_channels')
            .update({ last_fetched_message_id: lastId })
            .eq('id', ch.id)
        }

        // 프로젝트 정보 조회
        const { data: opportunity } = await admin
          .from('opportunities')
          .select('title, creator_id')
          .eq('id', ch.opportunity_id)
          .single()

        const projectTitle = opportunity?.title ?? '프로젝트'
        const creatorId = opportunity?.creator_id

        // 2-b. 하네스 데이터 수집: 핀 메시지 (중요 결정사항)
        const harness: HarnessContext = {
          channelName: ch.discord_channel_name ?? undefined,
        }
        try {
          harness.pinnedMessages = await fetchPinnedMessages(ch.discord_channel_id)
        } catch {
          // 핀 조회 실패해도 초안 생성은 계속 진행
        }

        // 2-c. 같은 클럽의 주간-체크인 포럼 메시지 (있으면)
        // discord_team_channels에 checkin_channel_id가 있으면 해당 채널에서 체크인 수집
        // → 현재는 같은 채널에 체크인 양식이 올라온 경우만 파싱 (향후 포럼 스레드 연동)

        // 3. AI 초안 생성 (하네스 컨텍스트 포함)
        const draft = await generateWeeklyDraft(messages, projectTitle, harness)

        if (!draft) {
          // 메시지 부족 → 리마인드 대상
          lowActivityTeams.push(ch.discord_channel_name || projectTitle)
          continue
        }

        if (!creatorId) continue

        // 4. DB 저장
        const { data: savedDraft, error: insertError } = await admin
          .from('weekly_update_drafts')
          .insert({
            opportunity_id: ch.opportunity_id,
            target_user_id: creatorId,
            week_number: weekNumber,
            title: draft.title,
            content: draft.content,
            update_type: draft.updateType,
            source_message_count: draft.sourceMessageCount,
            status: 'pending',
          })
          .select('id')
          .single()

        if (insertError) {
          // 이미 같은 주차 초안이 있으면 무시 (중복 실행 방지)
          if (insertError.code === '23505') continue
          throw insertError
        }

        results.draftsCreated++

        // 대시보드 요약 데이터 수집
        try {
          const parsed = JSON.parse(draft.content) as { teamStatus?: string; teamStatusReason?: string }
          dashboardDrafts.push({
            opportunityId: ch.opportunity_id,
            projectTitle,
            status: 'pending',
            teamStatus: parsed.teamStatus || 'normal',
            teamStatusReason: parsed.teamStatusReason || '',
            sourceMessageCount: draft.sourceMessageCount,
          })
        } catch {
          dashboardDrafts.push({
            opportunityId: ch.opportunity_id,
            projectTitle,
            status: 'pending',
            teamStatus: 'normal',
            teamStatusReason: '',
            sourceMessageCount: draft.sourceMessageCount,
          })
        }

        // 5. Discord DM으로 승인 요청 (fire-and-forget)
        if (savedDraft) {
          notifyDraftReady({
            draftId: savedDraft.id,
            projectTitle,
            title: draft.title,
            content: draft.content,
            updateType: draft.updateType,
            weekNumber,
            creatorId,
          }).catch((err) => console.error('[ghostwriter] DM 발송 실패', err))
        }
      } catch (error) {
        console.error('[ghostwriter] 채널 처리 실패', {
          channelId: ch.discord_channel_id,
          error,
        })
        results.errors++
      }
    }

    // 활동 부족 팀 리마인드
    if (lowActivityTeams.length > 0) {
      sendClubUpdateRemindWebhook({
        clubId,
        teamNames: lowActivityTeams,
        weekNumber,
      }).catch(() => {})
      results.remindsSent++
    }

    // 6. 활동 통계 + 연속 미제출 데이터 조회
    const activityByTeam = new Map<string, { totalMessages: number; topMembers: { discordUsername: string; messageCount: number; channelsActive: number }[] }>()

    // 팀별 Discord 활동량 (이번 주차 member_activity_stats 기반)
    const { data: activityStats } = await admin
      .from('member_activity_stats')
      .select('discord_username, message_count, channels_active')
      .eq('club_id', clubId)
      .eq('week_number', weekNumber)
      .eq('year', now.getFullYear())

    if (activityStats && activityStats.length > 0) {
      // 클럽 전체를 하나의 그룹으로 집계 (팀별 분리는 향후)
      const totalMessages = activityStats.reduce((sum, s) => sum + s.message_count, 0)
      const topMembers = (activityStats as { discord_username: string | null; message_count: number; channels_active: number }[])
        .filter(s => s.discord_username)
        .sort((a, b) => b.message_count - a.message_count)
        .slice(0, 5)
        .map(s => ({
          discordUsername: s.discord_username || '알 수 없음',
          messageCount: s.message_count,
          channelsActive: s.channels_active,
        }))

      // 각 팀(opportunity)에 전체 통계 연결
      for (const d of dashboardDrafts) {
        activityByTeam.set(d.opportunityId, { totalMessages, topMembers })
      }
    }

    // 연속 미제출 팀 감지 (직전 2주 draft 확인)
    const prevWeeks = [weekNumber - 1, weekNumber - 2].filter(w => w > 0)
    const oppIdsInClub = clubChs.map(ch => ch.opportunity_id)
    const consecutiveMissing: { projectTitle: string; weeks: number }[] = []

    if (prevWeeks.length > 0 && oppIdsInClub.length > 0) {
      const { data: prevDrafts } = await admin
        .from('weekly_update_drafts')
        .select('opportunity_id, week_number')
        .in('opportunity_id', oppIdsInClub)
        .in('week_number', prevWeeks)

      const prevDraftSet = new Set(
        (prevDrafts || []).map(d => `${d.opportunity_id}-${d.week_number}`)
      )
      const currentDraftIds = new Set(dashboardDrafts.map(d => d.opportunityId))

      for (const ch of clubChs) {
        if (currentDraftIds.has(ch.opportunity_id)) continue // 이번 주 제출 → 스킵

        let weeks = 1
        if (!prevDraftSet.has(`${ch.opportunity_id}-${weekNumber - 1}`)) weeks++
        if (!prevDraftSet.has(`${ch.opportunity_id}-${weekNumber - 2}`)) weeks++

        if (weeks >= 2) {
          const title = ch.discord_channel_name || '알 수 없는 팀'
          consecutiveMissing.push({ projectTitle: title, weeks })
        }
      }
    }

    // 클럽 slug 조회 (보고서 링크용)
    const { data: clubData } = await admin
      .from('clubs')
      .select('slug')
      .eq('id', clubId)
      .maybeSingle()

    // 7. 운영-대시보드에 주간 요약 게시 (fire-and-forget)
    postDashboardSummary(clubId, weekNumber, {
      totalTeams: clubChs.length,
      draftsCreated: dashboardDrafts.length,
      lowActivityTeams,
      drafts: dashboardDrafts,
      activityByTeam,
      consecutiveMissing: consecutiveMissing.length > 0 ? consecutiveMissing : undefined,
      clubSlug: (clubData as { slug?: string } | null)?.slug || undefined,
    }).catch((err) => console.error('[ghostwriter] 대시보드 요약 게시 실패', err))
  }

  return ApiResponse.ok({
    success: true,
    timestamp: new Date().toISOString(),
    ...results,
  })
})

export async function GET() {
  return ApiResponse.ok({ status: 'ready', timestamp: new Date().toISOString() })
}

/** ISO 주차 번호 계산 */
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
