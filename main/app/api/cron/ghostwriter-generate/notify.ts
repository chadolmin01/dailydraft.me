/**
 * Ghostwriter 초안 생성 후 Discord 알림 (DM + 팀 채널)
 *
 * 1. 프로젝트 리더에게 DM으로 승인 요청
 * 2. 팀 채널에 간략 메시지 + 스레드로 상세 내용
 *
 * Discord의 Message Components (버튼)를 사용하려면 Bot이 Interaction을 처리해야 함.
 * MVP에서는 Draft 앱으로 연결하는 링크 버튼을 사용한다.
 * (링크 버튼은 Interaction 핸들러 불필요 — URL로 바로 이동)
 */

import { createAdminClient } from '@/src/lib/supabase/admin'
import { sendDirectMessageWithEmbed, sendChannelMessage, createMessageThread } from '@/src/lib/discord/client'
import { extractSummary } from '@/src/lib/ghostwriter/parse-content'
import { APP_URL } from '@/src/constants'

const TYPE_LABELS: Record<string, string> = {
  ideation: '💡 고민',
  design: '🎨 설계',
  development: '🛠️ 구현',
  launch: '🚀 런칭',
  general: '📝 일반',
}

const COLORS: Record<string, number> = {
  ideation: 0xf59e0b,
  design: 0x3b82f6,
  development: 0x22c55e,
  launch: 0xa855f7,
  general: 0x6b7280,
}

interface NotifyParams {
  draftId: string
  opportunityId: string
  projectTitle: string
  title: string
  content: string
  updateType: string
  weekNumber: number
  creatorId: string // Draft user ID
  discordUserId?: string // 배치 조회된 Discord user ID (없으면 DB 조회)
  teamChannelId?: string // 배치 조회된 팀 채널 ID (없으면 DB 조회)
}

/**
 * 프로젝트 리더에게 Discord DM으로 초안 승인 요청을 보낸다.
 *
 * Draft user_id → Discord user_id 매핑이 필요.
 * discord_bot_installations 테이블의 guild에서 멤버를 찾거나,
 * 프로필에 discord_id가 저장되어 있어야 함.
 *
 * MVP: profiles 테이블에 discord_user_id 컬럼이 있다고 가정.
 * 없으면 Draft 앱 내 알림으로 fallback.
 */
export async function notifyDraftReady(params: NotifyParams): Promise<void> {
  const baseUrl = APP_URL
  const approveUrl = `${baseUrl}/drafts/${params.draftId}`

  // 호출자가 배치 조회한 Discord ID 사용, 없으면 개별 조회 (fallback)
  let discordUserId = params.discordUserId
  if (!discordUserId) {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('discord_user_id')
      .eq('user_id', params.creatorId)
      .single()
    discordUserId = profile?.discord_user_id || undefined
  }

  // Discord user ID가 없으면 in-app 알림만 (DM 스킵)
  if (!discordUserId) {
    await sendInAppNotification(params, approveUrl)
    return
  }

  try {
    await sendDirectMessageWithEmbed(discordUserId, {
      embeds: [
        {
          title: `📝 ${params.weekNumber}주차 업데이트 초안`,
          description: [
            `**${params.projectTitle}**의 주간 업데이트 초안이 준비됐습니다.`,
            '',
            `> **${params.title}**`,
            `> ${extractSummary(params.content)}`,
          ].join('\n'),
          color: COLORS[params.updateType] ?? 0x6366f1,
          fields: [
            { name: '유형', value: TYPE_LABELS[params.updateType] ?? '📝', inline: true },
            { name: '주차', value: `${params.weekNumber}주차`, inline: true },
          ],
          footer: { text: 'Draft • 30초만 확인해주세요' },
          timestamp: new Date().toISOString(),
        },
      ],
      components: [
        {
          type: 1, // ActionRow
          components: [
            {
              type: 2, // Button
              style: 5, // Link
              label: '✅ 확인하고 승인하기',
              url: approveUrl,
            },
          ],
        },
      ],
    })
  } catch (error) {
    console.error('[ghostwriter-notify] DM 발송 실패, in-app으로 fallback', error)
    await sendInAppNotification(params, approveUrl)
  }

  // 팀 채널에도 간략 알림 + 스레드 (fire-and-forget)
  notifyTeamChannel(params, approveUrl, params.teamChannelId).catch((err) =>
    console.error('[ghostwriter-notify] 팀 채널 알림 실패', err)
  )

  // 운영 대시보드 채널에도 알림 (fire-and-forget)
  notifyOpsChannel('draft_ready', params).catch((err) =>
    console.error('[ghostwriter-notify] 운영 채널 알림 실패', err)
  )
}

