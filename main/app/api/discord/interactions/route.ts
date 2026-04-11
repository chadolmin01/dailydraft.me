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
 */

// Discord Interaction Types
const PING = 1
const APPLICATION_COMMAND = 2

// Discord Interaction Response Types
const PONG = 1
const CHANNEL_MESSAGE = 4

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
