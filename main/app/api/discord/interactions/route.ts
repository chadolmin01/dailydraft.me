import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { APP_URL } from '@/src/constants'
import nacl from 'tweetnacl'
import {
  buildTodoModal,
  buildVoteModal,
  buildOneLineModal,
  buildScheduleModal,
  buildMeetingStartModal,
  buildTodoAssigneeSelect,
} from '@/src/lib/discord/bot/modals'
import {
  generateStateKey,
  setTodoDraft,
  getTodoDraft,
  clearTodoDraft,
} from '@/src/lib/discord/bot/modal-state'

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
 * - /github — GitHub 레포 연동 관리 (연결/목록/해제/내계정)
 * - /설정 — Draft 웹 설정 링크
 * - /도움 — 명령어 안내
 */

// Discord Interaction Types
const PING = 1
const APPLICATION_COMMAND = 2
const MESSAGE_COMPONENT = 3 // 버튼/Select 클릭
const MODAL_SUBMIT = 5 // Modal 제출

// Discord Interaction Response Types
const PONG = 1
const CHANNEL_MESSAGE = 4
const DEFERRED_CHANNEL_MESSAGE = 5 // "봇이 생각 중..." → 나중에 followup
const UPDATE_MESSAGE = 7 // 원본 메시지 수정 (버튼 제거 등)
// 9 = MODAL (modals.ts의 build*Modal 함수가 직접 반환)

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

  // 3. 버튼 클릭 + Select 처리
  if (interaction.type === MESSAGE_COMPONENT) {
    return handleButtonClick(interaction)
  }

  // 3-1. Modal 제출 처리
  if (interaction.type === MODAL_SUBMIT) {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : APP_URL
    return handleModalSubmit(interaction, baseUrl)
  }

  // 4. 슬래시 커맨드 처리
  if (interaction.type === APPLICATION_COMMAND) {
    const commandName = interaction.data?.name
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : APP_URL

    if (commandName === 'profile' || commandName === '프로필') {
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

    if (commandName === '연결') {
      return handleConnectCommand(interaction)
    }

    if (commandName === 'github') {
      return handleGitHubCommand(interaction)
    }

    if (commandName === '개발현황') {
      return handleDevStatusCommand(interaction)
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

  // after(): 응답 반환 후에도 fetch 완료를 보장 (Vercel Serverless 필수)
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
  // launcher_* / todo_* 같은 UI 액션은 intervention 수락/거절과 무관하므로 스킵
  const isIntervention = customId?.startsWith('quick_') ?? false
  if (messageId && isIntervention) {
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

  // ── 번들 승인 버튼 ──
  // custom_id: `bundle_approve:<bundleId>` (R3.1)
  // 원클릭 승인 → approveBundle(). 거절은 웹에서만 (모바일 Discord 모달 부적합).
  if (customId?.startsWith('bundle_approve:')) {
    return handleBundleApproveButton(interaction, customId)
  }

  // ── 멘션 런처 버튼 처리 ──
  // @Draft 멘션 메뉴에서 버튼 클릭 → Modal 열기 또는 기존 슬래시 핸들러 위임
  if (customId?.startsWith('launcher_')) {
    return handleLauncherButton(interaction, customId)
  }

  // 투두 2단계: Modal 제출 후 담당자 Select / "담당자 없이 등록" 버튼
  if (customId?.startsWith('todo_assignee:') || customId?.startsWith('todo_no_assignee:')) {
    return handleTodoAssigneeSelection(interaction, customId)
  }

  // "전체 커밋 보기" 버튼 — 커밋 단위 상세 로그 followup
  if (customId?.startsWith('dev_status_detail:')) {
    const clubIdFromButton = customId.split(':')[1]
    const appId = interaction.application_id ?? process.env.DISCORD_APP_ID
    const interactionToken = interaction.token

    if (appId && interactionToken) {
      after(async () => {
        try {
          const admin = createAdminClient()
          const todayStart = new Date()
          todayStart.setHours(0, 0, 0, 0)

          let query = admin
            .from('github_events')
            .select('pusher_github_username, repo_name, branch, commits, created_at')
            .gte('created_at', todayStart.toISOString())
            .order('created_at', { ascending: true })

          if (clubIdFromButton && clubIdFromButton !== 'all') {
            query = query.eq('club_id', clubIdFromButton)
          }

          const { data: events } = await query
          const followupUrl = `https://discord.com/api/v10/webhooks/${appId}/${interactionToken}`

          if (!events || events.length === 0) {
            await fetch(followupUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: '오늘 커밋 내역이 없습니다.', flags: 64 }),
            })
            return
          }

          // 커밋별 시간순 로그 (커밋 자체의 timestamp 사용)
          // GitHub commit.timestamp는 개별 커밋 시각, created_at은 push 시각이라 다름
          type CommitWithMeta = { time: Date; pusher: string; repo: string; msg: string }
          const allCommits: CommitWithMeta[] = []

          for (const ev of events) {
            const commits = (ev.commits ?? []) as { message: string; id: string; timestamp?: string }[]
            const repoShort = ev.repo_name.split('/')[1] || ev.repo_name

            for (const c of commits) {
              allCommits.push({
                time: c.timestamp ? new Date(c.timestamp) : new Date(ev.created_at),
                pusher: ev.pusher_github_username,
                repo: repoShort,
                msg: c.message.split('\n')[0],
              })
            }
          }

          // 시간순 정렬
          allCommits.sort((a, b) => a.time.getTime() - b.time.getTime())

          const lines: string[] = ['**전체 커밋 로그**', '']
          for (const c of allCommits) {
            const time = c.time.toLocaleTimeString('ko-KR', {
              hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul',
            })
            lines.push(`\`${time}\` **${c.pusher}** · ${c.repo}`)
            lines.push(`  ${c.msg}`)
          }

          // Discord 메시지 2000자 제한 대응
          let content = lines.join('\n')
          if (content.length > 1900) {
            content = content.slice(0, 1900) + '\n\n-# ... 이하 생략'
          }

          await fetch(followupUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, flags: 64 }),
          })
        } catch (err) {
          console.error('[Button] 개발현황 상세 실패:', err)
        }
      })
    }

    // 버튼 텍스트를 "확인됨"으로 변경
    return NextResponse.json({
      type: UPDATE_MESSAGE,
      data: {
        content: interaction.message?.content ?? '',
        components: [{
          type: 1,
          components: [{
            type: 2,
            style: 2,
            label: '전체 커밋 보기 (로딩 중...)',
            custom_id: 'dev_status_detail_done',
            disabled: true,
          }],
        }],
      },
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
  // 2026-04-18: Gemini 호출 제거. chrono-node 룰 기반으로 전환.
  //   이유: 지연 3초→50ms, 호출 비용 0, 장애 의존도 제거. 해석 실패 시 대화에 안내 메시지.
  //   환경변수 DISABLE_AI_DATE_PARSE=false 로 설정하면 Gemini fallback 재활성화 가능.
  if (customId === 'quick_event_yes' && channelId) {
    after(async () => {
      try {
        const { fetchChannelMessages, sendChannelMessage } = await import('@/src/lib/discord/client')
        const { createScheduledEvent } = await import('@/src/lib/discord/bot/discord-actions')
        const { parseKoreanDate } = await import('@/src/lib/discord/bot/date-parser')

        // 최근 메시지 10개에서 날짜/시간 추출
        const messages = await fetchChannelMessages(channelId, { maxMessages: 10 })
        if (!messages || messages.length === 0) return

        // 마지막 메시지부터 역순으로 parse 시도 — 가장 최근 확정 표현이 정답
        let startTime: Date | null = null
        let title: string | undefined
        for (const m of [...messages].reverse()) {
          const text = m.content ?? ''
          if (!text) continue
          const parsed = parseKoreanDate(text)
          if (parsed) {
            startTime = parsed
            // 제목 추정: 이 메시지에서 날짜/시간 표현을 제거한 앞부분 40자
            title = text.replace(/내일|모레|오늘|오후|오전|\d+\s*[:시]\s*\d*\s*분?|\d+월\s*\d+일|[월화수목금토일]요일|이번\s*주|다음\s*주/g, '').trim().slice(0, 40)
            break
          }
        }

        if (!startTime) {
          // 파싱 실패 — 사용자에게 수동 지정 유도
          await sendChannelMessage(
            channelId,
            '📅 일정을 자동으로 인식하지 못했습니다. `@Draft` → [일정] 버튼으로 직접 만들어주세요.',
          )
          return
        }

        // guild_id 조회 (채널에서)
        const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN ?? ''
        const channelRes = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
          headers: { Authorization: `Bot ${BOT_TOKEN}` },
        })
        const channelData = await channelRes.json() as { guild_id?: string }
        const guildId = channelData.guild_id

        if (!guildId) return

        const eventTitle = title && title.length > 0 ? title : '팀 모임'
        const event = await createScheduledEvent(
          guildId,
          eventTitle,
          startTime,
          new Date(startTime.getTime() + 2 * 60 * 60 * 1000), // 기본 2시간
        )

        if (event?.id) {
          const kstDate = startTime.toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul',
            month: 'long',
            day: 'numeric',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })
          await sendChannelMessage(
            channelId,
            `✅ **${eventTitle}** 이벤트가 등록되었습니다!\n📅 ${kstDate} (KST)`,
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

  // "네" — 투표 만들기 (런처 Modal 안내)
  if (customId === 'quick_vote_yes') {
    return NextResponse.json({
      type: UPDATE_MESSAGE,
      data: {
        content: '📊 `@Draft` 멘션 → [투표] 버튼을 눌러서 만들어주세요!',
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

// ── 멘션 런처 버튼 → Modal 열기 or 기존 핸들러 위임 ──
// 이유 주석:
//   Modal을 열려면 interaction 응답이 3초 안에 type 9 JSON으로 와야 합니다.
//   DB 조회가 필요한 핸들러(summary/devstatus)는 이미 DEFERRED 패턴을 사용하므로 그대로 위임.

function handleLauncherButton(interaction: any, customId: string) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : APP_URL

  switch (customId) {
    case 'launcher_todo':
      return NextResponse.json(buildTodoModal())
    case 'launcher_vote':
      return NextResponse.json(buildVoteModal())
    case 'launcher_oneline':
      return NextResponse.json(buildOneLineModal())
    case 'launcher_schedule':
      return NextResponse.json(buildScheduleModal())
    case 'launcher_meeting':
      return NextResponse.json(buildMeetingStartModal())
    case 'launcher_summary':
      return handleSummaryCommand(interaction, baseUrl)
    case 'launcher_devstatus':
      return handleDevStatusCommand(interaction)
    case 'launcher_settings':
      return handleSettingsCommand(interaction)
    default:
      return NextResponse.json({
        type: CHANNEL_MESSAGE,
        data: { content: '알 수 없는 메뉴입니다.', flags: 64 },
      })
  }
}

/**
 * 번들 승인 버튼 핸들러 (R3.1)
 *
 * custom_id: `bundle_approve:<bundleId>`
 * 흐름:
 *   1) DEFERRED_UPDATE_MESSAGE로 즉시 응답 (3초 제한 회피)
 *   2) Discord user_id → profile.user_id 매핑
 *   3) can_edit_persona RPC로 권한 체크
 *   4) approveBundle() 실행
 *   5) 원본 메시지를 "✅ 승인 완료"로 업데이트
 *
 * 거절은 웹 UI에서 처리 (모바일 Discord 모달에 긴 사유 입력은 UX 열악).
 */
async function handleBundleApproveButton(interaction: any, customId: string) {
  const bundleId = customId.slice('bundle_approve:'.length)
  const discordUserId: string | undefined =
    interaction.member?.user?.id ?? interaction.user?.id
  const appId = interaction.application_id ?? process.env.DISCORD_APP_ID
  const interactionToken = interaction.token

  after(async () => {
    if (!appId || !interactionToken) return

    try {
      const supabase = createAdminClient()

      // 번들 조회
      const { data: bundle } = await supabase
        .from('persona_output_bundles')
        .select('id, persona_id, status')
        .eq('id', bundleId)
        .maybeSingle<{ id: string; persona_id: string; status: string }>()

      if (!bundle) {
        await editOriginalInteractionMessage(
          appId,
          interactionToken,
          '❌ 번들을 찾을 수 없습니다.',
        )
        return
      }
      if (bundle.status === 'approved' || bundle.status === 'published') {
        await editOriginalInteractionMessage(
          appId,
          interactionToken,
          '✅ 이미 승인된 번들입니다.',
        )
        return
      }

      // Discord user → Draft profile 매핑
      let draftUserId: string | null = null
      if (discordUserId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('discord_user_id', discordUserId)
          .maybeSingle<{ user_id: string }>()
        draftUserId = profile?.user_id ?? null
      }

      if (!draftUserId) {
        await editOriginalInteractionMessage(
          appId,
          interactionToken,
          '❌ Discord 계정이 Draft 프로필과 연결되어 있지 않습니다. /프로필 연결 후 다시 시도하세요.',
        )
        return
      }

      // 권한 체크 (RLS 정책과 동일 로직)
      const { data: canEdit } = await supabase.rpc('can_edit_persona', {
        p_persona_id: bundle.persona_id,
        p_user_id: draftUserId,
      })
      if (!canEdit) {
        await editOriginalInteractionMessage(
          appId,
          interactionToken,
          '❌ 이 번들을 승인할 권한이 없습니다. (동아리 대표/운영진만 가능)',
        )
        return
      }

      // 승인 실행
      const { approveBundle } = await import('@/src/lib/personas/bundles')
      await approveBundle(supabase, bundleId, draftUserId)

      await editOriginalInteractionMessage(
        appId,
        interactionToken,
        '✅ **번들 승인 완료**\n자동 발행 가능 채널은 발행되었습니다.',
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[bundle_approve] 실패:', msg)
      if (appId && interactionToken) {
        await editOriginalInteractionMessage(
          appId,
          interactionToken,
          `❌ 승인 실패: ${msg}`,
        ).catch(() => {})
      }
    }
  })

  // DEFERRED_UPDATE_MESSAGE (type=6) — 3초 내 즉시 응답
  return NextResponse.json({ type: 6 })
}

/**
 * interaction 원본 메시지를 Discord Webhook API로 수정.
 * after() 블록에서 호출됨.
 */
async function editOriginalInteractionMessage(
  appId: string,
  token: string,
  content: string,
): Promise<void> {
  await fetch(
    `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, components: [] }),
    },
  )
}

// ── 투두 2단계: USER_SELECT 또는 "담당자 없이 등록" 버튼 처리 ──

function handleTodoAssigneeSelection(interaction: any, customId: string) {
  const [prefix, stateKey] = customId.split(':')
  const draft = getTodoDraft(stateKey)

  if (!draft) {
    return NextResponse.json({
      type: UPDATE_MESSAGE,
      data: {
        content: '⚠️ 세션이 만료되었습니다. `@Draft`에서 다시 시도해주세요.',
        components: [],
      },
    })
  }

  // USER_SELECT: interaction.data.values = ['<userId>']
  const assigneeId: string | undefined =
    prefix === 'todo_assignee' ? interaction.data?.values?.[0] : undefined

  clearTodoDraft(stateKey)

  const appId = interaction.application_id ?? process.env.DISCORD_APP_ID
  const interactionToken = interaction.token
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : APP_URL

  // 백그라운드에서 투두 메시지 생성 (기존 /api/discord/interactions/todo 재활용)
  after(async () => {
    try {
      await fetch(`${baseUrl}/api/discord/interactions/todo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'create',
          channelId: draft.channelId,
          appId,
          interactionToken,
          content: draft.deadline
            ? `${draft.content} (마감: ${draft.deadline})`
            : draft.content,
          assigneeId,
        }),
      })
    } catch (err) {
      console.error('[Launcher] 투두 생성 실패:', err)
    }
  })

  return NextResponse.json({
    type: UPDATE_MESSAGE,
    data: {
      content: assigneeId
        ? `📌 할 일을 등록하고 있습니다... (담당: <@${assigneeId}>)`
        : '📌 할 일을 등록하고 있습니다...',
      components: [],
    },
  })
}

// ── Modal 제출 핸들러 ──

function handleModalSubmit(interaction: any, baseUrl: string) {
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
        data: { content: '알 수 없는 Modal입니다.', flags: 64 },
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

// ── Modal 제출: 투두 (담당자 Select로 이어짐) ──

function handleTodoModalSubmit(interaction: any) {
  const content = getModalField(interaction, 'content')
  const deadline = getModalField(interaction, 'deadline') || null

  if (!content) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '내용을 입력해주세요.', flags: 64 },
    })
  }

  const channelId = interaction.channel_id
  const guildId = interaction.guild_id
  const requesterId = interaction.member?.user?.id ?? interaction.user?.id

  if (!channelId || !requesterId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '요청을 처리할 수 없습니다.', flags: 64 },
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
      flags: 64, // EPHEMERAL — 본인만 보임
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

