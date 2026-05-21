import { NextRequest, NextResponse } from 'next/server'
import { fetchChannelMessages, sendChannelMessage, createMessageThread } from '@/src/lib/discord/client'
import { chatModel } from '@/src/lib/ai/gemini-client'
import { createAdminClient } from '@/src/lib/supabase/admin'

/**
 * POST /api/discord/interactions/summary
 *
 * /마무리 슬래시 커맨드의 백그라운드 처리.
 * 주차 자동 감지:
 *   - 첫 사용 시 → followup으로 몇 주차인지 질문 (current_week = null)
 *   - 이후 → 경과 주 수 자동 계산하여 표시
 */
export async function POST(request: NextRequest) {
  const { channelId, guildId, appId, interactionToken } = await request.json()

  if (!channelId || !appId || !interactionToken) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  try {
    // 주차 정보 조회
    const weekInfo = guildId ? await getWeekInfo(guildId) : null

    // 첫 사용: 주차 미설정 → 안내 메시지
    if (weekInfo && weekInfo.currentWeek === null) {
      await sendFollowup(
        appId,
        interactionToken,
        '📝 **첫 마무리입니다!**\n\n주차 카운터가 시작되었습니다. 다음 `/마무리`부터 자동으로 주차가 표시됩니다.\n\n주차를 변경하려면 Draft 웹 설정에서 수정할 수 있습니다.'
      )
      // 첫 호출 — 1주차로 설정, 이후 자동 증가
      await setWeekInfo(weekInfo.settingsId, 1)
      return NextResponse.json({ ok: true })
    }

    // 메시지 수집
    const messages = await fetchChannelMessages(channelId, { maxMessages: 50 })

    if (!messages || messages.length < 3) {
      await sendFollowup(appId, interactionToken, '📝 정리할 내용이 충분하지 않습니다.')
      return NextResponse.json({ ok: true })
    }

    const humanMessages = messages
      .filter((m: { author: { bot?: boolean } }) => !m.author.bot)
      .reverse()

    if (humanMessages.length < 3) {
      await sendFollowup(appId, interactionToken, '📝 정리할 내용이 충분하지 않습니다.')
      return NextResponse.json({ ok: true })
    }

    const conversationText = humanMessages
      .map((m: { author: { username: string }; content: string }) => `${m.author.username}: ${m.content}`)
      .join('\n')

    const summaryPrompt = `다음은 Discord 팀 채널의 최근 대화입니다. 이 대화를 분석하여 아래 형식으로 한국어로 정리해주세요. 마크다운 헤딩(##)은 사용하지 마세요. 굵은 글씨(**)와 리스트(-)만 사용하세요.

**📋 대화 요약**
(2-3문장으로 핵심 내용 요약)

**✅ 할 일**
(감지된 할 일 목록. 없으면 "감지된 할 일 없음")

**🎯 결정사항**
(합의된 결정 목록. 없으면 "결정사항 없음")

**🔗 공유된 자료**
(공유된 링크나 파일. 없으면 "공유 자료 없음")

---
대화 내용:
${conversationText}`

    const result = await chatModel.generateContent(summaryPrompt)
    const summary = result.response.text()

    // 주차 계산
    const weekLabel = weekInfo ? getWeekLabel(weekInfo) : null
    const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    const titleDate = weekLabel ? `${weekLabel} — ${today}` : today

    // 1) Deferred 응답 업데이트
    await sendFollowup(appId, interactionToken, `📝 대화 요약이 완료되었습니다.`)

    // 2) 채널에 헤더 메시지
    const headerMsg = await sendChannelMessage(
      channelId,
      `📝 **${titleDate} 대화 마무리** — 쓰레드에서 상세 내용을 확인하세요.`
    )

    // 3) 쓰레드에 상세 요약
    if (headerMsg?.id) {
      const threadName = weekLabel ? `${weekLabel} 대화 요약` : `${today} 대화 요약`
      const thread = await createMessageThread(channelId, headerMsg.id, threadName)
      if (thread?.id) {
        const chunks = splitMessage(summary, 1900)
        for (const chunk of chunks) {
          await sendChannelMessage(thread.id, chunk)
        }
      }
    }

    // 주차 자동 증가 (week_started_at이 없으면 지금 설정)
    if (weekInfo?.settingsId && weekInfo.currentWeek !== null && weekInfo.currentWeek > 0) {
      if (!weekInfo.weekStartedAt) {
        await setWeekInfo(weekInfo.settingsId, weekInfo.currentWeek)
      }
    }
  } catch (err) {
    console.error('[Summary] 요약 생성 실패:', err)
    await sendFollowup(appId, interactionToken, '요약 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
  }

  return NextResponse.json({ ok: true })
}

// ── 주차 관련 헬퍼 ──

interface WeekInfo {
  settingsId: string
  currentWeek: number | null
  weekStartedAt: string | null
}

async function getWeekInfo(guildId: string): Promise<WeekInfo | null> {
  const supabase = createAdminClient()

  // guild_id → club_id → ghostwriter_settings
  const { data: installation } = await supabase
    .from('discord_bot_installations')
    .select('club_id')
    .eq('discord_guild_id', guildId)
    .maybeSingle()

  if (!installation) return null

  // current_week, week_started_at은 마이그레이션으로 추가된 컬럼 — 타입 정의에 아직 없으므로 any 단언
  const { data: settings } = await supabase
    .from('club_ghostwriter_settings')
    .select('id, current_week, week_started_at')
    .eq('club_id', installation.club_id)
    .maybeSingle() as { data: { id: string; current_week: number | null; week_started_at: string | null } | null }

  if (!settings) {
    // settings가 없으면 생성
    const { data: newSettings } = await supabase
      .from('club_ghostwriter_settings')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ club_id: installation.club_id } as any)
      .select('id, current_week, week_started_at')
      .single() as { data: { id: string; current_week: number | null; week_started_at: string | null } | null }

    if (!newSettings) return null
    return {
      settingsId: newSettings.id,
      currentWeek: newSettings.current_week,
      weekStartedAt: newSettings.week_started_at,
    }
  }

  return {
    settingsId: settings.id,
    currentWeek: settings.current_week,
    weekStartedAt: settings.week_started_at,
  }
}

async function setWeekInfo(settingsId: string, week: number): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('club_ghostwriter_settings')
    .update({
      current_week: week,
      week_started_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', settingsId)
}

function getWeekLabel(info: WeekInfo): string | null {
  if (info.currentWeek === null || info.currentWeek === 0) return null

  if (!info.weekStartedAt) return `${info.currentWeek}주차`

  // week_started_at 기준으로 경과 주 수 계산
  const startDate = new Date(info.weekStartedAt)
  const now = new Date()
  const diffMs = now.getTime() - startDate.getTime()
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))

  return `${info.currentWeek + diffWeeks}주차`
}

async function sendFollowup(appId: string, interactionToken: string, content: string) {
  const url = `https://discord.com/api/v10/webhooks/${appId}/${interactionToken}`
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

function splitMessage(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text]
  const lines = text.split('\n')
  const chunks: string[] = []
  let current = ''
  for (const line of lines) {
    if (current.length + line.length + 1 > maxLen) {
      chunks.push(current)
      current = line
    } else {
      current += (current ? '\n' : '') + line
    }
  }
  if (current) chunks.push(current)
  return chunks
}
