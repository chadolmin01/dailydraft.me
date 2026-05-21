import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { CHANNEL_MESSAGE, DEFERRED_CHANNEL_MESSAGE, EPHEMERAL } from '../_constants'

// ── /개발현황 — 오늘의 개발 활동 로그 ──
// route.ts 에서 분리. 동작 1:1 보존.
// launcher_devstatus 버튼에서도 호출됨 — handler 는 동일.

export async function handleDevStatusCommand(interaction: {
  guild_id?: string
  token?: string
  application_id?: string
  channel_id?: string
}) {
  const appId = interaction.application_id ?? process.env.DISCORD_APP_ID
  const interactionToken = interaction.token
  const guildId = interaction.guild_id

  if (!interactionToken || !appId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '요청을 처리할 수 없습니다.', flags: EPHEMERAL },
    })
  }

  // Deferred 응답 후 백그라운드에서 DB 조회 + followup
  after(async () => {
    try {
      const admin = createAdminClient()

      // 오늘 00:00 KST 기준
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      // guild_id → club_id 매핑
      let clubId: string | null = null
      if (guildId) {
        const { data: installation } = await admin
          .from('discord_bot_installations')
          .select('club_id')
          .eq('discord_guild_id', guildId)
          .maybeSingle()
        clubId = installation?.club_id ?? null
      }

      // 오늘의 github_events 조회
      let query = admin
        .from('github_events')
        .select('pusher_github_username, repo_name, commits, ai_summary, created_at')
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: true })

      if (clubId) {
        query = query.eq('club_id', clubId)
      }

      const { data: events } = await query

      const followupUrl = `https://discord.com/api/v10/webhooks/${appId}/${interactionToken}`

      if (!events || events.length === 0) {
        await fetch(followupUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: '오늘은 아직 개발 활동이 없습니다.',
            flags: EPHEMERAL,
          }),
        })
        return
      }

      // 사람별로 그룹핑
      const byPusher = new Map<
        string,
        { commits: number; summaries: string[]; repos: Set<string> }
      >()
      for (const ev of events) {
        const key = ev.pusher_github_username
        const existing =
          byPusher.get(key) || { commits: 0, summaries: [], repos: new Set<string>() }
        const commitCount = Array.isArray(ev.commits) ? ev.commits.length : 0
        existing.commits += commitCount
        existing.repos.add(ev.repo_name.split('/')[1] || ev.repo_name)
        if (ev.ai_summary) existing.summaries.push(ev.ai_summary)
        byPusher.set(key, existing)
      }

      const totalCommits = events.reduce(
        (sum, ev) => sum + (Array.isArray(ev.commits) ? ev.commits.length : 0),
        0
      )

      const now = new Date()
      const dayNames = ['일', '월', '화', '수', '목', '금', '토']
      const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${dayNames[now.getDay()]}`

      // 사람별 상세
      const sections: string[] = []
      for (const [pusher, data] of byPusher) {
        const repoList = Array.from(data.repos).join(', ')
        const lines = [`**${pusher}** — ${data.commits}건 (${repoList})`]
        for (const summary of data.summaries) {
          lines.push(`  ${summary}`)
        }
        sections.push(lines.join('\n'))
      }

      const content = [
        `**${dateStr} 개발 현황** (현재까지)`,
        '',
        ...sections,
        '',
        `-# ${byPusher.size}명 · ${totalCommits}건 변경 · ${events.length}회 push`,
      ].join('\n')

      // "전체 커밋 보기" 버튼 추가
      await fetch(followupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          flags: EPHEMERAL,
          components: [
            {
              type: 1, // ACTION_ROW
              components: [
                {
                  type: 2, // BUTTON
                  style: 2, // SECONDARY (회색)
                  label: '전체 커밋 보기',
                  custom_id: `dev_status_detail:${clubId ?? 'all'}`,
                },
              ],
            },
          ],
        }),
      })
    } catch (err) {
      console.error('[Interactions] 개발현황 처리 실패:', err)
    }
  })

  return NextResponse.json({
    type: DEFERRED_CHANNEL_MESSAGE,
    data: { flags: EPHEMERAL },
  })
}
