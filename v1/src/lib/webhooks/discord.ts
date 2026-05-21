/**
 * Discord 웹훅 발송 유틸리티
 *
 * Discord Webhook API: POST로 JSON body를 보내면 메시지가 채널에 표시됨.
 * 인증 불필요 — URL 자체가 시크릿이므로 DB에 안전하게 저장해야 함.
 */

const DISCORD_TIMEOUT_MS = 5_000

interface DiscordEmbed {
  title?: string
  description?: string
  color?: number
  fields?: { name: string; value: string; inline?: boolean }[]
  footer?: { text: string }
  timestamp?: string
}

interface DiscordWebhookPayload {
  content?: string
  username?: string
  avatar_url?: string
  embeds?: DiscordEmbed[]
}

// Draft 브랜드 색상 (임베드용)
const COLORS = {
  primary: 0x6366f1, // indigo-500
  success: 0x22c55e, // green-500
  warning: 0xf59e0b, // amber-500
  danger: 0xef4444,  // red-500
  info: 0x3b82f6,    // blue-500
} as const

/**
 * Discord 웹훅으로 메시지를 발송한다.
 * 서버 에러(5xx) 시 1회 재시도 후 실패 처리.
 * 실패해도 throw하지 않음 — 외부 알림은 best-effort.
 */
export async function sendDiscordWebhook(
  webhookUrl: string,
  payload: DiscordWebhookPayload
): Promise<boolean> {
  const body = JSON.stringify({ username: 'Draft', ...payload })
  const MAX_ATTEMPTS = 2

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(DISCORD_TIMEOUT_MS),
      })

      if (res.ok) return true

      // 5xx 서버 에러 → 재시도 (1초 대기)
      if (res.status >= 500 && attempt < MAX_ATTEMPTS - 1) {
        console.warn(`[discord-webhook] ${res.status}, retrying in 1s`)
        await new Promise(r => setTimeout(r, 1000))
        continue
      }

      console.error('[discord-webhook] failed', {
        status: res.status,
        statusText: res.statusText,
      })
      return false
    } catch (error) {
      // 네트워크/타임아웃 에러 → 재시도
      if (attempt < MAX_ATTEMPTS - 1) {
        console.warn('[discord-webhook] network error, retrying in 1s')
        await new Promise(r => setTimeout(r, 1000))
        continue
      }
      console.error('[discord-webhook] error', error)
      return false
    }
  }

  return false
}

/** 주간 업데이트 작성 알림 */
export async function notifyDiscordUpdatePosted(
  webhookUrl: string,
  params: {
    authorName: string
    projectTitle: string
    updateTitle: string
    updateType: string
    weekNumber: number
    projectUrl: string
  }
): Promise<boolean> {
  const typeLabels: Record<string, string> = {
    ideation: '💡 고민',
    design: '🎨 설계',
    development: '🛠️ 구현',
    launch: '🚀 런칭',
    general: '📝 일반',
  }

  return sendDiscordWebhook(webhookUrl, {
    embeds: [
      {
        title: `${typeLabels[params.updateType] ?? '📝'} ${params.updateTitle}`,
        description: `**${params.authorName}**님이 **${params.projectTitle}**에 ${params.weekNumber}주차 업데이트를 올렸습니다.`,
        color: COLORS.primary,
        fields: [
          {
            name: '프로젝트',
            value: params.projectTitle,
            inline: true,
          },
          {
            name: '주차',
            value: `${params.weekNumber}주차`,
            inline: true,
          },
        ],
        footer: { text: 'Draft' },
        timestamp: new Date().toISOString(),
      },
    ],
  })
}

/** 주간 업데이트 미작성 리마인드 */
export async function notifyDiscordUpdateRemind(
  webhookUrl: string,
  params: {
    teamNames: string[]
    weekNumber: number
    draftUrl: string
  }
): Promise<boolean> {
  const teamList = params.teamNames.map((t) => `• ${t}`).join('\n')

  return sendDiscordWebhook(webhookUrl, {
    embeds: [
      {
        title: `⏰ ${params.weekNumber}주차 업데이트 리마인드`,
        description: `아직 이번 주 업데이트를 작성하지 않은 팀이 있습니다.\n\n${teamList}`,
        color: COLORS.warning,
        footer: { text: 'Draft' },
        timestamp: new Date().toISOString(),
      },
    ],
  })
}

/** 공지 발송 */
export async function notifyDiscordAnnouncement(
  webhookUrl: string,
  params: {
    title: string
    content: string
    authorName: string
  }
): Promise<boolean> {
  return sendDiscordWebhook(webhookUrl, {
    embeds: [
      {
        title: `📢 ${params.title}`,
        description: params.content,
        color: COLORS.info,
        footer: { text: `${params.authorName} • Draft` },
        timestamp: new Date().toISOString(),
      },
    ],
  })
}

/** 웹훅 URL 유효성 테스트 (실제로 메시지를 보냄) */
export async function testDiscordWebhook(webhookUrl: string): Promise<boolean> {
  return sendDiscordWebhook(webhookUrl, {
    embeds: [
      {
        title: '✅ Draft 연동 성공',
        description: 'Discord 웹훅이 정상적으로 연결되었습니다. 이제 주간 업데이트 알림을 받을 수 있습니다.',
        color: COLORS.success,
        footer: { text: 'Draft' },
        timestamp: new Date().toISOString(),
      },
    ],
  })
}