// ── Modal 제출: 일정 조율 (기존 /api/discord/interactions/poll 재활용) ──

function handleScheduleModalSubmit(interaction: any, baseUrl: string) {
  const purpose = getModalField(interaction, 'purpose') || undefined

  const channelId = interaction.channel_id
  const appId = interaction.application_id ?? process.env.DISCORD_APP_ID
  const interactionToken = interaction.token

  if (!channelId || !appId || !interactionToken) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '채널 정보를 찾을 수 없습니다.', flags: 64 },
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

// ── Modal 제출: 회의시작 (기존 /api/discord/interactions/todo의 meeting-start 재활용) ──

function handleMeetingModalSubmit(interaction: any, baseUrl: string) {
  const agenda = getModalField(interaction, 'agenda') || undefined

  const channelId = interaction.channel_id
  const appId = interaction.application_id ?? process.env.DISCORD_APP_ID
  const interactionToken = interaction.token

  if (!channelId || !appId || !interactionToken) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '채널 정보를 찾을 수 없습니다.', flags: 64 },
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

// ── /연결 — Draft 계정 연결 안내 ──

async function handleConnectCommand(interaction: {
  member?: { user?: { id: string; username: string } }
  user?: { id: string; username: string }
}) {
  const discordId = interaction.member?.user?.id ?? interaction.user?.id
  const appUrl = APP_URL

  if (!discordId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '유저 정보를 찾을 수 없습니다.', flags: 64 },
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
        flags: 64,
      },
    })
  }

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: `🔗 **Draft 계정 연결하기**\n\nDiscord와 Draft를 연결하면:\n• 봇이 내 이름을 정확히 표시합니다\n• 할 일, 알림을 DM으로 받을 수 있습니다\n• 프로필 조회가 가능합니다\n\n**연결 방법:**\n1️⃣ 아래 링크로 Draft에 로그인\n2️⃣ 프로필 설정에서 "Discord 계정 연결" 클릭\n\n🔗 ${appUrl}/profile/edit`,
      flags: 64, // 본인만 보임
    },
  })
}

