import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
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

// Discord Interaction Response Types
const PONG = 1
const CHANNEL_MESSAGE = 4
const DEFERRED_CHANNEL_MESSAGE = 5 // "봇이 생각 중..." → 나중에 followup

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

  // 디버그: 환경변수 로드 확인
  console.log(`[Discord Interactions] PUBLIC_KEY loaded: ${APP_PUBLIC_KEY ? APP_PUBLIC_KEY.substring(0, 8) + '...' : 'EMPTY'}, sig: ${signature.substring(0, 8)}..., timestamp: ${timestamp}`)

  // 1. 서명 검증 (Discord 필수)
  const isValid = verifyDiscordSignature(body, signature, timestamp)
  if (!isValid) {
    console.log('[Discord Interactions] Signature verification FAILED')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  console.log('[Discord Interactions] Signature verification OK')

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
  const guildId = interaction.guild_id
  const appId = interaction.application_id ?? process.env.DISCORD_APP_ID
  const interactionToken = interaction.token

  if (!channelId || !interactionToken || !appId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '채널 정보를 찾을 수 없습니다.', flags: 64 },
    })
  }

  // 별도 API 호출로 백그라운드 처리 트리거
  // Vercel Serverless는 응답 후 fire-and-forget이 동작하지 않으므로,
  // 별도 serverless 함수를 호출하여 처리
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://dailydraft.me')

  fetch(`${baseUrl}/api/discord/interactions/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channelId, guildId, appId, interactionToken }),
  }).catch((err) => console.error('[Interactions] 마무리 트리거 실패:', err))

  return NextResponse.json({ type: DEFERRED_CHANNEL_MESSAGE })
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
