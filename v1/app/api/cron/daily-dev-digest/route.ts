/**
 * Daily Dev Digest: 매일 저녁 개발 활동 요약
 *
 * 흐름:
 * 1. 오늘 발생한 github_events를 클럽별로 집계
 * 2. AI로 하루 요약 생성 (비개발자도 이해 가능한 톤)
 * 3. 각 클럽의 #개발-피드 채널에 요약 포스팅
 * 4. 요약 메시지에 스레드를 달아 상세 로그 첨부
 *
 * 실행: 매일 KST 22:00 (UTC 13:00)
 * 활동이 없는 날은 메시지를 보내지 않는다 (노이즈 방지).
 *
 * 수동 호출: POST /api/cron/daily-dev-digest?manual=true
 * Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture'
import { sendChannelMessage, createMessageThread } from '@/src/lib/discord/client'

export const runtime = 'nodejs'
export const maxDuration = 60

// ── AI 일일 요약 생성 ──

async function generateDailySummary(
  events: DayEvent[],
  clubName: string
): Promise<string> {
  try {
    const { chatModel } = await import('@/src/lib/ai/gemini-client')

    // 이벤트를 사람별로 그룹핑
    const byPusher = new Map<string, { commits: number; summaries: string[] }>()
    for (const ev of events) {
      const key = ev.pusher
      const existing = byPusher.get(key) || { commits: 0, summaries: [] }
      existing.commits += ev.commitCount
      if (ev.aiSummary) existing.summaries.push(ev.aiSummary)
      byPusher.set(key, existing)
    }

    const activityLines = Array.from(byPusher.entries())
      .map(([name, data]) => {
        const summaryText = data.summaries.length > 0
          ? data.summaries.join(' / ')
          : `${data.commits}건의 커밋`
        return `- ${name}: ${summaryText}`
      })
      .join('\n')

    const result = await chatModel.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `다음은 "${clubName}" 동아리의 오늘 개발 활동입니다:\n\n${activityLines}\n\n이 활동을 비개발자(기획자, 디자이너)도 이해할 수 있도록 3~5줄로 요약해주세요.\n\n규칙:\n- "무엇이 바뀌었는지"와 "사용자에게 어떤 영향이 있는지" 위주로 쓰세요\n- 기술 용어(커밋, PR, 브랜치 등)는 사용하지 마세요\n- 사람 이름은 그대로 포함하세요\n- 합쇼체를 사용하세요\n- 이모지는 사용하지 마세요\n- 마크다운도 사용하지 마세요. 순수 텍스트만 반환하세요.`
        }]
      }],
      systemInstruction: '당신은 개발팀의 하루 활동을 비개발자에게 전달하는 팀 매니저입니다. 개발 용어를 일상 언어로 바꿔서 설명합니다.',
      generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
    })

    return result.response.text().trim()
  } catch (err) {
    console.error('[daily-dev-digest] AI 요약 생성 실패:', err)
    const total = events.reduce((sum, e) => sum + e.commitCount, 0)
    const people = new Set(events.map(e => e.pusher))
    return `오늘 ${people.size}명이 총 ${total}건의 변경 작업을 진행했습니다.`
  }
}

// ── 상세 로그 포맷 ──

function formatDetailedLog(events: DayEvent[]): string {
  // 사람별로 그룹핑
  const byPusher = new Map<string, DayEvent[]>()
  for (const ev of events) {
    const list = byPusher.get(ev.pusher) || []
    list.push(ev)
    byPusher.set(ev.pusher, list)
  }

  const sections: string[] = []
  for (const [pusher, pushEvents] of byPusher) {
    const totalCommits = pushEvents.reduce((sum, e) => sum + e.commitCount, 0)
    const lines = [`**${pusher}** — ${totalCommits}건`]

    for (const ev of pushEvents) {
      const repoShort = ev.repoName.split('/')[1] || ev.repoName
      if (ev.aiSummary) {
        lines.push(`  ${repoShort}: ${ev.aiSummary}`)
      } else {
        lines.push(`  ${repoShort}: ${ev.commitCount}건 변경`)
      }
    }

    sections.push(lines.join('\n'))
  }

  return sections.join('\n\n')
}

// ── Types ──

interface DayEvent {
  pusher: string
  repoName: string
  commitCount: number
  aiSummary: string | null
}

// ── 메인 핸들러 ──

export const POST = withCronCapture('daily-dev-digest', async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized()
  }

  const admin = createAdminClient()

  // 오늘 00:00 ~ 지금까지의 이벤트 조회
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: events, error } = await admin
    .from('github_events')
    .select('club_id, pusher_github_username, repo_name, commits, ai_summary, created_at')
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[daily-dev-digest] github_events 조회 실패:', error)
    return ApiResponse.internalError()
  }

  if (!events || events.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'no activity today' })
  }

  // 클럽별로 그룹핑
  const clubMap = new Map<string, DayEvent[]>()
  for (const ev of events) {
    const clubEvents = clubMap.get(ev.club_id) || []
    clubEvents.push({
      pusher: ev.pusher_github_username,
      repoName: ev.repo_name,
      commitCount: Array.isArray(ev.commits) ? ev.commits.length : 0,
      aiSummary: ev.ai_summary,
    })
    clubMap.set(ev.club_id, clubEvents)
  }

  // 각 클럽 정보 조회
  const clubIds = Array.from(clubMap.keys())
  const { data: clubs } = await admin
    .from('clubs')
    .select('id, name')
    .in('id', clubIds)

  if (!clubs || clubs.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'no clubs found' })
  }

  const globalDevFeedChannelId = process.env.DISCORD_DEV_FEED_CHANNEL_ID
  const results: { clubId: string; sent: boolean; eventCount: number }[] = []

  for (const club of clubs) {
    const clubEvents = clubMap.get(club.id)
    if (!clubEvents || clubEvents.length === 0) continue

    const devFeedChannelId = globalDevFeedChannelId
    if (!devFeedChannelId) {
      results.push({ clubId: club.id, sent: false, eventCount: clubEvents.length })
      continue
    }

    try {
      // AI 요약 생성
      const summary = await generateDailySummary(clubEvents, club.name)

      const totalCommits = clubEvents.reduce((sum, e) => sum + e.commitCount, 0)
      const people = new Set(clubEvents.map(e => e.pusher))

      // 날짜 포맷 (4/15 화)
      const now = new Date()
      const dayNames = ['일', '월', '화', '수', '목', '금', '토']
      const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${dayNames[now.getDay()]}`

      // 메인 요약 메시지
      const message = [
        `**${dateStr} 개발 현황**`,
        summary,
        `-# ${people.size}명 · ${totalCommits}건 변경`,
      ].join('\n')

      const sentMsg = await sendChannelMessage(devFeedChannelId, message)

      // 메시지에 스레드 생성 → 상세 로그 첨부
      if (sentMsg?.id) {
        try {
          const thread = await createMessageThread(
            devFeedChannelId,
            sentMsg.id,
            `${dateStr} 전체 로그`
          )

          const detailedLog = formatDetailedLog(clubEvents)
          await sendChannelMessage(thread.id, detailedLog)
        } catch (threadErr) {
          // 스레드 생성 실패해도 메인 메시지는 이미 전송됨
          console.error(`[daily-dev-digest] 스레드 생성 실패:`, threadErr)
        }
      }

      results.push({ clubId: club.id, sent: true, eventCount: clubEvents.length })
    } catch (err) {
      console.error(`[daily-dev-digest] ${club.name} 전송 실패:`, err)
      results.push({ clubId: club.id, sent: false, eventCount: clubEvents.length })
    }
  }

  return NextResponse.json({ ok: true, results })
})

// GET: Vercel Cron 헬스체크
export async function GET() {
  return NextResponse.json({ status: 'ok', cron: 'daily-dev-digest' })
}