// ── /github — GitHub 레포 연동 관리 ──
// 채널 → 프로젝트 매핑: discord_team_channels에서 channel_id로 프로젝트를 감지하여
// 팀/프로젝트 레벨로 GitHub 연동을 관리한다. (기존 guild_id → club_id 패턴에서 전환)

/**
 * 채널 ID로 프로젝트 매핑 조회
 * discord_team_channels 테이블에서 해당 채널이 어떤 프로젝트에 연결되어 있는지 확인
 */
async function findProjectByChannel(supabase: ReturnType<typeof createAdminClient>, channelId: string) {
  const { data } = await supabase
    .from('discord_team_channels')
    .select('opportunity_id, club_id')
    .eq('discord_channel_id', channelId)
    .maybeSingle()
  return data // { opportunity_id, club_id } or null
}

async function handleGitHubCommand(interaction: {
  guild_id?: string
  channel_id?: string
  member?: { user?: { id: string } }
  user?: { id: string }
  data?: {
    options?: {
      name: string
      type: number
      options?: { name: string; value: string }[]
    }[]
  }
}) {
  // 서브커맨드 파싱 (Discord SUB_COMMAND 구조: data.options[0] = 서브커맨드)
  const subCommand = interaction.data?.options?.[0]
  const subName = subCommand?.name

  if (subName === '연결') {
    return handleGitHubConnect(interaction)
  }
  if (subName === '목록') {
    return handleGitHubList(interaction)
  }
  if (subName === '해제') {
    return handleGitHubDisconnect(interaction)
  }
  // /github 내계정은 프로필 업데이트라 프로젝트 무관 — 기존 로직 유지
  if (subName === '내계정') {
    return handleGitHubAccount(interaction)
  }

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: { content: '알 수 없는 서브커맨드입니다. `/github` 다음에 연결, 목록, 해제, 내계정 중 하나를 입력해주세요.', flags: 64 },
  })
}

