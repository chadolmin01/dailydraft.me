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
import { fetchChannelMessages, fetchPinnedMessages, fetchForumActiveThreads, fetchGuildChannels, sendDirectMessage, sendChannelMessage } from '@/src/lib/discord/client'
import { generateWeeklyDraft, type HarnessContext } from '@/src/lib/discord/ghostwriter'
import { sendClubUpdateRemindWebhook } from '@/src/lib/webhooks/send-club-webhook'
import { postDashboardSummary } from '@/src/lib/discord/dashboard-summary'
import { getISOWeekNumber, getMondayOfWeek, snowflakeToDate, dateToSnowflake } from '@/src/lib/ghostwriter/week-utils'
import { safeParseContent } from '@/src/lib/ghostwriter/parse-content'
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

  // 배치로 모든 클럽의 설정을 한 번에 조회 (N+1 방지)
  const allClubIds = [...clubChannels.keys()]
  const [{ data: allBotInstalls }, { data: allClubSettings }] = await Promise.all([
    admin
      .from('discord_bot_installations')
      .select('club_id, discord_guild_id')
      .in('club_id', allClubIds),
    admin
      .from('club_ghostwriter_settings')
      .select('club_id, ai_tone, min_messages, custom_prompt_hint, checkin_template')
      .in('club_id', allClubIds),
  ])
  const guildIdMap = new Map(
    (allBotInstalls as { club_id: string; discord_guild_id: string }[] | null)
      ?.map((i) => [i.club_id, i.discord_guild_id]) ?? []
  )
  const settingsMap = new Map(
    (allClubSettings as { club_id: string; ai_tone?: string; min_messages?: number; custom_prompt_hint?: string | null; checkin_template?: string | null }[] | null)
      ?.map((s) => [s.club_id, s]) ?? []
  )

  for (const [clubId, clubChs] of clubChannels) {
    const guildId = guildIdMap.get(clubId)
    const settings = settingsMap.get(clubId) as {
      ai_tone?: string
      min_messages?: number
      custom_prompt_hint?: string | null
      checkin_template?: string | null
    } | undefined ?? null

    // 봇이 아직 서버에 있는지 검증. 강퇴당했으면 이 클럽 스킵.
    // fetchGuildChannels가 403/404를 던지면 봇이 서버에서 제거된 것.
    if (guildId) {
      try {
        await fetchGuildChannels(guildId)
      } catch (err) {
        console.warn(`[ghostwriter] 클럽 ${clubId}: 길드 ${guildId} 접근 불가 (봇 강퇴 추정), 스킵`, err)
        results.errors++
        continue
      }
    } else {
      // guildId 자체가 없으면 봇이 미설치
      continue
    }

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

    // 주간-체크인 포럼 스레드를 클럽 루프 밖에서 1회만 조회
    // 같은 클럽의 모든 팀 채널이 동일한 포럼을 공유하므로 반복 호출은 낭비
    let checkinThreadMessages: Awaited<ReturnType<typeof fetchChannelMessages>> | undefined
    const checkinForumId = process.env.DISCORD_CHECKIN_FORUM_CHANNEL_ID
    if (checkinForumId && guildId) {
      try {
        const threads = await fetchForumActiveThreads(guildId, checkinForumId)
        const mondayOfThisWeek = getMondayOfWeek(now)
        const weekThread = threads.find((t) => {
          if (t.name.includes(`${weekNumber}주차`)) return true
          const threadCreatedAt = snowflakeToDate(t.id)
          return threadCreatedAt >= mondayOfThisWeek
        })
        if (weekThread) {
          checkinThreadMessages = await fetchChannelMessages(weekThread.id, { maxMessages: 100 })
        }
      } catch (err) {
        console.warn('[ghostwriter] 체크인 포럼 수집 실패', err)
      }
    }

    // 배치로 이 클럽의 모든 opportunity 정보를 한 번에 조회 (N+1 방지)
    const clubOppIds = clubChs.map((ch) => ch.opportunity_id)
    const { data: clubOpportunities } = await admin
      .from('opportunities')
      .select('id, title, creator_id')
      .in('id', clubOppIds)
    const oppMap = new Map(
      (clubOpportunities as { id: string; title: string; creator_id: string }[] | null)
        ?.map((o) => [o.id, o]) ?? []
    )

    // 배치로 creator Discord ID 조회 (N+1 방지)
    const creatorIds = [...new Set(
      (clubOpportunities as { creator_id: string }[] | null)
        ?.map((o) => o.creator_id)
        .filter(Boolean) ?? []
    )]
    const { data: creatorProfiles } = creatorIds.length > 0
      ? await admin
          .from('profiles')
          .select('user_id, discord_user_id')
          .in('user_id', creatorIds)
      : { data: null }
    const discordIdMap = new Map(
      (creatorProfiles as { user_id: string; discord_user_id: string | null }[] | null)
        ?.filter((p) => p.discord_user_id)
        .map((p) => [p.user_id, p.discord_user_id!]) ?? []
    )

    for (const ch of clubChs) {
      results.processed++

      try {
        // 2. Discord 메시지 fetch (시간 기반 — 항상 최근 7일치)
        // 커서(last_fetched_message_id) 대신 7일 전 snowflake를 사용.
        // 이유: 커서 기반은 크론이 2번 실행되면 2번째에 "새 메시지 없음"이 되어
        //       draftsCreated=0 false negative가 발생했음. 시간 기반은 항상 1주일치를 가져옴.
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const afterSnowflake = dateToSnowflake(sevenDaysAgo)

        const messages = await fetchChannelMessages(ch.discord_channel_id, {
          after: afterSnowflake,
          maxMessages: 500,
        })

        // MESSAGE_CONTENT intent 검증: 봇에 이 intent가 없으면
        // 메시지 content가 빈 문자열로 옴. 충분한 메시지가 있는데 내용이 전부 비면 경고.
        if (messages.length >= 5) {
          const nonBotMessages = messages.filter(m => !m.author.bot)
          const emptyContentCount = nonBotMessages.filter(m => !m.content?.trim()).length
          if (nonBotMessages.length > 0 && emptyContentCount === nonBotMessages.length) {
            console.error(
              `[ghostwriter] 클럽 ${clubId} 채널 ${ch.discord_channel_name}: ` +
              `${nonBotMessages.length}개 메시지 모두 content가 비어있음. ` +
              `MESSAGE_CONTENT intent가 비활성화되어 있을 수 있습니다.`
            )
          }
        }

        // last_fetched_message_id는 여전히 갱신 (activity-tracker와 호환 유지)
        if (messages.length > 0) {
          const lastId = messages[messages.length - 1].id
          await admin
            .from('discord_team_channels')
            .update({ last_fetched_message_id: lastId })
            .eq('id', ch.id)
        }

        // 프로젝트 정보 (배치 조회 결과에서 가져옴)
        const opportunity = oppMap.get(ch.opportunity_id)
        const projectTitle = opportunity?.title ?? '프로젝트'
        const creatorId = opportunity?.creator_id

        // 2-b. 하네스 데이터 수집 (동아리장 설정 포함)
        const harness: HarnessContext = {
          channelName: ch.discord_channel_name ?? undefined,
          settings: settings ? {
            ai_tone: settings.ai_tone as 'formal' | 'casual' | 'english' | undefined,
            min_messages: settings.min_messages,
            custom_prompt_hint: settings.custom_prompt_hint,
          } : undefined,
        }

        // 이전 초안 피드백 조회 (최근 4주, 피드백이 있는 것만)
        // → AI가 반복 실수를 피하도록 프롬프트에 주입
        try {
          const { data: prevFeedback } = await admin
            .from('weekly_update_drafts')
            .select('week_number, feedback_score, feedback_note')
            .eq('opportunity_id', ch.opportunity_id)
            .not('feedback_score', 'is', null)
            .gte('week_number', weekNumber - 4)
            .lt('week_number', weekNumber)
            .order('week_number', { ascending: false })
            .limit(3)
          const fbRows = prevFeedback
          if (fbRows && fbRows.length > 0) {
            harness.previousFeedback = fbRows
              .filter((f): f is typeof f & { feedback_score: number; feedback_note: string } =>
                f.feedback_score != null && !!f.feedback_note
              )
              .map((f) => ({
                weekNumber: f.week_number,
                score: f.feedback_score,
                note: f.feedback_note,
              }))
          }
        } catch (err) {
          console.warn('[ghostwriter] 피드백 조회 실패 (계속 진행)', err)
        }

        // 핀 메시지 (중요 결정사항)
        try {
          harness.pinnedMessages = await fetchPinnedMessages(ch.discord_channel_id)
        } catch (err) {
          console.warn('[ghostwriter] 핀 메시지 조회 실패 (계속 진행)', err)
        }

        // 2-c. 주간-체크인 포럼 메시지 (클럽 루프 밖에서 1회 조회한 캐시 사용)
        if (checkinThreadMessages) {
          harness.checkinMessages = checkinThreadMessages
        }

        // 2-d. /마무리 회의록 (team_tasks, team_decisions, team_resources)
        // 이번 주에 해당 채널에서 생성된 구조화된 회의 기록을 최우선 소스로 사용
        try {
          const sevenDaysAgoISO = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
          const [{ data: tasks }, { data: decisions }, { data: resources }] = await Promise.all([
            admin.from('team_tasks')
              .select('assignee_name, task_description, deadline, status')
              .eq('discord_channel_id', ch.discord_channel_id)
              .gte('created_at', sevenDaysAgoISO),
            admin.from('team_decisions')
              .select('topic, result')
              .eq('discord_channel_id', ch.discord_channel_id)
              .gte('created_at', sevenDaysAgoISO),
            admin.from('team_resources')
              .select('url, label, shared_by_name')
              .eq('discord_channel_id', ch.discord_channel_id)
              .gte('created_at', sevenDaysAgoISO),
          ])

          if ((tasks && tasks.length > 0) || (decisions && decisions.length > 0) || (resources && resources.length > 0)) {
            harness.meetingRecords = {
              tasks: (tasks || []) as { assignee_name: string; task_description: string; deadline: string | null; status: string }[],
              decisions: (decisions || []) as { topic: string; result: string }[],
              resources: (resources || []) as { url: string; label: string; shared_by_name: string }[],
            }
          }
        } catch (err) {
          console.warn('[ghostwriter] 회의록 조회 실패 (계속 진행)', err)
        }

        // 3. AI 초안 생성 (하네스 컨텍스트 포함)
        const draft = await generateWeeklyDraft(messages, projectTitle, harness)

        if (!draft) {
          // 메시지 부족 → 리마인드 대상
          lowActivityTeams.push(ch.discord_channel_name || projectTitle)

          // 팀장에게 DM으로 알려줌 — "이번 주 초안이 생성되지 않은 이유"
          if (creatorId) {
            const discordUserId = discordIdMap.get(creatorId)
            if (discordUserId) {
              sendDirectMessage(
                discordUserId,
                [
                  `📭 **${weekNumber}주차 — 초안을 생성하지 못했습니다**`,
                  '',
                  `**${projectTitle}** 팀의 Discord 대화가 부족하여 AI가 주간 업데이트를 작성하지 못했습니다.`,
                  '',
                  `다음 주에는 **#주간-체크인** 포럼에 상황을 공유하거나, 팀 채널에서 대화를 나눠주세요.`,
                  `간단한 한 줄이라도 AI에게 큰 도움이 됩니다.`,
                ].join('\n')
              ).catch((e) => console.warn('[ghostwriter] 부족 알림 DM 실패', e))
            }
          }

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

        // 대시보드 요약 데이터 수집 (safeParseContent로 파싱 실패 방어)
        const parsed = safeParseContent(draft.content)
        dashboardDrafts.push({
          opportunityId: ch.opportunity_id,
          projectTitle,
          status: 'pending',
          teamStatus: parsed.teamStatus || 'normal',
          teamStatusReason: parsed.teamStatusReason || '',
          sourceMessageCount: draft.sourceMessageCount,
        })

        // 5. Discord DM + 팀 채널 알림 (fire-and-forget)
        //    배치 조회된 discordUserId, teamChannelId를 전달하여 N+1 방지
        if (savedDraft) {
          notifyDraftReady({
            draftId: savedDraft.id,
            opportunityId: ch.opportunity_id,
            projectTitle,
            title: draft.title,
            content: draft.content,
            updateType: draft.updateType,
            weekNumber,
            creatorId,
            discordUserId: creatorId ? discordIdMap.get(creatorId) : undefined,
            teamChannelId: ch.discord_channel_id,
          }).catch((err) => console.error('[ghostwriter] 알림 발송 실패', err))
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

  // 크론 결과 이상 감지 → 운영 채널에 알림
  // "처리한 팀이 있는데 초안이 0개"는 조용한 실패 — 운영진이 즉시 알아야 함
  const opsChannelId = process.env.DISCORD_OPS_DASHBOARD_CHANNEL_ID
  if (opsChannelId && results.processed > 0 && results.draftsCreated === 0 && results.errors === 0) {
    sendChannelMessage(
      opsChannelId,
      `⚠️ **Ghostwriter 크론 이상 감지**: ${results.processed}개 팀 처리했지만 초안 0개 생성. 모든 팀의 메시지가 부족하거나, Discord 메시지 fetch에 문제가 있을 수 있습니다.`
    ).catch(() => {})
  }
  if (opsChannelId && results.errors > 0) {
    sendChannelMessage(
      opsChannelId,
      `🚨 **Ghostwriter 크론 에러**: ${results.errors}건의 채널 처리 실패. 서버 로그를 확인하세요.`
    ).catch(() => {})
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
