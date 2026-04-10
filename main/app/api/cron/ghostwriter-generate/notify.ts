/**
 * Ghostwriter 초안 생성 후 Discord DM 알림
 *
 * Discord의 Message Components (버튼)를 사용하려면 Bot이 Interaction을 처리해야 함.
 * MVP에서는 Draft 앱으로 연결하는 링크 버튼을 사용한다.
 * (링크 버튼은 Interaction 핸들러 불필요 — URL로 바로 이동)
 */

import { createAdminClient } from '@/src/lib/supabase/admin'
import { sendDirectMessageWithEmbed } from '@/src/lib/discord/client'

/** content가 JSON이면 summary를 추출, 아니면 앞 200자 잘라서 반환 */
function extractSummary(content: string): string {
  try {
    const parsed = JSON.parse(content)
    const summary = parsed.summary || ''
    return summary.slice(0, 200) + (summary.length > 200 ? '...' : '')
  } catch {
    return content.slice(0, 200) + (content.length > 200 ? '...' : '')
  }
}

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
  projectTitle: string
  title: string
  content: string
  updateType: string
  weekNumber: number
  creatorId: string // Draft user ID
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
  const admin = createAdminClient()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://draft.is'
  const approveUrl = `${baseUrl}/drafts/${params.draftId}`

  // Discord user ID 조회 시도
  const { data: profile } = await admin
    .from('profiles')
    .select('discord_user_id')
    .eq('user_id', params.creatorId)
    .single()

  const discordUserId = (profile as { discord_user_id?: string } | null)?.discord_user_id

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
  } as never)
}