// ── /github 연결 — 현재 채널의 프로젝트에 GitHub OAuth 연결 버튼 제공 ──
// channel_id → discord_team_channels에서 프로젝트 감지 → OAuth URL로 안내

async function handleGitHubConnect(interaction: {
  guild_id?: string
  channel_id?: string
  data?: {
    options?: {
      name: string
      type: number
      options?: { name: string; value: string }[]
    }[]
  }
}) {
  const channelId = interaction.channel_id

  if (!channelId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '채널 정보를 찾을 수 없습니다.', flags: 64 },
    })
  }

  const supabase = createAdminClient()

  // channel_id → 프로젝트 매핑 조회
  const project = await findProjectByChannel(supabase, channelId)

  if (!project) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: {
        content: '이 채널은 프로젝트에 연결되어 있지 않습니다. 팀 채널에서 사용해주세요.',
        flags: 64,
      },
    })
  }

  // club slug 조회 (OAuth URL에 필요)
  const { data: club } = await supabase
    .from('clubs')
    .select('slug')
    .eq('id', project.club_id)
    .single()

  const clubSlug = club?.slug ?? ''
  const appUrl = APP_URL

  // OAuth URL 생성 — opportunityId를 포함하여 프로젝트 레벨 연동
  const oauthUrl = `${appUrl}/api/github/oauth?clubId=${project.club_id}&clubSlug=${clubSlug}&opportunityId=${project.opportunity_id}`

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: '아래 버튼을 클릭하여 GitHub 계정을 연결하세요.\n레포 선택과 알림 채널 설정은 웹에서 진행됩니다.',
      flags: 64,
      components: [
        {
          type: 1, // ACTION_ROW
          components: [
            {
              type: 2, // BUTTON
              style: 5, // LINK — 외부 URL로 이동
              label: 'GitHub 연결하기',
              url: oauthUrl,
            },
          ],
        },
      ],
    },
  })
}

