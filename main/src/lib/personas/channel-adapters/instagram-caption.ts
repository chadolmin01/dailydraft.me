/**
 * 인스타그램 캡션 어댑터.
 *
 * 규칙:
 *   - 캡션 2200자 이하 (Meta 공식 상한)
 *   - 첫 2줄은 훅 (인스타는 기본 2줄만 노출, "더보기"로 펼침)
 *   - 해시태그 3~10개, 본문 끝
 *   - 이모지는 페르소나 humor/hooking_style에 맞게 (남용 금지)
 *
 * R3.1: is_copy_only=true. R3.4에서 Instagram Graph API로 자동 발행.
 */

import { z } from 'zod'
import { chatModel } from '@/src/lib/ai/gemini-client'
import { safeGenerate } from '@/src/lib/ai/safe-generate'
import type { ChannelAdapter } from './types'
import { buildPersonaPrompt } from './persona-prompt'

const OUTPUT = z.object({
  caption: z
    .string()
    .min(20)
    .max(2200, '인스타 캡션은 2200자 이하여야 합니다'),
  hashtags: z.array(z.string().regex(/^#/, '각 해시태그는 #로 시작해야 합니다')).min(3).max(10),
})

export const instagramCaptionAdapter: ChannelAdapter = {
  channelFormat: 'instagram_caption',

  async run(input) {
    const { prompt: personaPrompt, usedSlots } = buildPersonaPrompt(input.persona, [
      'identity',
      'audience',
      'hooking_style',
      'ending_signature',
      'vocabulary',
      'taboos',
    ])

    const meta = JSON.stringify(input.eventMetadata, null, 2)
    const corpus = input.corpusHint ? `\n\n[참고 원본]\n${input.corpusHint}` : ''

    const prompt = `${personaPrompt}

# 과제
당신은 "${input.orgName}"의 공식 인스타그램 운영자입니다.
아래 이벤트에 대한 인스타 캡션을 작성하세요.

이벤트 타입: ${input.eventType}
이벤트 메타:
${meta}${corpus}

# 엄격한 규칙
- 첫 2줄은 강한 훅 (페르소나의 hooking_style 반영)
- 전체 캡션 2200자 이하, 짧을수록 좋음
- 이모지는 자연스럽게만 (남용 금지 — 페르소나 taboos 확인)
- 페르소나의 어미 시그니처(ending_signature)를 따를 것
- 해시태그는 본문에 섞지 말고 배열로 별도 반환
- 해시태그 3~10개. 동아리·학교·도메인 키워드 중심

반드시 JSON으로만 응답:
{
  "caption": "...",
  "hashtags": ["#태그1", "#태그2", ...]
}`

    const { data } = await safeGenerate({
      model: chatModel,
      prompt,
      schema: OUTPUT,
      extractJson: 'object',
      maxRetries: 1,
    })

    const content = `${data.caption}\n\n${data.hashtags.join(' ')}`

    return {
      channel_format: 'instagram_caption',
      generated_content: content,
      title: null,
      format_constraints: {
        char_limit: 2200,
        char_used: content.length,
        hashtag_min: 3,
        hashtag_max: 10,
        hashtag_count: data.hashtags.length,
        is_copy_only: true, // R3.1
      },
      is_copy_only: true,
      used_slots: usedSlots,
    }
  },
}