/** Discord DM이 안 될 때 Draft 앱 내 알림으로 fallback */
async function sendInAppNotification(params: NotifyParams, approveUrl: string): Promise<void> {
  const admin = createAdminClient()

  await admin.from('event_notifications').insert({
    user_id: params.creatorId,
    notification_type: 'project_update',
    title: `${params.weekNumber}주차 업데이트 초안이 준비됐습니다`,
    message: `"${params.projectTitle}" 주간 업데이트: ${params.title}. 확인하고 승인해주세요.`,
    status: 'unread',
    link: approveUrl,
    metadata: {
      draft_id: params.draftId,
      project_title: params.projectTitle,
    },
  })
}

// ── 팀 채널 알림 (스레드 사용) ──

/** opportunity_id로 팀 채널 ID를 조회 */
async function getTeamChannelId(opportunityId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('discord_team_channels')
    .select('discord_channel_id')
    .eq('opportunity_id', opportunityId)
    .maybeSingle()
  return data?.discord_channel_id ?? null
}

/**
 * 팀 채널에 초안 생성 알림을 보낸다.
 * 메인 메시지는 1줄로 간략하게, 스레드에 상세 내용을 담는다.
 */
async function notifyTeamChannel(params: NotifyParams, approveUrl: string, preloadedChannelId?: string): Promise<void> {
  const channelId = preloadedChannelId ?? await getTeamChannelId(params.opportunityId)
  if (!channelId) return

  const typeLabel = TYPE_LABELS[params.updateType] ?? '📝'

  // 메인 메시지: 간략하게 1줄
  const mainMsg = await sendChannelMessage(
    channelId,
    `📝 **${params.weekNumber}주차 주간 업데이트 초안**이 생성됐습니다. 팀장의 승인을 기다리고 있습니다.`
  )

  // 스레드 생성 후 상세 내용 게시
  const thread = await createMessageThread(
    channelId,
    mainMsg.id,
    `${params.weekNumber}주차 업데이트 초안`
  )

  await sendChannelMessage(
    thread.id,
    [
      `**${params.title}**`,
      `${typeLabel}`,
      '',
      extractSummary(params.content),
      '',
      `🔗 [Draft에서 확인하고 승인하기](${approveUrl})`,
    ].join('\n')
  )
}

/**
 * 초안 승인 시 팀 채널 + 운영 채널에 알림을 보낸다.
 * 메인 메시지 1줄 + 스레드에 승인된 업데이트 요약.
 */
export async function notifyDraftApproved(params: {
  opportunityId: string
  projectTitle: string
  title: string
  content: string
  updateType: string
  weekNumber: number
  authorName: string
}): Promise<void> {
  // 팀 채널 알림
  const channelId = await getTeamChannelId(params.opportunityId)
  if (channelId) {
    const typeLabel = TYPE_LABELS[params.updateType] ?? '📝'

    const mainMsg = await sendChannelMessage(
      channelId,
      `✅ **${params.weekNumber}주차 주간 업데이트**가 게시됐습니다.`
    )

    const thread = await createMessageThread(
      channelId,
      mainMsg.id,
      `${params.weekNumber}주차 업데이트 게시 완료`
    )

    await sendChannelMessage(
      thread.id,
      [
        `**${params.title}**`,
        `${typeLabel} · 승인: ${params.authorName}`,
        '',
        extractSummary(params.content),
      ].join('\n')
    )
  }

  // 운영 대시보드 채널 알림
  notifyOpsChannel('draft_approved', params).catch((err) =>
    console.error('[ghostwriter-notify] 운영 채널 승인 알림 실패', err)
  )
}

// ── 운영 대시보드 채널 알림 ──

/**
 * 운영진에게 개별 이벤트 알림을 보낸다.
 * 주간 보고(dashboard-summary.ts)와 별도로, 실시간 이벤트를 전달.
 */
async function notifyOpsChannel(
  event: 'draft_ready' | 'draft_approved',
  params: { projectTitle: string; title: string; weekNumber: number; updateType: string; authorName?: string }
): Promise<void> {
  const opsChannelId = process.env.DISCORD_OPS_DASHBOARD_CHANNEL_ID
  if (!opsChannelId) return

  const typeLabel = TYPE_LABELS[params.updateType] ?? '📝'

  if (event === 'draft_ready') {
    await sendChannelMessage(
      opsChannelId,
      `📝 **${params.projectTitle}** — ${params.weekNumber}주차 초안 생성 완료 (${typeLabel}). 팀장 승인 대기 중.`
    )
  } else {
    await sendChannelMessage(
      opsChannelId,
      `✅ **${params.projectTitle}** — ${params.weekNumber}주차 업데이트 게시 완료 (${typeLabel}, 승인: ${params.authorName}).`
    )
  }
}
