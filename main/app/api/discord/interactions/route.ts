import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { APP_URL } from '@/src/constants'
import nacl from 'tweetnacl'

/**
 * POST /api/discord/interactions
 *
 * Discord 슬래시 커맨드 인터랙션 웹훅 핸들러.
 * Discord Developer Portal에서 Interactions Endpoint URL로 이 URL을 설정.
 *
 * 지원 커맨드:
 * - /profile [@user] — Draft 프로필 링크 반환
 * - /마무리 — 대화 요약 (Deferred → 비동기 처리)
 * - /투표 — 투표 생성
 * - /일정 — 일정 조율
 * - /설정 — Draft 웹 설정 링크
 * - /도움 — 명령어 안내
 */

// Discord Interaction Types
const PING = 1
const APPLICATION_COMMAND = 2
const MESSAGE_COMPONENT = 3 // 버튼 클릭

// Discord Interaction Response Types
const PONG = 1
const CHANNEL_MESSAGE = 4
const DEFERRED_CHANNEL_MESSAGE = 5 // "봇이 생각 중..." → 나중에 followup
const UPDATE_MESSAGE = 7 // 원본 메시지 수정 (버튼 제거 등)

const APP_PUBLIC_KEY = process.env.DISCORD_APP_PUBLIC_KEY ?? ''

/**
 * Ed25519 서명 검증 (Discord 필수 요구사항)
 * tweetnacl 사용 — Vercel Serverless에서 안정적으로 동작
 */
function verifyDiscordSignature(
  body: string,
  signature: string,
  timestamp: string
): boolean {
  if (!APP_PUBLIC_KEY) return false

  try {
    const sig = hexToUint8Array(signature)
    const publicKey = hexToUint8Array(APP_PUBLIC_KEY)
    const message = new TextEncoder().encode(timestamp + body)

    return nacl.sign.detached.verify(message, sig, publicKey)
  } catch {
    return false
  }
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-signature-ed25519') ?? ''
  const timestamp = request.headers.get('x-signature-timestamp') ?? ''

  // 1. 서명 검증 (Discord 필수)
  const isValid = verifyDiscordSignature(body, signature, timestamp)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const interaction = JSON.parse(body)

  // 2. PING → PONG (Discord 엔드포인트 등록 시 검증용)
  if (interaction.type === PING) {
    return NextResponse.json({ type: PONG })
  }

  // 3. 버튼 클릭 처리
  if (interaction.type === MESSAGE_COMPONENT) {
    return handleButtonClick(interaction)
  }

  // 4. 슬래시 커맨드 처리
  if (interaction.type === APPLICATION_COMMAND) {
    const commandName = interaction.data?.name
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : APP_URL

    if (commandName === 'profile') {
      return handleProfileCommand(interaction)
    }

    if (commandName === '마무리') {
      return handleSummaryCommand(interaction, baseUrl)
    }

    if (commandName === '투표') {
      return handleVoteCommand(interaction, baseUrl)
    }

    if (commandName === '일정') {
      return handleScheduleCommand(interaction, baseUrl)
    }

    if (commandName === '투두') {
      return handleTodoCommand(interaction, baseUrl)
    }

    if (commandName === '회의시작') {
      return handleMeetingStartCommand(interaction, baseUrl)
    }

    if (commandName === '한줄') {
      return handleOneLineCommand(interaction)
    }

    if (commandName === '설정') {
      return handleSettingsCommand(interaction)
    }

    if (commandName === '도움') {
      return handleHelpCommand()
    }

    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: {
        content: '알 수 없는 명령입니다.',
        flags: 64, // EPHEMERAL — 본인만 보임
      },
    })
  }

  return NextResponse.json({ type: PONG })
}

