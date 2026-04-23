import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { buildTodoAssigneeSelect } from '@/src/lib/discord/bot/modals'
import { generateStateKey, setTodoDraft } from '@/src/lib/discord/bot/modal-state'
import { CHANNEL_MESSAGE, DEFERRED_CHANNEL_MESSAGE, EPHEMERAL } from '../_constants'

// Discord Modal 제출 핸들러 모음.
// route.ts 에서 분리 — dispatcher + 각 modal submit handler. 동작 1:1 보존.

// ── Modal 제출 디스패처 ──
export function handleModalSubmit(interaction: any, baseUrl: string) {
  const customId: string = interaction.data?.custom_id ?? ''

  switch (customId) {
    case 'modal_todo_submit':
      return handleTodoModalSubmit(interaction)
    case 'modal_vote_submit':
      return handleVoteModalSubmit(interaction, baseUrl)
    case 'modal_oneline_submit':
      return handleOneLineModalSubmit(interaction)
    case 'modal_schedule_submit':
      return handleScheduleModalSubmit(interaction, baseUrl)
    case 'modal_meeting_submit':
      return handleMeetingModalSubmit(interaction, baseUrl)
    default:
      return NextResponse.json({
        type: CHANNEL_MESSAGE,
        data: { content: '알 수 없는 Modal입니다.', flags: EPHEMERAL },
      })
  }
}

/** Modal 제출 데이터에서 특정 필드 값 추출 */
function getModalField(interaction: any, fieldId: string): string {
  const rows: any[] = interaction.data?.components ?? []
  for (const row of rows) {
    for (const comp of row.components ?? []) {
      if (comp.custom_id === fieldId) return String(comp.value ?? '').trim()
    }
  }
  return ''
}

// ── Modal 제출: 투두 (담당자 Select 로 이어짐) ──
function handleTodoModalSubmit(interaction: any) {
  const content = getModalField(interaction, 'content')
  const deadline = getModalField(interaction, 'deadline') || null

  if (!content) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '내용을 입력해주세요.', flags: EPHEMERAL },
    })
  }

  const channelId = interaction.channel_id
  const guildId = interaction.guild_id
  const requesterId = interaction.member?.user?.id ?? interaction.user?.id

  if (!channelId || !requesterId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '요청을 처리할 수 없습니다.', flags: EPHEMERAL },
    })
  }

  const stateKey = generateStateKey()
  setTodoDraft(stateKey, {
    content,
    deadline,
    requesterId,
    channelId,
    guildId: guildId ?? '',
    createdAt: Date.now(),
  })

  const select = buildTodoAssigneeSelect(stateKey)

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: select.content,
      components: select.components,
      flags: EPHEMERAL, // 본인만 보임
    },
  })
}

// ── Modal 제출: 투표 (기존 /api/discord/interactions/poll 재활용) ──
function handleVoteModalSubmit(interaction: any, baseUrl: string) {
  const topic = getModalField(interaction, 'topic')
  const options = [
    getModalField(interaction, 'opt1'),
    getModalField(interaction, 'opt2'),
    getModalField(interaction, 'opt3'),
    getModalField(interaction, 'opt4'),
  ].filter((v) => v.length > 0)

  if (!topic || options.length < 2) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '주제와 최소 2개의 옵션을 입력해주세요.', flags: EPHEMERAL },
    })
  }

  const channelId = interaction.channel_id
  const appId = interaction.application_id ?? process.env.DISCORD_APP_ID
  const interactionToken = interaction.token

  if (!channelId || !appId || !interactionToken) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '채널 정보를 찾을 수 없습니다.', flags: EPHEMERAL },
    })
  }

  after(async () => {
    try {
      await fetch(`${baseUrl}/api/discord/interactions/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'vote',
          channelId,
          appId,
          interactionToken,
          topic,
          options,
        }),
      })
    } catch (err) {
      console.error('[Modal] 투표 생성 실패:', err)
    }
  })

  return NextResponse.json({ type: DEFERRED_CHANNEL_MESSAGE })
}

// ── Modal 제출: 한줄 체크인 ──
function handleOneLineModalSubmit(interaction: any) {
  const content = getModalField(interaction, 'content')
  const userId = interaction.member?.user?.id ?? interaction.user?.id

  if (!content) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '내용을 입력해주세요.', flags: EPHEMERAL },
    })
  }

  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })
  const mention = userId ? `<@${userId}>` : '(알 수 없음)'

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: `💬 **한줄 체크인** — ${mention} · ${today}\n${content}`,
    },
  })
}

// ── Modal 제출: 일정 조율 (기존 /api/discord/interactions/poll 재활용) ──
function handleScheduleModalSubmit(interaction: any, baseUrl: string) {
  const purpose = getModalField(interaction, 'purpose') || undefined

  const channelId = interaction.channel_id
  const appId = interaction.application_id ?? process.env.DISCORD_APP_ID
  const interactionToken = interaction.token

  if (!channelId || !appId || !interactionToken) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '채널 정보를 찾을 수 없습니다.', flags: EPHEMERAL },
    })
  }

  after(async () => {
    try {
      await fetch(`${baseUrl}/api/discord/interactions/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'schedule',
          channelId,
          appId,
          interactionToken,
          purpose,
        }),
      })
    } catch (err) {
      console.error('[Modal] 일정 생성 실패:', err)
    }
  })

  return NextResponse.json({ type: DEFERRED_CHANNEL_MESSAGE })
}

// ── Modal 제출: 회의시작 (기존 /api/discord/interactions/todo 의 meeting-start 재활용) ──
function handleMeetingModalSubmit(interaction: any, baseUrl: string) {
  const agenda = getModalField(interaction, 'agenda') || undefined

  const channelId = interaction.channel_id
  const appId = interaction.application_id ?? process.env.DISCORD_APP_ID
  const interactionToken = interaction.token

  if (!channelId || !appId || !interactionToken) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '채널 정보를 찾을 수 없습니다.', flags: EPHEMERAL },
    })
  }

  after(async () => {
    try {
      await fetch(`${baseUrl}/api/discord/interactions/todo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'meeting-start',
          channelId,
          appId,
          interactionToken,
          agenda,
        }),
      })
    } catch (err) {
      console.error('[Modal] 회의시작 실패:', err)
    }
  })

  return NextResponse.json({ type: DEFERRED_CHANNEL_MESSAGE })
}