// ── /github 목록 — 현재 프로젝트에 연결된 레포 목록 ──

async function handleGitHubList(interaction: {
  guild_id?: string
  channel_id?: string
}) {
  const channelId = interaction.channel_id

  if (!channelId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '채널 정보를 찾을 수 없습니다.', flags: 64 },
    })
  }

  const supabase = createAdminClient()

  // channel_id → 프로젝트 매핑 조회
  const project = await findProjectByChannel(supabase, channelId)

  if (!project) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: {
        content: '이 채널은 프로젝트에 연결되어 있지 않습니다. 팀 채널에서 사용해주세요.',
        flags: 64,
      },
    })
  }

  // 이 프로젝트에 연결된 GitHub 레포만 조회
  const { data: connectors } = await supabase
    .from('club_harness_connectors')
    .select('display_name, enabled, created_at, credentials')
    .eq('club_id', project.club_id)
    .eq('connector_type', 'github')
    .eq('opportunity_id', project.opportunity_id)
    .order('created_at', { ascending: true })

  if (!connectors || connectors.length === 0) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: {
        content: '이 프로젝트에 연결된 GitHub 레포가 없습니다.\n`/github 연결`로 GitHub을 연결해주세요.',
        flags: 64,
      },
    })
  }

  const list = connectors
    .map((c, i) => {
      const status = c.enabled ? '🟢' : '⏸️'
      const creds = c.credentials as Record<string, unknown> | null
      const repo = creds?.repo ?? c.display_name ?? '(알 수 없음)'
      return `${i + 1}. ${status} **${repo}**`
    })
    .join('\n')

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: `**이 프로젝트에 연결된 GitHub 레포 (${connectors.length}개)**\n\n${list}`,
      flags: 64,
    },
  })
}

