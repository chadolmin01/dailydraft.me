import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { APP_URL } from '@/src/constants'
import { CHANNEL_MESSAGE, DEFERRED_CHANNEL_MESSAGE, EPHEMERAL } from '../_constants'

// Discord slash command handler 모음.
// route.ts 에서 분리 — 각 커맨드 로직 1:1 보존.
// 모달 제출 핸들러는 `./modals.ts`, 버튼 핸들러는 `./buttons.ts`, GitHub/DevStatus 는 별도 파일.

// ── /프로필 — Draft 프로필 링크 반환 ──
export async function handleProfileCommand(interaction: {
  data?: { options?: { name: string; type: number; value: string }[] }
  member?: { user?: { id: string } }
  user?: { id: string }
}) {
  // 타겟: /profile @user 로 지정하거나, 미지정 시 본인
  const targetOption = interaction.data?.options?.find((o) => o.name === 'user')
  const targetDiscordId =
    targetOption?.value ?? interaction.member?.user?.id ?? interaction.user?.id

  if (!targetDiscordId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '유저를 찾을 수 없습니다.', flags: EPHEMERAL },
    })
  }

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
        content:
          '이 멤버는 아직 Draft에 연결되지 않았습니다.\nDraft에서 프로필을 완성해주세요!',
        flags: EPHEMERAL,
      },
    })
  }

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      embeds: [
        {
          title: `${profile.nickname}님의 프로필`,
          url: `${APP_URL}/profile/${profile.user_id}`,
          color: 0x6366f1, // indigo-500
          fields: profile.desired_position
            ? [{ name: '포지션', value: profile.desired_position, inline: true }]
            : [],
          footer: { text: 'Draft' },
        },
      ],
      flags: EPHEMERAL,
    },
  })
}

