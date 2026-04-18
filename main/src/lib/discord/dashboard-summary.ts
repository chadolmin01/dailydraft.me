/**
 * Discord 운영-대시보드 채널에 주간 보고를 게시한다.
 *
 * 구조:
 * - 채널: "📊 15주차 주간 보고가 도착했습니다" (한 줄)
 * - 스레드: 전체 상세 (제출률, 팀 현황, 활동량, 경고, 링크)
 */

import {
  sendChannelMessage,
  createMessageThread,
} from './client'

const STATUS_EMOJI: Record<string, string> = {
  good: '🟢',
  normal: '🟡',
  hard: '🔴',
}

interface DraftSummary {
  opportunityId: string
  projectTitle: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  teamStatus: string
  teamStatusReason: string
  sourceMessageCount: number
}

interface ActivityStat {
  discordUsername: string
  messageCount: number
  channelsActive: number
}

interface ConsecutiveMissing {
  projectTitle: string
  weeks: number
}

interface DashboardResult {
  totalTeams: number
  draftsCreated: number
  lowActivityTeams: string[]
  drafts: DraftSummary[]
  activityByTeam?: Map<string, { totalMessages: number; topMembers: ActivityStat[] }>
  consecutiveMissing?: ConsecutiveMissing[]
  clubSlug?: string
}

export async function postDashboardSummary(
  clubId: string,
  weekNumber: number,
  result: DashboardResult
): Promise<void> {
  const channelId = await getOpsDashboardChannelId(clubId)
  if (!channelId) return

  const { totalTeams, draftsCreated, lowActivityTeams, drafts } = result
  const submissionRate = totalTeams > 0 ? Math.round((draftsCreated / totalTeams) * 100) : 0

  try {
    // ── 1. 채널에 한 줄 알림 ──
    const mainMsg = await sendChannelMessage(
      channelId,
      `📊 **${weekNumber}주차 주간 보고가 도착했습니다** (${submissionRate}% 제출)`
    )

    // ── 2. 스레드 생성 ──
    const thread = await createMessageThread(
      channelId,
      mainMsg.id,
      `${weekNumber}주차 주간 보고`
    )

    // ── 3. 스레드 안에 상세 ──

    // 팀 상태 집계
    const statusCounts = { good: 0, normal: 0, hard: 0 }
    for (const d of drafts) {
      if (d.teamStatus in statusCounts) {
        statusCounts[d.teamStatus as keyof typeof statusCounts]++
      }
    }
    const statusBar = [
      statusCounts.good > 0 ? `🟢${statusCounts.good}` : null,
      statusCounts.normal > 0 ? `🟡${statusCounts.normal}` : null,
      statusCounts.hard > 0 ? `🔴${statusCounts.hard}` : null,
      lowActivityTeams.length > 0 ? `🔕${lowActivityTeams.length}` : null,
    ].filter(Boolean).join(' ')

    // 팀별 현황 (상태 이유 포함)
    const teamLines = drafts.map((d) => {
      const emoji = STATUS_EMOJI[d.teamStatus] || '⚪'
      const statusTag = d.status === 'approved' ? '✅' : d.status === 'pending' ? '⏳' : '❌'
      let line = `${emoji} **${d.projectTitle}** ${statusTag}`

      if (result.activityByTeam) {
        const activity = result.activityByTeam.get(d.opportunityId)
        if (activity) line += ` — 💬${activity.totalMessages}건`
      }

      // AI가 판단한 팀 상태 이유 (원문 노출 없이 요약만)
      if (d.teamStatusReason) {
        line += `\n> ${d.teamStatusReason}`
      }

      return line
    })
    if (lowActivityTeams.length > 0) {
      teamLines.push(...lowActivityTeams.map(n => `🔕 **${n}** — 활동 부족`))
    }

    // 첫 번째 메시지: 요약 + 팀 현황
    const summaryMsg = [
      `**${weekNumber}주차 주간 보고**`,
      '',
      `제출률 **${submissionRate}%** (${draftsCreated}/${totalTeams}팀) | ${statusBar}`,
      '',
      ...teamLines,
    ].join('\n')

    await sendChannelMessage(thread.id, summaryMsg)

    // 두 번째 메시지: 활동 TOP + 경고 + 링크 (내용 있을 때만)
    const extraParts: string[] = []

    // TOP 멤버
    if (result.activityByTeam && result.activityByTeam.size > 0) {
      const allMembers = new Map<string, number>()
      for (const [, teamData] of result.activityByTeam) {
        for (const member of teamData.topMembers) {
          const current = allMembers.get(member.discordUsername) || 0
          allMembers.set(member.discordUsername, current + member.messageCount)
        }
      }
      const sorted = [...allMembers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
      if (sorted.length > 0) {
        const medals = ['🥇', '🥈', '🥉', '▫️', '▫️']
        const lines = sorted.map(([name, count], i) => `${medals[i]} ${name} — ${count}건`)
        extraParts.push(['**🏆 활동 TOP**', ...lines].join('\n'))
      }
    }

    // 연속 미제출 경고
    if (result.consecutiveMissing && result.consecutiveMissing.length > 0) {
      const lines = result.consecutiveMissing.map(t => {
        const emoji = t.weeks >= 3 ? '🚨' : '⚠️'
        return `${emoji} **${t.projectTitle}** — ${t.weeks}주 연속`
      })
      extraParts.push(['**🚨 연속 미제출**', ...lines].join('\n'))
    }

    // 보고서 링크
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://draft.is'
    const slug = result.clubSlug || ''
    if (slug) {
      extraParts.push(
        `📥 [CSV](${baseUrl}/api/clubs/${slug}/reports/export?format=csv&week=${weekNumber}) · [인쇄용](${baseUrl}/api/clubs/${slug}/reports/export?format=pdf&week=${weekNumber}) · [대시보드](${baseUrl}/dashboard)`
      )
    }

    if (extraParts.length > 0) {
      await sendChannelMessage(thread.id, extraParts.join('\n\n'))
    }
  } catch (error) {
    console.error('[dashboard-summary] 운영-대시보드 게시 실패', error)
  }
}

async function getOpsDashboardChannelId(clubId: string): Promise<string | null> {
  // 2026-04-18: clubs.operator_channel_id 우선, 없으면 env fallback.
  // 멀티클럽 환경에서 각 클럽이 자기 운영진 채널을 지정 가능.
  try {
    const { createAdminClient } = await import('@/src/lib/supabase/admin')
    const admin = createAdminClient()
    const { data } = await admin
      .from('clubs')
      .select('operator_channel_id')
      .eq('id', clubId)
      .maybeSingle()
    if (data?.operator_channel_id) return data.operator_channel_id
  } catch (err) {
    console.warn('[dashboard-summary] operator_channel_id 조회 실패, env fallback 사용:', err)
  }
  return process.env.DISCORD_OPS_DASHBOARD_CHANNEL_ID || null
}
