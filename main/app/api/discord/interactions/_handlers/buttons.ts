import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { APP_URL } from '@/src/constants'
import {
  buildTodoModal,
  buildVoteModal,
  buildOneLineModal,
  buildScheduleModal,
  buildMeetingStartModal,
} from '@/src/lib/discord/bot/modals'
import { getTodoDraft, clearTodoDraft } from '@/src/lib/discord/bot/modal-state'
import { CHANNEL_MESSAGE, UPDATE_MESSAGE, EPHEMERAL } from '../_constants'
import {
  handleSummaryCommand,
  handleSettingsCommand,
} from './commands'
import { handleDevStatusCommand } from './dev-status'

// Discord 버튼/Select 인터랙션 핸들러 모음.
// route.ts 에서 분리 — handleButtonClick 디스패처 + 서브 핸들러 + editOriginalInteractionMessage util.
// 동작 1:1 보존.

// ── 버튼 클릭 처리 ──
export function handleButtonClick(interaction: {
  data?: { custom_id?: string }
  channel_id?: string
  token?: string
  application_id?: string
  message?: { id?: string; content?: string }
}) {
  const customId = interaction.data?.custom_id
  const channelId = interaction.channel_id
  const messageId = interaction.message?.id

  // bot_interventions 에 사용자 응답 기록
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
              body: JSON.stringify({ content: '오늘 커밋 내역이 없습니다.', flags: EPHEMERAL }),
            })
            return
          }

          // 커밋별 시간순 로그 (커밋 자체의 timestamp 사용)
          // GitHub commit.timestamp 는 개별 커밋 시각, created_at 은 push 시각이라 다름
          type CommitWithMeta = { time: Date; pusher: string; repo: string; msg: string }
          const allCommits: CommitWithMeta[] = []

          for (const ev of events) {
            const commits = (ev.commits ?? []) as {
              message: string
              id: string
              timestamp?: string
            }[]
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
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Seoul',
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
            body: JSON.stringify({ content, flags: EPHEMERAL }),
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
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 2,
                label: '전체 커밋 보기 (로딩 중...)',
                custom_id: 'dev_status_detail_done',
                disabled: true,
              },
            ],
          },
        ],
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
    // after(): Vercel 에서 응답 반환 후에도 실행 보장
    after(async () => {
      try {
        const { sendChannelMessage } = await import('@/src/lib/discord/client')
        const { addReaction } = await import('@/src/lib/discord/bot/discord-actions')

        const msg = await sendChannelMessage(
          channelId,
          '📅 **일정 조율**\n\n가능한 요일에 반응해주세요!\n1️⃣ 월  2️⃣ 화  3️⃣ 수  4️⃣ 목  5️⃣ 금\n\n시간대까지 조율하려면 → https://when2meet.com'
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
        const { fetchChannelMessages, sendChannelMessage } = await import(
          '@/src/lib/discord/client'
        )
        const { createScheduledEvent } = await import(
          '@/src/lib/discord/bot/discord-actions'
        )
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
            title = text
              .replace(
                /내일|모레|오늘|오후|오전|\d+\s*[:시]\s*\d*\s*분?|\d+월\s*\d+일|[월화수목금토일]요일|이번\s*주|다음\s*주/g,
                ''
              )
              .trim()
              .slice(0, 40)
            break
          }
        }

        if (!startTime) {
          // 파싱 실패 — 사용자에게 수동 지정 유도
          await sendChannelMessage(
            channelId,
            '📅 일정을 자동으로 인식하지 못했습니다. `@Draft` → [일정] 버튼으로 직접 만들어주세요.'
          )
          return
        }

        // guild_id 조회 (채널에서)
        const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN ?? ''
        const channelRes = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
          headers: { Authorization: `Bot ${BOT_TOKEN}` },
        })
        const channelData = (await channelRes.json()) as { guild_id?: string }
        const guildId = channelData.guild_id

        if (!guildId) return

        const eventTitle = title && title.length > 0 ? title : '팀 모임'
        const event = await createScheduledEvent(
          guildId,
          eventTitle,
          startTime,
          new Date(startTime.getTime() + 2 * 60 * 60 * 1000) // 기본 2시간
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
            `✅ **${eventTitle}** 이벤트가 등록되었습니다!\n📅 ${kstDate} (KST)`
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
        content:
          '🆘 팀원들에게 알림을 보냈습니다! 도움을 줄 수 있는 분은 이 스레드에 답변해주세요.',
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
//   Modal 을 열려면 interaction 응답이 3초 안에 type 9 JSON 으로 와야 합니다.
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
        data: { content: '알 수 없는 메뉴입니다.', flags: EPHEMERAL },
      })
  }
}

/**
 * 번들 승인 버튼 핸들러 (R3.1)
 *
 * custom_id: `bundle_approve:<bundleId>`
 * 흐름:
 *   1) DEFERRED_UPDATE_MESSAGE 로 즉시 응답 (3초 제한 회피)
 *   2) Discord user_id → profile.user_id 매핑
 *   3) can_edit_persona RPC 로 권한 체크
 *   4) approveBundle() 실행
 *   5) 원본 메시지를 "✅ 승인 완료"로 업데이트
 *
 * 거절은 웹 UI 에서 처리 (모바일 Discord 모달에 긴 사유 입력은 UX 열악).
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bundleRes: any = await supabase
        .from('persona_output_bundles')
        .select('id, persona_id, status')
        .eq('id', bundleId)
        .maybeSingle()
      const bundle = bundleRes.data as {
        id: string
        persona_id: string
        status: string
      } | null

      if (!bundle) {
        await editOriginalInteractionMessage(
          appId,
          interactionToken,
          '❌ 번들을 찾을 수 없습니다.'
        )
        return
      }
      if (bundle.status === 'approved' || bundle.status === 'published') {
        await editOriginalInteractionMessage(
          appId,
          interactionToken,
          '✅ 이미 승인된 번들입니다.'
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
          .maybeSingle()
        draftUserId = profile?.user_id ?? null
      }

      if (!draftUserId) {
        await editOriginalInteractionMessage(
          appId,
          interactionToken,
          '❌ Discord 계정이 Draft 프로필과 연결되어 있지 않습니다. /프로필 연결 후 다시 시도하세요.'
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
          '❌ 이 번들을 승인할 권한이 없습니다. (동아리 대표/운영진만 가능)'
        )
        return
      }

      // 승인 실행
      const { approveBundle } = await import('@/src/lib/personas/bundles')
      await approveBundle(supabase, bundleId, draftUserId)

      await editOriginalInteractionMessage(
        appId,
        interactionToken,
        '✅ **번들 승인 완료**\n자동 발행 가능 채널은 발행되었습니다.'
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[bundle_approve] 실패:', msg)
      if (appId && interactionToken) {
        await editOriginalInteractionMessage(
          appId,
          interactionToken,
          `❌ 승인 실패: ${msg}`
        ).catch(() => {})
      }
    }
  })

  // DEFERRED_UPDATE_MESSAGE (type=6) — 3초 내 즉시 응답
  return NextResponse.json({ type: 6 })
}

/**
 * interaction 원본 메시지를 Discord Webhook API 로 수정.
 * after() 블록에서 호출됨.
 */
export async function editOriginalInteractionMessage(
  appId: string,
  token: string,
  content: string
): Promise<void> {
  await fetch(
    `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, components: [] }),
    }
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