// ── /마무리 — 대화 요약 (Deferred → 백그라운드에서 AI 분석 후 followup) ──
export async function handleSummaryCommand(
  interaction: {
    channel_id?: string
    guild_id?: string
    token?: string
    application_id?: string
  },
  baseUrl: string
) {
  const channelId = interaction.channel_id
  const guildId = interaction.guild_id
  const appId = interaction.application_id ?? process.env.DISCORD_APP_ID
  const interactionToken = interaction.token

  if (!channelId || !interactionToken || !appId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '채널 정보를 찾을 수 없습니다.', flags: EPHEMERAL },
    })
  }

  // after(): 응답 반환 후에도 fetch 완료를 보장 (Vercel Serverless 필수)
  after(async () => {
    try {
      await fetch(`${baseUrl}/api/discord/interactions/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, guildId, appId, interactionToken }),
      })
    } catch (err) {
      console.error('[Interactions] 마무리 트리거 실패:', err)
    }
  })

  return NextResponse.json({ type: DEFERRED_CHANNEL_MESSAGE })
}

// ── /투표 — 투표 생성 (Deferred → 메시지 전송 후 자동 이모지 반응) ──
export function handleVoteCommand(
  interaction: {
    channel_id?: string
    token?: string
    application_id?: string
    data?: { options?: { name: string; value: string }[] }
  },
  baseUrl: string
) {
  const options = interaction.data?.options ?? []
  const topic = options.find((o) => o.name === '주제')?.value
  const optionValues = ['옵션1', '옵션2', '옵션3', '옵션4', '옵션5']
    .map((name) => options.find((o) => o.name === name)?.value)
    .filter(Boolean) as string[]

  if (!topic || optionValues.length < 2) {
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
          options: optionValues,
        }),
      })
    } catch (err) {
      console.error('[Interactions] 투표 트리거 실패:', err)
    }
  })

  return NextResponse.json({ type: DEFERRED_CHANNEL_MESSAGE })
}

// ── /일정 — 일정 조율 (Deferred → 메시지 전송 후 자동 요일 반응) ──
export function handleScheduleCommand(
  interaction: {
    channel_id?: string
    token?: string
    application_id?: string
    data?: { options?: { name: string; value: string }[] }
  },
  baseUrl: string
) {
  const channelId = interaction.channel_id
  const appId = interaction.application_id ?? process.env.DISCORD_APP_ID
  const interactionToken = interaction.token
  const purpose = interaction.data?.options?.find((o) => o.name === '목적')?.value

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
      console.error('[Interactions] 일정 트리거 실패:', err)
    }
  })

  return NextResponse.json({ type: DEFERRED_CHANNEL_MESSAGE })
}

// ── /설정 — Draft 웹 설정 링크 ──
export async function handleSettingsCommand(interaction: { guild_id?: string }) {
  const guildId = interaction.guild_id

  if (!guildId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '서버 정보를 찾을 수 없습니다.', flags: EPHEMERAL },
    })
  }

  // guild_id → club slug 조회 (URL 에 숫자 ID 가 아닌 slug 사용)
  const supabase = createAdminClient()
  const { data: installation } = await supabase
    .from('discord_bot_installations')
    .select('club_id')
    .eq('discord_guild_id', guildId)
    .maybeSingle()

  if (!installation) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: {
        content: '이 서버는 아직 Draft 클럽에 연결되지 않았습니다.',
        flags: EPHEMERAL,
      },
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
      content: `⚙️ **Discord 연동 설정**\n\n아래 링크에서 설정을 변경할 수 있습니다:\n🔗 ${APP_URL}/clubs/${clubPath}/settings/discord\n\n설정 항목:\n• 채널-프로젝트 매핑\n• AI 톤 (합쇼체/부드러운 합쇼체/English)\n• 체크인/초안 생성 스케줄\n• 외부 도구 연동 (GitHub, Notion 등)\n• 승인 권한`,
      flags: EPHEMERAL,
    },
  })
}

// ── /투두 — 할 일 등록 (Deferred → 메시지 + ✅ 반응) ──
export function handleTodoCommand(
  interaction: {
    channel_id?: string
    token?: string
    application_id?: string
    member?: { user?: { id: string } }
    user?: { id: string }
    data?: { options?: { name: string; value: string }[] }
  },
  baseUrl: string
) {
  const channelId = interaction.channel_id
  const appId = interaction.application_id ?? process.env.DISCORD_APP_ID
  const interactionToken = interaction.token
  const content = interaction.data?.options?.find((o) => o.name === '내용')?.value
  const assigneeId = interaction.data?.options?.find((o) => o.name === '담당자')?.value

  if (!channelId || !appId || !interactionToken || !content) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '할 일 내용을 입력해주세요.', flags: EPHEMERAL },
    })
  }

  after(async () => {
    try {
      await fetch(`${baseUrl}/api/discord/interactions/todo`, {
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
      })
    } catch (err) {
      console.error('[Interactions] 투두 트리거 실패:', err)
    }
  })

  return NextResponse.json({ type: DEFERRED_CHANNEL_MESSAGE })
}

// ── /회의시작 — 미완료 투두 리마인드 + 회의 시작 ──
export function handleMeetingStartCommand(
  interaction: {
    channel_id?: string
    token?: string
    application_id?: string
    data?: { options?: { name: string; value: string }[] }
  },
  baseUrl: string
) {
  const channelId = interaction.channel_id
  const appId = interaction.application_id ?? process.env.DISCORD_APP_ID
  const interactionToken = interaction.token
  const agenda = interaction.data?.options?.find((o) => o.name === '안건')?.value

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
      console.error('[Interactions] 회의시작 트리거 실패:', err)
    }
  })

  return NextResponse.json({ type: DEFERRED_CHANNEL_MESSAGE })
}

// ── /한줄 — 한줄 근황 체크인 ──
export function handleOneLineCommand(interaction: {
  member?: { user?: { id: string; username: string } }
  user?: { id: string; username: string }
  data?: { options?: { name: string; value: string }[] }
}) {
  const userId = interaction.member?.user?.id ?? interaction.user?.id
  const content = interaction.data?.options?.find((o) => o.name === '내용')?.value

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

// ── /연결 — Discord ↔ Draft 계정 연결 안내 ──
export async function handleConnectCommand(interaction: {
  member?: { user?: { id: string; username: string } }
  user?: { id: string; username: string }
}) {
  const discordId = interaction.member?.user?.id ?? interaction.user?.id

  if (!discordId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '유저 정보를 찾을 수 없습니다.', flags: EPHEMERAL },
    })
  }

  // 이미 연결됐는지 확인
  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('discord_user_id', discordId)
    .maybeSingle()

  if (profile) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: {
        content: `✅ 이미 **${profile.nickname}** 계정으로 연결되어 있습니다!`,
        flags: EPHEMERAL,
      },
    })
  }

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: `🔗 **Draft 계정 연결하기**\n\nDiscord와 Draft를 연결하면:\n• 봇이 내 이름을 정확히 표시합니다\n• 할 일, 알림을 DM으로 받을 수 있습니다\n• 프로필 조회가 가능합니다\n\n**연결 방법:**\n1️⃣ 아래 링크로 Draft에 로그인\n2️⃣ 프로필 설정에서 "Discord 계정 연결" 클릭\n\n🔗 ${APP_URL}/profile/edit`,
      flags: EPHEMERAL,
    },
  })
}

// ── /도움 — 명령어 안내 ──
export function handleHelpCommand() {
  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: `📖 **Draft 봇 명령어**\n\n**회의:**\n• \`/회의시작\` — 미완료 할 일 리마인드 + 회의 시작\n• \`/마무리\` — 대화 요약 (AI가 할 일·결정사항·자료 정리)\n\n**일상:**\n• \`/투두 내용 [담당자]\` — 할 일 등록 (✅로 완료 체크)\n• \`/한줄 내용\` — 한줄 근황 공유\n• \`/투표 주제 옵션1 옵션2\` — 투표 생성\n• \`/일정 [목적]\` — 요일별 일정 투표\n\n**개발:**\n• \`/개발현황\` — 오늘의 개발 활동 로그\n\n**GitHub 연동 (팀 채널에서 사용):**\n• \`/github 연결\` — 이 프로젝트에 GitHub 연결\n• \`/github 목록\` — 이 프로젝트의 연결된 레포 목록\n• \`/github 해제 owner/repo\` — 레포 연결 해제\n• \`/github 내계정 username\` — GitHub 계정 연결 (어디서든 사용 가능)\n\n**기타:**\n• \`/프로필 [@유저]\` — Draft 프로필 조회\n• \`/연결\` — Discord ↔ Draft 계정 연결\n• \`/설정\` — Draft 웹 설정 페이지\n• \`@Draft 질문\` — AI에게 질문`,
      flags: EPHEMERAL,
    },
  })
}