// ── /github 해제 repo — 현재 프로젝트에서 레포 연결 해제 ──
// channel_id → 프로젝트 감지 → opportunity_id + display_name으로 삭제
// credentials에 webhookId, accessToken이 있으면 GitHub webhook도 삭제 시도 (best-effort)

async function handleGitHubDisconnect(interaction: {
  guild_id?: string
  channel_id?: string
  data?: {
    options?: {
      name: string
      type: number
      options?: { name: string; value: string }[]
    }[]
  }
}) {
  const channelId = interaction.channel_id
  const repo = interaction.data?.options?.[0]?.options?.find(o => o.name === 'repo')?.value

  if (!channelId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '채널 정보를 찾을 수 없습니다.', flags: 64 },
    })
  }

  if (!repo) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '해제할 레포 이름을 입력해주세요. (예: `owner/repo-name`)', flags: 64 },
    })
  }

  const supabase = createAdminClient()

  // channel_id → 프로젝트 매핑 조회
  const project = await findProjectByChannel(supabase, channelId)

  if (!project) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: {
        content: '이 채널은 프로젝트에 연결되어 있지 않습니다. 팀 채널에서 사용해주세요.',
        flags: 64,
      },
    })
  }

  // 해당 프로젝트에서 레포 찾기 (display_name 또는 credentials.repo로 매칭)
  const { data: connector } = await supabase
    .from('club_harness_connectors')
    .select('id, credentials')
    .eq('club_id', project.club_id)
    .eq('connector_type', 'github')
    .eq('opportunity_id', project.opportunity_id)
    .eq('display_name', repo)
    .maybeSingle()

  if (!connector) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: {
        content: `이 프로젝트에서 **${repo}** 레포를 찾을 수 없습니다.\n\`/github 목록\`으로 연결된 레포를 확인해주세요.`,
        flags: 64,
      },
    })
  }

  // GitHub webhook 삭제 시도 (best-effort)
  // credentials에 webhookId, accessToken이 있는 경우에만 시도
  const creds = connector.credentials as Record<string, unknown> | null
  const webhookId = creds?.webhookId as string | undefined
  const accessToken = creds?.accessToken as string | undefined

  if (webhookId && accessToken && repo.includes('/')) {
    const [owner, repoName] = repo.split('/')
    try {
      const deleteRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/hooks/${webhookId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          signal: AbortSignal.timeout(10_000),
        }
      )

      if (deleteRes.ok || deleteRes.status === 404) {
        console.log(`[GitHub] webhook 삭제 완료: ${repo}`)
      } else {
        console.warn(`[GitHub] webhook 삭제 실패 (${deleteRes.status}), DB는 정리 진행`)
      }
    } catch (err) {
      console.warn('[GitHub] webhook 삭제 중 에러 (무시):', err)
    }
  }

  // DB 레코드 삭제
  const { error } = await supabase
    .from('club_harness_connectors')
    .delete()
    .eq('id', connector.id)

  if (error) {
    console.error('[GitHub] connector 삭제 실패:', error.message)
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', flags: 64 },
    })
  }

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: `**${repo}** 연결을 해제했습니다.`,
      flags: 64,
    },
  })
}

