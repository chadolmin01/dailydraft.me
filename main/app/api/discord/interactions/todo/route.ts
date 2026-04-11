import { NextRequest, NextResponse } from 'next/server'
import { sendChannelMessage, fetchChannelMessages } from '@/src/lib/discord/client'
import { addReaction, getReactions } from '@/src/lib/discord/bot/discord-actions'

/**
 * POST /api/discord/interactions/todo
 *
 * /투두, /회의시작 슬래시 커맨드의 백그라운드 처리.
 *
 * /투두: 할 일 메시지 전송 + ✅ 반응 추가
 * /회의시작: 채널의 미완료 투두 수집 → 리마인드 메시지
 */

// 투두 메시지 식별 프리픽스 (이걸로 봇의 투두 메시지를 구분)
const TODO_PREFIX = '📌 **할 일**'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { type, appId, interactionToken } = body

  if (!appId || !interactionToken) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  try {
    if (type === 'create') {
      await handleCreateTodo(body, appId, interactionToken)
    } else if (type === 'meeting-start') {
      await handleMeetingStart(body, appId, interactionToken)
    }
  } catch (err) {
    console.error('[Todo] 처리 실패:', err)
    await sendFollowup(appId, interactionToken, '처리 중 오류가 발생했습니다.')
  }

  return NextResponse.json({ ok: true })
}

// ── /투두 — 할 일 등록 ──

async function handleCreateTodo(
  body: { channelId: string; content: string; assigneeId?: string },
  appId: string,
  interactionToken: string,
) {
  const { channelId, content, assigneeId } = body

  const assigneeMention = assigneeId ? `<@${assigneeId}>` : null
  const assigneeLine = assigneeMention ? `\n👤 담당: ${assigneeMention}` : ''

  // 1) Deferred 응답 업데이트
  await sendFollowup(appId, interactionToken, '📌 할 일이 등록되었습니다!')

  // 2) 채널에 투두 메시지 전송
  const msg = await sendChannelMessage(
    channelId,
    `${TODO_PREFIX} — ${content}${assigneeLine}\n\n✅ 완료되면 반응을 눌러주세요`,
  )

  // 3) ✅ 반응 추가 (완료 체크용)
  if (msg?.id) {
    await addReaction(channelId, msg.id, '✅')
  }
}

// ── /회의시작 — 미완료 투두 리마인드 + 회의 시작 ──

async function handleMeetingStart(
  body: { channelId: string; agenda?: string },
  appId: string,
  interactionToken: string,
) {
  const { channelId, agenda } = body

  // 1) 채널의 최근 메시지에서 투두 메시지 수집
  const messages = await fetchChannelMessages(channelId, { maxMessages: 100 })

  if (!messages) {
    await sendFollowup(appId, interactionToken, '메시지를 불러올 수 없습니다.')
    return
  }

  // 2) 봇이 보낸 투두 메시지 필터링
  const todoMessages = messages.filter(
    (m: { author: { bot?: boolean }; content: string }) =>
      m.author.bot && m.content.startsWith(TODO_PREFIX)
  )

  // 3) 각 투두의 ✅ 반응 수 확인 → 미완료 수집
  const incompleteTodos: string[] = []

  for (const todo of todoMessages) {
    const reactions = await getReactions(channelId, todo.id, '✅')
    // 반응 수 1 = 봇만 누름 = 미완료, 2+ = 누군가 완료 체크함
    if (reactions.length <= 1) {
      // "📌 **할 일** — 디자인시안 완성\n👤 담당: @민수\n..." 에서 내용 추출
      const firstLine = todo.content.split('\n')[0]
      const taskContent = firstLine.replace(`${TODO_PREFIX} — `, '')
      // 담당자 추출
      const assigneeLine = todo.content.split('\n').find((l: string) => l.startsWith('👤'))
      const assignee = assigneeLine ? ` ${assigneeLine}` : ''
      incompleteTodos.push(`• ${taskContent}${assignee}`)
    }
  }

  // 4) 회의 시작 메시지 구성
  const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  let meetingMsg = `🟢 **회의 시작** — ${today}`

  if (agenda) {
    meetingMsg += `\n📋 안건: ${agenda}`
  }

  if (incompleteTodos.length > 0) {
    meetingMsg += `\n\n⚠️ **미완료 할 일 ${incompleteTodos.length}건**\n${incompleteTodos.join('\n')}`
  } else {
    meetingMsg += '\n\n✅ 미완료 할 일 없음'
  }

  meetingMsg += '\n\n회의가 끝나면 `/마무리`를 입력해주세요.'

  // 5) Deferred 응답 업데이트
  await sendFollowup(appId, interactionToken, '🟢 회의가 시작되었습니다!')

  // 6) 채널에 회의 시작 메시지 전송
  await sendChannelMessage(channelId, meetingMsg)
}

async function sendFollowup(appId: string, interactionToken: string, content: string) {
  const url = `https://discord.com/api/v10/webhooks/${appId}/${interactionToken}`
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}