async function handleProfileCommand(interaction: {
  data?: { options?: { name: string; type: number; value: string }[] }
  member?: { user?: { id: string } }
  user?: { id: string }
}) {
  // 타겟: /profile @user 로 지정하거나, 미지정 시 본인
  const targetOption = interaction.data?.options?.find(o => o.name === 'user')
  const targetDiscordId =
    targetOption?.value ??
    interaction.member?.user?.id ??
    interaction.user?.id

  if (!targetDiscordId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '유저를 찾을 수 없습니다.', flags: 64 },
    })
  }

  // Draft DB에서 discord_user_id로 프로필 조회
  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, nickname, desired_position')
    .eq('discord_user_id', targetDiscordId)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: {
        content: '이 멤버는 아직 Draft에 연결되지 않았습니다.\nDraft에서 프로필을 완성해주세요!',
        flags: 64,
      },
    })
  }

  const baseUrl = APP_URL

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      embeds: [
        {
          title: `${profile.nickname}님의 프로필`,
          url: `${baseUrl}/profile/${profile.user_id}`,
          color: 0x6366f1, // indigo-500
          fields: profile.desired_position
            ? [{ name: '포지션', value: profile.desired_position, inline: true }]
            : [],
          footer: { text: 'Draft' },
        },
      ],
      flags: 64, // EPHEMERAL
    },
  })
}

// ── /마무리 — 대화 요약 (Deferred → 백그라운드에서 AI 분석 후 followup) ──

async function handleSummaryCommand(interaction: {
  channel_id?: string
  guild_id?: string
  token?: string
  application_id?: string
}, baseUrl: string) {
  const channelId = interaction.channel_id
  const guildId = interaction.guild_id
  const appId = interaction.application_id ?? process.env.DISCORD_APP_ID
  const interactionToken = interaction.token

  if (!channelId || !interactionToken || !appId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '채널 정보를 찾을 수 없습니다.', flags: 64 },
    })
  }

  // Vercel Serverless는 응답 후 fire-and-forget이 동작하지 않으므로 별도 함수 호출
  fetch(`${baseUrl}/api/discord/interactions/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channelId, guildId, appId, interactionToken }),
  }).catch((err) => console.error('[Interactions] 마무리 트리거 실패:', err))

  return NextResponse.json({ type: DEFERRED_CHANNEL_MESSAGE })
}

// ── /투표 — 투표 생성 (Deferred → 메시지 전송 후 자동 이모지 반응) ──

function handleVoteCommand(interaction: {
  channel_id?: string
  token?: string
  application_id?: string
  data?: { options?: { name: string; value: string }[] }
}, baseUrl: string) {
  const options = interaction.data?.options ?? []
  const topic = options.find((o) => o.name === '주제')?.value
  const optionValues = ['옵션1', '옵션2', '옵션3', '옵션4', '옵션5']
    .map((name) => options.find((o) => o.name === name)?.value)
    .filter(Boolean) as string[]

  if (!topic || optionValues.length < 2) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '주제와 최소 2개의 옵션을 입력해주세요.', flags: 64 },
    })
  }

  const channelId = interaction.channel_id
  const appId = interaction.application_id ?? process.env.DISCORD_APP_ID
  const interactionToken = interaction.token

  if (!channelId || !appId || !interactionToken) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '채널 정보를 찾을 수 없습니다.', flags: 64 },
    })
  }

  // 백그라운드에서 메시지 전송 + 이모지 반응 추가
  fetch(`${baseUrl}/api/discord/interactions/poll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'vote',
      channelId,
      appId,
      interactionToken,
      topic,
      options: optionValues,
    }),
  }).catch((err) => console.error('[Interactions] 투표 트리거 실패:', err))

  return NextResponse.json({ type: DEFERRED_CHANNEL_MESSAGE })
}

// ── /일정 — 일정 조율 (Deferred → 메시지 전송 후 자동 요일 반응) ──

