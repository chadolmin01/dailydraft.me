/**
 * Discord 포럼 포스트 어댑터 (마크다운).
 *
 * Draft 동아리 Discord 서버에 자동 발행되는 메시지.
 * 규칙:
 *   - 마크다운 (Discord는 # ## ** * 등 기본 지원)
 *   - 2000자 이하 (Discord 단일 메시지 제한)
 *   - 헤더(H1~H2) + 섹션별 bullet
 *   - 이모지 자유 (Discord 문화)
 *   - 멘션·링크 자연스럽게
 *
 * 주의: weekly_update 이벤트는 기존 Ghostwriter 크론이 ParsedContent JSON으로
 * 별도 초안을 만든다. R3.1에선 Discord 포럼용 "요약 마크다운"을 이 어댑터가
 * 독립 생성 (LLM 1번 추가 호출). R3.2에서 통합 예정.
 */

import { z } from 'zod'
import { chatModel } from '@/src/lib/ai/gemini-client'
import { safeGenerate } from '@/src/lib/ai/safe-generate'
import type { ChannelAdapter } from './types'
import { buildPersonaPrompt } from './persona-prompt'

const OUTPUT = z.object({
  title: z.string().min(3).max(100),
  body_md: z.string().min(50).max(2000),
})

export const discordForumMarkdownAdapter: ChannelAdapter = {
  channelFormat: 'discord_forum_markdown',

  async run(input) {
    const { prompt: personaPrompt, usedSlots } = buildPersonaPrompt(input.persona, [
      'identity',
      'audience',
      'vocabulary',
      'humor',
      'taboos',
    ])

    const meta = JSON.stringify(input.eventMetadata, null, 2)
    const corpus = input.corpusHint ? `\n\n[참고 원본]\n${input.corpusHint}` : ''

    const prompt = `${personaPrompt}

# 과제
"${input.orgName}"의 Discord 서버(운영자·멤버 포함)에 포스팅할 포럼 메시지를 작성합니다.
이벤트 타입: ${input.eventType}
이벤트 메타:
${meta}${corpus}

# 규칙
- 마크다운 (Discord 호환: # ## ** *). # 대제목은 한 개만.
- 본문 2000자 이하, 800~1500자 권장
- 이모지 자연스럽게 (Discord 문화에 맞게. 하지만 페르소나 taboos 준수)
- 구어체 가능 (내부 커뮤니티). 페르소나 어미 스타일 참고
- CTA가 있으면 **볼드**로 강조
- 멘션은 @everyone / @here 금지 (운영자가 직접 판단)

반드시 JSON:
{
  "title": "스레드 제목 (100자 이내)",
  "body_md": "# 메시지 본문\\n..."
}`

    const { data } = await safeGenerate({
      model: chatModel,
      prompt,
      schema: OUTPUT,
      extractJson: 'object',
      maxRetries: 1,
    })

    return {
      channel_format: 'discord_forum_markdown',
      generated_content: data.body_md,
      title: data.title,
      format_constraints: {
        char_limit: 2000,
        char_used: data.body_md.length,
        is_copy_only: false, // Discord Webhook으로 자동 발행 가능
      },
      is_copy_only: false,
      used_slots: usedSlots,
    }
  },
}