// ── /github 내계정 username — GitHub 계정을 Draft 프로필에 연결 ──

async function handleGitHubAccount(interaction: {
  member?: { user?: { id: string } }
  user?: { id: string }
  data?: {
    options?: {
      name: string
      type: number
      options?: { name: string; value: string }[]
    }[]
  }
}) {
  const discordUserId = interaction.member?.user?.id ?? interaction.user?.id
  const rawUsername = interaction.data?.options?.[0]?.options?.find(o => o.name === 'username')?.value

  if (!discordUserId) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '유저 정보를 찾을 수 없습니다.', flags: 64 },
    })
  }

  if (!rawUsername) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: 'GitHub 사용자명을 입력해주세요.', flags: 64 },
    })
  }

  // 사용자명 정규화: @ 제거, URL에서 추출, 소문자 변환
  let username = rawUsername.trim().toLowerCase()
  if (username.startsWith('@')) {
    username = username.slice(1)
  }
  // https://github.com/username 형태에서 username 추출
  const githubUrlMatch = username.match(/github\.com\/([a-zA-Z0-9_-]+)/i)
  if (githubUrlMatch) {
    username = githubUrlMatch[1].toLowerCase()
  }

  const githubUrl = `https://github.com/${username}`

  const supabase = createAdminClient()

  // discord_user_id로 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, nickname')
    .eq('discord_user_id', discordUserId)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: {
        content: 'Draft 계정이 연결되어 있지 않습니다.\n먼저 `/연결` 명령으로 Draft 계정을 연결해주세요.',
        flags: 64,
      },
    })
  }

  // github_url + github_username 동시 업데이트
  // github_url: 프로필 표시용 (전체 URL)
  // github_username: webhook pusher 매칭용 (소문자 username만)
  const { error } = await supabase
    .from('profiles')
    .update({ github_url: githubUrl, github_username: username })
    .eq('user_id', profile.user_id)

  if (error) {
    console.error('[GitHub] github_url 업데이트 실패:', error.message)
    return NextResponse.json({
      type: CHANNEL_MESSAGE,
      data: { content: '저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', flags: 64 },
    })
  }

  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: `GitHub 계정 **${username}**을(를) Draft 프로필에 연결했습니다.`,
      flags: 64,
    },
  })
}