function handleScheduleCommand(interaction: {
  channel_id?: string
  token?: string
  application_id?: string
  data?: { options?: { name: string; value: string }[] }
}, baseUrl: string) {
  const channelId = interaction.channel_id
  const appId = interaction.application_id ?? process.env.DISCORD_APP_ID
  const interactionToken = interaction.token
  const purpose = interaction.data?.options?.find((o) => o.name === '목적')?.value

  if (!channelId || !appId || !interactionToken) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '채널 정보를 찾을 수 없습니다.', flags: 64 },
    })
  }

  fetch(`${baseUrl}/api/discord/interactions/poll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'schedule',
      channelId,
      appId,
      interactionToken,
      purpose,
    }),
  }).catch((err) => console.error('[Interactions] 일정 트리거 실패:', err))

  return NextResponse.json({ type: DEFERRED_CHANNEL_MESSAGE })
}

// ── /설정 — Draft 웹 설정 링크 ──

async function handleSettingsCommand(interaction: {
  guild_id?: string
}) {
  const guildId = interaction.guild_id
  const appUrl = APP_URL

  if (!guildId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '서버 정보를 찾을 수 없습니다.', flags: 64 },
    })
  }

  // guild_id → club slug 조회 (URL에 숫자 ID가 아닌 slug 사용)
  const supabase = createAdminClient()
  const { data: installation } = await supabase
    .from('discord_bot_installations')
    .select('club_id')
    .eq('discord_guild_id', guildId)
    .maybeSingle()

  if (!installation) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '이 서버는 아직 Draft 클럽에 연결되지 않았습니다.', flags: 64 },
    })
  }

  const { data: club } = await supabase
    .from('clubs')
    .select('slug')
    .eq('id', installation.club_id)
    .single()

  const clubPath = club?.slug ?? installation.club_id

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: `⚙️ **Discord 연동 설정**\n\n아래 링크에서 설정을 변경할 수 있습니다:\n🔗 ${appUrl}/clubs/${clubPath}/settings/discord\n\n설정 항목:\n• 채널-프로젝트 매핑\n• AI 톤 (합쇼체/부드러운 ��쇼체/English)\n• 체크인/초안 생성 스케줄\n• 외부 도구 연동 (GitHub, Notion 등)\n• 승인 권한`,
      flags: 64, // EPHEMERAL
    },
  })
}

// ── /투두 — 할 일 등록 (Deferred → 메시지 + ✅ 반응) ──

function handleTodoCommand(interaction: {
  channel_id?: string
  token?: string
  application_id?: string
  member?: { user?: { id: string } }
  user?: { id: string }
  data?: { options?: { name: string; value: string }[] }
}, baseUrl: string) {
  const channelId = interaction.channel_id
  const appId = interaction.application_id ?? process.env.DISCORD_APP_ID
  const interactionToken = interaction.token
  const content = interaction.data?.options?.find(o => o.name === '내용')?.value
  const assigneeId = interaction.data?.options?.find(o => o.name === '담당자')?.value

  if (!channelId || !appId || !interactionToken || !content) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '할 일 내용을 입력해주세요.', flags: 64 },
    })
  }

  fetch(`${baseUrl}/api/discord/interactions/todo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'create',
      channelId,
      appId,
      interactionToken,
      content,
      assigneeId,
    }),
  }).catch(err => console.error('[Interactions] 투두 트리거 실패:', err))

  return NextResponse.json({ type: DEFERRED_CHANNEL_MESSAGE })
}

// ── /회의시작 — 미완료 투두 리마인드 + 회의 시작 ──

