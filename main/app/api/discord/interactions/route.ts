import { NextRequest, NextResponse } from 'next/server'
import { APP_URL } from '@/src/constants'
import {
  PING,
  APPLICATION_COMMAND,
  MESSAGE_COMPONENT,
  MODAL_SUBMIT,
  PONG,
  CHANNEL_MESSAGE,
  EPHEMERAL,
} from './_constants'
import { verifyDiscordSignature } from './_verify'
import { handleGitHubCommand } from './_handlers/github'
import { handleDevStatusCommand } from './_handlers/dev-status'
import {
  handleProfileCommand,
  handleSummaryCommand,
  handleVoteCommand,
  handleScheduleCommand,
  handleSettingsCommand,
  handleTodoCommand,
  handleMeetingStartCommand,
  handleOneLineCommand,
  handleConnectCommand,
  handleHelpCommand,
} from './_handlers/commands'
import { handleButtonClick } from './_handlers/buttons'
import { handleModalSubmit } from './_handlers/modals'

/**
 * POST /api/discord/interactions
 *
 * Discord 슬래시 커맨드 인터랙션 웹훅 핸들러.
 * Discord Developer Portal 에서 Interactions Endpoint URL 로 이 URL 을 설정.
 *
 * 핸들러 분리:
 * - 커맨드: ./_handlers/commands.ts (profile/summary/vote/schedule/settings/todo/meeting/oneline/connect/help)
 * - GitHub: ./_handlers/github.ts (연결/목록/해제/내계정)
 * - 개발현황: ./_handlers/dev-status.ts
 * - 버튼: ./_handlers/buttons.ts (launcher + bundle approve + todo assignee + quick actions)
 * - Modal 제출: ./_handlers/modals.ts (todo/vote/oneline/schedule/meeting)
 * - 서명 검증: ./_verify.ts
 */

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

  // 3. 버튼/Select 처리
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
        flags: EPHEMERAL,
      },
    })
  }

  return NextResponse.json({ type: PONG })
}