// ── /개발현황 — 오늘의 개발 활동 로그 ──

async function handleDevStatusCommand(interaction: {
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
      data: { content: '요청을 처리할 수 없습니다.', flags: 64 },
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
            flags: 64,
          }),
        })
        return
      }

      // 사람별로 그룹핑
      const byPusher = new Map<string, { commits: number; summaries: string[]; repos: Set<string> }>()
      for (const ev of events) {
        const key = ev.pusher_github_username
        const existing = byPusher.get(key) || { commits: 0, summaries: [], repos: new Set<string>() }
        const commitCount = Array.isArray(ev.commits) ? ev.commits.length : 0
        existing.commits += commitCount
        existing.repos.add(ev.repo_name.split('/')[1] || ev.repo_name)
        if (ev.ai_summary) existing.summaries.push(ev.ai_summary)
        byPusher.set(key, existing)
      }

      const totalCommits = events.reduce((sum, ev) =>
        sum + (Array.isArray(ev.commits) ? ev.commits.length : 0), 0)

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
          flags: 64,
          components: [{
            type: 1, // ACTION_ROW
            components: [{
              type: 2, // BUTTON
              style: 2, // SECONDARY (회색)
              label: '전체 커밋 보기',
              custom_id: `dev_status_detail:${clubId ?? 'all'}`,
            }],
          }],
        }),
      })
    } catch (err) {
      console.error('[Interactions] 개발현황 처리 실패:', err)
    }
  })

  return NextResponse.json({ type: DEFERRED_CHANNEL_MESSAGE, data: { flags: 64 } })
}

// ── /도움 — 명령어 안내 ──

function handleHelpCommand() {
  return NextResponse.json({
    type: CHANNEL_MESSAGE,
    data: {
      content: `📖 **Draft 봇 명령어**\n\n**회의:**\n• \`/회의시작\` — 미완료 할 일 리마인드 + 회의 시작\n• \`/마무리\` — 대화 요약 (AI가 할 일·결정사항·자료 정리)\n\n**일상:**\n• \`/투두 내용 [담당자]\` — 할 일 등록 (✅로 완료 체크)\n• \`/한줄 내용\` — 한줄 근황 공유\n• \`/투표 주제 옵션1 옵션2\` — 투표 생성\n• \`/일정 [목적]\` — 요일별 일정 투표\n\n**개발:**\n• \`/개발현황\` — 오늘의 개발 활동 로그\n\n**GitHub 연동 (팀 채널에서 사용):**\n• \`/github 연결\` — 이 프로젝트에 GitHub 연결\n• \`/github 목록\` — 이 프로젝트의 연결된 레포 목록\n• \`/github 해제 owner/repo\` — 레포 연결 해제\n• \`/github 내계정 username\` — GitHub 계정 연결 (어디서든 사용 가능)\n\n**기타:**\n• \`/프로필 [@유저]\` — Draft 프로필 조회\n• \`/연결\` — Discord ↔ Draft 계정 연결\n• \`/설정\` — Draft 웹 설정 페이지\n• \`@Draft 질문\` — AI에게 질문`,
      flags: 64, // EPHEMERAL
    },
  })
}
