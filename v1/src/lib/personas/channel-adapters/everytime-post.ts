/**
 * 에브리타임 게시글 어댑터.
 *
 * 한국 대학 동아리 모집 1순위 채널. 공식 API 없음 → 영구 복사 전용.
 * 규칙:
 *   - 제목 50자 이내 (에타 UI 한계)
 *   - 본문 600자 권장 (길면 스크롤 피로)
 *   - 이미지는 첨부 링크로 별도 (본문에 URL만)
 *   - 구어체 가능 (학생 커뮤니티), 페르소나가 격식체면 살짝 다운톤
 *   - 지원 링크 + 마감일 + 문의 카톡 오픈채팅은 반드시 포함
 */

import { z } from 'zod'
import { chatModel } from '@/src/lib/ai/gemini-client'
import { safeGenerate } from '@/src/lib/ai/safe-generate'
import type { ChannelAdapter } from './types'
import { buildPersonaPrompt } from './persona-prompt'

const OUTPUT = z.object({
  title: z.string().min(5).max(50, '에타 제목은 50자 이하여야 합니다'),
  body: z.string().min(50).max(800), // LLM이 넘어설 수 있으니 여유 약간
})

export const everytimePostAdapter: ChannelAdapter = {
  channelFormat: 'everytime_post',

  async run(input) {
    const { prompt: personaPrompt, usedSlots } = buildPersonaPrompt(input.persona, [
      'identity',
      'audience',
      'hooking_style',
      'taboos',
    ])

    const meta = JSON.stringify(input.eventMetadata, null, 2)

    const prompt = `${personaPrompt}

# 과제
당신은 "${input.orgName}"이 에브리타임 동아리 게시판에 올릴 게시글을 작성합니다.
이벤트 타입: ${input.eventType}
이벤트 메타:
${meta}

# 에브리타임 특수 규칙
- 제목 50자 이내, 본론 직설적으로. "[${input.orgName} 10-1기 모집]" 같은 말머리 OK
- 본문 400~600자, 최대 800자를 넘지 말 것
- 이미지 첨부는 없다고 가정 (본문 텍스트만으로 설득)
- 어미는 합쇼체 기본. 학생 커뮤니티니 너무 격식 차지 말고 자연스럽게
- 모집·홍보면 반드시 포함: 지원 링크 / 마감일 / 문의 카톡 오픈채팅 (없으면 동아리 공식 SNS)
- 이모지는 제목 말머리에만 1~2개. 본문은 피할 것 (에타 특성)

반드시 JSON:
{
  "title": "...",
  "body": "..."
}`

    const { data } = await safeGenerate({
      model: chatModel,
      prompt,
      schema: OUTPUT,
      extractJson: 'object',
      maxRetries: 1,
    })

    // 제목+본문 복사 편의 위해 합쳐서 저장 (UI에서 분리 표시)
    const content = `${data.title}\n\n${data.body}`

    return {
      channel_format: 'everytime_post',
      generated_content: content,
      title: data.title,
      format_constraints: {
        title_limit: 50,
        title_used: data.title.length,
        body_limit: 600,
        body_used: data.body.length,
        is_copy_only: true, // 영구 (공식 API 없음)
      },
      is_copy_only: true,
      used_slots: usedSlots,
    }
  },
}
