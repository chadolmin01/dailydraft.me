import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'

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

// Discord Interaction Response Types
const PONG = 1
const CHANNEL_MESSAGE = 4
const DEFERRED_CHANNEL_MESSAGE = 5 // "봇이 생각 중..." → 나중에 followup

const APP_PUBLIC_KEY = process.env.DISCORD_APP_PUBLIC_KEY ?? ''

/**
 * Ed25519 서명 검증 (Discord 필수 요구사항)
 * Web Crypto API 사용 — 별도 패키지 불필요
 */
async function verifyDiscordSignature(
  body: string,
  signature: string,
  timestamp: string
): Promise<boolean> {
  if (!APP_PUBLIC_KEY) return false

  try {
    const keyData = hexToUint8Array(APP_PUBLIC_KEY)
    const key = await crypto.subtle.importKey(
      'raw',
      keyData.buffer as ArrayBuffer,
      { name: 'Ed25519', namedCurve: 'Ed25519' },
      false,
      ['verify']
    )

    const message = new TextEncoder().encode(timestamp + body)
    const sig = hexToUint8Array(signature)

    return await crypto.subtle.verify('Ed25519', key, sig.buffer as ArrayBuffer, message.buffer as ArrayBuffer)
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
  const isValid = await verifyDiscordSignature(body, signature, timestamp)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const interaction = JSON.parse(body)

  // 2. PING → PONG (Discord 엔드포인트 등록 시 검증용)
  if (interaction.type === PING) {
    return NextResponse.json({ type: PONG })
  }

  // 3. 슬래시 커맨드 처리
  if (interaction.type === APPLICATION_COMMAND) {
    const commandName = interaction.data?.name

    if (commandName === 'profile') {
      return handleProfileCommand(interaction)
    }

    if (commandName === '마무리') {
      return handleSummaryCommand(interaction)
    }

    if (commandName === '투표') {
      return handleVoteCommand(interaction)
    }

    if (commandName === '일정') {
      return handleScheduleCommand(interaction)
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://draft.im'

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
}) {
  const channelId = interaction.channel_id
  const appId = interaction.application_id ?? process.env.DISCORD_APP_ID

  if (!channelId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '채널 정보를 찾을 수 없습니다.', flags: 64 },
    })
  }

  // Deferred 응답: Discord에 "봇이 생각 중..." 표시
  // 3초 이내에 응답해야 하므로, AI 분석은 백그라운드에서 처리
  const interactionToken = interaction.token

  // 백그라운드에서 실제 요약 수행 (fire-and-forget)
  if (interactionToken && appId) {
    processSummaryInBackground(channelId, appId, interactionToken).catch(
      (err) => console.error('[Interactions] 마무리 백그라운드 실패:', err)
    )
  }

  return NextResponse.json({ type: DEFERRED_CHANNEL_MESSAGE })
}

/**
 * Deferred 응답 후 실제 요약을 처리하고 followup 메시지로 전송
 */
async function processSummaryInBackground(
  channelId: string,
  appId: string,
  interactionToken: string
) {
  const { fetchChannelMessages } = await import('@/src/lib/discord/client')

  // 최근 50개 메시지 가져오기
  const messages = await fetchChannelMessages(channelId, { maxMessages: 50 })

  if (!messages || messages.length < 3) {
    await sendFollowup(appId, interactionToken, '📝 정리할 내용이 충분하지 않습니다.')
    return
  }

  // 봇 메시지 제외, 실제 대화만 추출
  const humanMessages = messages
    .filter((m: { author: { bot?: boolean } }) => !m.author.bot)
    .reverse() // 시간순

  if (humanMessages.length < 3) {
    await sendFollowup(appId, interactionToken, '📝 정리할 내용이 충분하지 않습니다.')
    return
  }

  // 대화 텍스트 조합
  const conversationText = humanMessages
    .map((m: { author: { username: string }; content: string }) => `${m.author.username}: ${m.content}`)
    .join('\n')

  // Gemini로 요약 생성
  const { chatModel } = await import('@/src/lib/ai/gemini-client')
  const summaryPrompt = `다음은 Discord 팀 채널의 최근 대화입니다. 이 대화를 분석하여 아래 형식으로 한국어로 정리해주세요.

## 📋 대화 요약
(2-3문장으로 핵심 내용 요약)

## ✅ 할 일
(감지된 할 일 목록. 없으면 "감지된 할 일 없음")

## 🎯 결정사항
(합의된 결정 목록. 없으면 "결정사항 없음")

## 🔗 공유된 자료
(공유된 링크나 파일. 없으면 "공유 자료 없음")

---
대화 내용:
${conversationText}`

  try {
    const result = await chatModel.generateContent(summaryPrompt)
    const summary = result.response.text()
    await sendFollowup(appId, interactionToken, summary)
  } catch (err) {
    console.error('[Interactions] 요약 생성 실패:', err)
    await sendFollowup(appId, interactionToken, '요약 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
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

// ── /투표 — 투표 생성 ──

function handleVoteCommand(interaction: {
  data?: { options?: { name: string; value: string }[] }
}) {
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

  const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']
  const optionLines = optionValues
    .map((opt, i) => `${emojis[i]} ${opt}`)
    .join('\n')

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: `📊 **${topic}**\n\n${optionLines}\n\n_아래 반응을 눌러 투표해주세요!_`,
    },
  })
}

// ── /일정 — 일정 조율 ──

function handleScheduleCommand(interaction: {
  data?: { options?: { name: string; value: string }[] }
}) {
  const purpose = interaction.data?.options?.find((o) => o.name === '목적')?.value

  const header = purpose
    ? `📅 **일정 조율 — ${purpose}**`
    : '📅 **일정 조율**'

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: `${header}\n\n가능한 요일에 반응해주세요!\n1️⃣ 월  2️⃣ 화  3️⃣ 수  4️⃣ 목  5️⃣ 금\n\n복잡한 경우 When2Meet을 사용하세요:\n🔗 https://when2meet.com`,
    },
  })
}

// ── /설정 — Draft 웹 설정 링크 ──

function handleSettingsCommand(interaction: {
  guild_id?: string
}) {
  const guildId = interaction.guild_id
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://draft.im'

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: `⚙️ **Discord 연동 설정**\n\n아래 링크에서 설정을 변경할 수 있습니다:\n🔗 ${appUrl}/clubs/${guildId}/settings/discord\n\n설정 항목:\n• 채널-프로젝트 매핑\n• AI 톤 (합쇼체/해요체/English)\n• 체크인/초안 생성 스케줄\n• 외부 도구 연동 (GitHub, Notion 등)\n• 승인 권한`,
      flags: 64, // EPHEMERAL
    },
  })
}

// ── /도움 — 명령어 안내 ──

function handleHelpCommand() {
  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: `📖 **Draft 봇 명령어**\n\n**슬래시 커맨드:**\n• \`/마무리\` — 지금까지 대화 요약\n• \`/투표\` — 투표 생성 (주제 + 옵션)\n• \`/일정\` — 요일 투표 + When2Meet 안내\n• \`/설정\` — Draft 웹 설정 페이지 링크\n• \`/도움\` — 이 안내 메시지\n\n**자동 감지:**\n• 투표/결정 제안 시 → 투표 버튼 제공\n• 블로커/막힘 감지 → 도움 제안\n• 대화 종결 시 → 회의 요약 자동 생성`,
      flags: 64, // EPHEMERAL
    },
  })
}
