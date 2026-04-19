/**
 * Slack Incoming Webhook 발송 유틸리티.
 *
 * Slack Webhook API: https://hooks.slack.com/services/T.../B.../... 에 POST JSON 한 번으로 메시지 전송.
 * Discord와 구조적으로 동일 — URL 자체가 시크릿. DB에 저장된 클럽 운영 채널로 발송.
 *
 * Block Kit 의 section block 만 사용해 단순성 유지 (context/header 미사용).
 * text 필드는 screen reader/알림 fallback.
 */

const SLACK_TIMEOUT_MS = 5_000

interface SlackSection {
  type: 'section'
  text: { type: 'mrkdwn' | 'plain_text'; text: string }
}

interface SlackPayload {
  text: string
  blocks?: SlackSection[]
}

async function postSlack(webhookUrl: string, payload: SlackPayload): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SLACK_TIMEOUT_MS)
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export async function testSlackWebhook(webhookUrl: string): Promise<boolean> {
  return postSlack(webhookUrl, {
    text: 'Draft 웹훅이 연결되었습니다. 클럽 알림이 이 채널로 전달됩니다.',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':sparkles: *Draft 웹훅이 연결되었습니다.*\n클럽 알림이 이 채널로 전달됩니다.',
        },
      },
    ],
  })
}

export async function notifySlackUpdatePosted(
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
  const typeLabel =
    params.updateType === 'launch' ? ':rocket: 런칭' :
    params.updateType === 'development' ? ':hammer_and_wrench: 구현' :
    params.updateType === 'design' ? ':compass: 설계' :
    params.updateType === 'ideation' ? ':bulb: 아이디어' :
    ':memo: 업데이트'

  const fallback = `${params.authorName}님이 ${params.projectTitle}에 ${params.weekNumber}주차 업데이트를 작성했습니다`

  return postSlack(webhookUrl, {
    text: fallback,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${params.weekNumber}주차 업데이트* · ${typeLabel}\n<${params.projectUrl}|${params.projectTitle}>\n\n_${params.updateTitle}_\n작성 · ${params.authorName}`,
        },
      },
    ],
  })
}

export async function notifySlackUpdateRemind(
  webhookUrl: string,
  params: { teamNames: string[]; weekNumber: number; draftUrl: string }
): Promise<boolean> {
  const list = params.teamNames.slice(0, 10).map(n => `• ${n}`).join('\n')
  return postSlack(webhookUrl, {
    text: `${params.weekNumber}주차 업데이트 미제출 팀이 있습니다`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:warning: *${params.weekNumber}주차 미제출 팀 ${params.teamNames.length}곳*\n${list}\n\n<${params.draftUrl}|Draft에서 확인>`,
        },
      },
    ],
  })
}

export async function notifySlackAnnouncement(
  webhookUrl: string,
  params: { title: string; content: string; authorName: string }
): Promise<boolean> {
  const body = `:loudspeaker: *${params.title}*\n\n${params.content.slice(0, 2000)}\n\n공지 · ${params.authorName}`
  return postSlack(webhookUrl, {
    text: params.title,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: body },
      },
    ],
  })
}
