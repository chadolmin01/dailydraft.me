import { NextRequest, NextResponse } from 'next/server'
import { sendChannelMessage } from '@/src/lib/discord/client'
import { addReaction } from '@/src/lib/discord/bot/discord-actions'

/**
 * POST /api/discord/interactions/poll
 *
 * /투표, /일정 슬래시 커맨드의 백그라운드 처리.
 * 메시지 전송 후 이모지 반응을 자동 추가.
 * (Discord Interaction 응답에는 반응 추가 불가 → 별도 메시지로 전송)
 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { type, channelId, appId, interactionToken } = body

  if (!channelId || !appId || !interactionToken) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  try {
    if (type === 'vote') {
      await handleVotePoll(body, appId, interactionToken)
    } else if (type === 'schedule') {
      await handleSchedulePoll(body, appId, interactionToken)
    }
  } catch (err) {
    console.error('[Poll] 처리 실패:', err)
    await sendFollowup(appId, interactionToken, '처리 중 오류가 발생했습니다.')
  }

  return NextResponse.json({ ok: true })
}

async function handleVotePoll(
  body: { channelId: string; topic: string; options: string[] },
  appId: string,
  interactionToken: string,
) {
  const { channelId, topic, options } = body
  const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']

  const optionLines = options
    .map((opt: string, i: number) => `${emojis[i]} ${opt}`)
    .join('\n')

  // 1) Deferred 응답 업데이트
  await sendFollowup(appId, interactionToken, '📊 투표가 생성되었습니다!')

  // 2) 채널에 투표 메시지 전송
  const msg = await sendChannelMessage(
    channelId,
    `📊 **${topic}**\n\n${optionLines}\n\n_반응을 눌러 투표해주세요! (1은 봇 기본값)_`,
  )

  // 3) 옵션 수만큼 이모지 반응 자동 추가
  if (msg?.id) {
    for (let i = 0; i < options.length; i++) {
      await addReaction(channelId, msg.id, emojis[i])
    }
  }
}

async function handleSchedulePoll(
  body: { channelId: string; purpose?: string },
  appId: string,
  interactionToken: string,
) {
  const { channelId, purpose } = body
  const header = purpose
    ? `📅 **일정 조율 — ${purpose}**`
    : '📅 **일정 조율**'

  const dayEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']

  // 1) Deferred 응답 업데이트
  await sendFollowup(appId, interactionToken, '📅 일정 투표가 생성되었습니다!')

  // 2) 채널에 일정 메시지 전송
  const msg = await sendChannelMessage(
    channelId,
    `${header}\n\n가능한 요일에 반응해주세요! (1은 봇 기본값)\n1️⃣ 월  2️⃣ 화  3️⃣ 수  4️⃣ 목  5️⃣ 금\n\n시간대까지 조율하려면 When2Meet에서 이벤트를 만들어 링크를 공유해주세요.\n🔗 https://when2meet.com`,
  )

  // 3) 요일 이모지 자동 추가
  if (msg?.id) {
    for (const emoji of dayEmojis) {
      await addReaction(channelId, msg.id, emoji)
    }
  }
}

async function sendFollowup(appId: string, interactionToken: string, content: string) {
  const url = `https://discord.com/api/v10/webhooks/${appId}/${interactionToken}`
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}