function handleMeetingStartCommand(interaction: {
  channel_id?: string
  token?: string
  application_id?: string
  data?: { options?: { name: string; value: string }[] }
}, baseUrl: string) {
  const channelId = interaction.channel_id
  const appId = interaction.application_id ?? process.env.DISCORD_APP_ID
  const interactionToken = interaction.token
  const agenda = interaction.data?.options?.find(o => o.name === '안건')?.value

  if (!channelId || !appId || !interactionToken) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '채널 정보를 찾을 수 없습니다.', flags: 64 },
    })
  }

  fetch(`${baseUrl}/api/discord/interactions/todo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'meeting-start',
      channelId,
      appId,
      interactionToken,
      agenda,
    }),
  }).catch(err => console.error('[Interactions] 회의시작 트리거 실패:', err))

  return NextResponse.json({ type: DEFERRED_CHANNEL_MESSAGE })
}

// ── /한줄 — 한줄 근황 체크인 ──

function handleOneLineCommand(interaction: {
  member?: { user?: { id: string; username: string } }
  user?: { id: string; username: string }
  data?: { options?: { name: string; value: string }[] }
}) {
  const userId = interaction.member?.user?.id ?? interaction.user?.id
  const content = interaction.data?.options?.find(o => o.name === '내용')?.value

  if (!content) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '내용을 입력해주세요.', flags: 64 },
    })
  }

  const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  const mention = userId ? `<@${userId}>` : '(알 수 없음)'

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: `💬 **한줄 체크인** — ${mention} · ${today}\n${content}`,
    },
  })
}

// ── 버튼 클릭 처리 ──

function handleButtonClick(interaction: {
  data?: { custom_id?: string }
  channel_id?: string
  token?: string
  application_id?: string
  message?: { id?: string; content?: string }
}) {
  const customId = interaction.data?.custom_id
  const channelId = interaction.channel_id
  const messageId = interaction.message?.id

  // bot_interventions에 사용자 응답 기록
  if (messageId) {
    const isAccept = customId !== 'quick_dismiss'
    const supabase = createAdminClient()
    supabase
      .from('bot_interventions')
      .update({ user_response: isAccept ? 'accepted' : 'dismissed' })
      .eq('bot_message_id', messageId)
      .then(({ error }) => {
        if (error) console.error('[Button] intervention 응답 저장 실패:', error.message)
      })
  }

  // "아니요" 버튼 — 메시지를 "취소됨"으로 업데이트
  if (customId === 'quick_dismiss') {
    return NextResponse.json({
      type: UPDATE_MESSAGE,
      data: { content: '~~취소됨~~', components: [] },
    })
  }

  // "네" — 일정 잡기: 원본 메시지 정리 + 새 메시지로 투표 생성
  if (customId === 'quick_schedule_yes' && channelId) {
    // after(): Vercel에서 응답 반환 후에도 실행 보장
    after(async () => {
      try {
        const { sendChannelMessage } = await import('@/src/lib/discord/client')
        const { addReaction } = await import('@/src/lib/discord/bot/discord-actions')

        const msg = await sendChannelMessage(
          channelId,
          '📅 **일정 조율**\n\n가능한 요일에 반응해주세요!\n1️⃣ 월  2️⃣ 화  3️⃣ 수  4️⃣ 목  5️⃣ 금\n\n시간대까지 조율하려면 → https://when2meet.com',
        )

        if (msg?.id) {
          for (const emoji of ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']) {
            await addReaction(channelId, msg.id, emoji)
          }
        }
      } catch (err) {
        console.error('[Button] 일정 투표 생성 실패:', err)
      }
    })

    return NextResponse.json({
      type: UPDATE_MESSAGE,
      data: { content: '📅 일정 투표를 만들었습니다!', components: [] },
    })
  }

  // "네" — 이벤트 등록: 원본 메시지 위 대화에서 날짜/시간 추출 → Scheduled Event
  if (customId === 'quick_event_yes' && channelId) {
    after(async () => {
      try {
        const { fetchChannelMessages, sendChannelMessage } = await import('@/src/lib/discord/client')
        const { createScheduledEvent } = await import('@/src/lib/discord/bot/discord-actions')

        // 최근 메시지 10개에서 날짜/시간 추출
        const messages = await fetchChannelMessages(channelId, { maxMessages: 10 })
        if (!messages || messages.length === 0) return

        const conversation = messages
          .slice(-10)
          .map((m: { author: { username?: string }; content: string }) =>
            `${m.author.username}: ${m.content}`
          )
          .join('\n')

        // Gemini로 날짜/시간 추출
        const { chatModel } = await import('@/src/lib/ai/gemini-client')
        const result = await chatModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: `다음 대화에서 확정된 모임 날짜와 시간을 추출하세요.\n\n${conversation}` }] }],
          systemInstruction: `JSON으로만 응답하세요. 오늘은 ${new Date().toISOString().slice(0, 10)} 입니다.\n{"title":"모임 제목","date":"YYYY-MM-DD","time":"HH:MM","duration_hours":2}\ntime을 모르면 "19:00"으로 기본값을 사용하세요.`,
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
        })

        const parsed = JSON.parse(result.response.text())
        const startTime = new Date(`${parsed.date}T${parsed.time}:00+09:00`) // KST

        // guild_id 조회 (채널에서)
        const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN ?? ''
        const channelRes = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
          headers: { Authorization: `Bot ${BOT_TOKEN}` },
        })
        const channelData = await channelRes.json() as { guild_id?: string }
        const guildId = channelData.guild_id

        if (!guildId) return

        const event = await createScheduledEvent(
          guildId,
          parsed.title || '팀 모임',
          startTime,
          new Date(startTime.getTime() + (parsed.duration_hours || 2) * 60 * 60 * 1000),
        )

        if (event?.id) {
          await sendChannelMessage(
            channelId,
            `✅ **${parsed.title || '팀 모임'}** 이벤트가 등록되었습니다!\n📅 ${parsed.date} ${parsed.time} (KST)`,
          )
        }
      } catch (err) {
        console.error('[Button] 이벤트 생성 실패:', err)
      }
    })

    return NextResponse.json({
      type: UPDATE_MESSAGE,
      data: { content: '📅 이벤트를 등록하고 있습니다...', components: [] },
    })
  }

  // "네" — 투표 만들기
  if (customId === 'quick_vote_yes') {
    return NextResponse.json({
      type: UPDATE_MESSAGE,
      data: {
        content: '📊 `/투표 주제 옵션1 옵션2` 명령어로 투표를 만들어주세요!',
        components: [],
      },
    })
  }

  // "네" — 도움 요청
  if (customId === 'quick_help_yes') {
    return NextResponse.json({
      type: UPDATE_MESSAGE,
      data: {
        content: '🆘 팀원들에게 알림을 보냈습니다! 도움을 줄 수 있는 분은 이 스레드에 답변해주세요.',
        components: [],
      },
    })
  }

  // "네" — 리마인드
  if (customId === 'quick_remind_yes') {
    return NextResponse.json({
      type: UPDATE_MESSAGE,
      data: {
        content: '🔔 리마인드를 보냈습니다! 답변 부탁드립니다.',
        components: [],
      },
    })
  }

  // 알 수 없는 버튼
  return NextResponse.json({
    type: UPDATE_MESSAGE,
    data: { components: [] },
  })
}

// ── /도움 — 명령어 안내 ──

function handleHelpCommand() {
  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: `📖 **Draft 봇 명령어**\n\n**회의:**\n• \`/회의시작\` — 미완료 할 일 리마인드 + 회의 시작\n• \`/마무리\` — 대화 요약 (AI가 할 일·결정사항·자료 정리)\n\n**일상:**\n• \`/투두 내용 [담당자]\` — 할 일 등록 (✅로 완료 체크)\n• \`/한줄 내용\` — 한줄 근황 공유\n• \`/투표 주제 옵션1 옵션2\` — 투표 생성\n• \`/일정 [목적]\` — 요일별 일정 투표\n\n**기타:**\n• \`/profile [@유저]\` — Draft 프로필 조회\n• \`/설정\` — Draft 웹 설정 페이지`,
      flags: 64, // EPHEMERAL
    },
  })
}
