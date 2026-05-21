/**
 * 이메일 뉴스레터 어댑터.
 *
 * 규칙:
 *   - 제목 40자 이내 (지메일 모바일 잘림 기준)
 *   - 미리보기(프리헤더) 80자 이내
 *   - 본문 섹션 3~5개, 각 섹션 헤더 + 2~4문장
 *   - CTA 1~2개 명확하게 (지원/참여/구독)
 *   - 마크다운 저장 (Resend가 마크다운→HTML 변환 지원)
 *
 * R3.1: is_copy_only=false지만 발송은 R3.4에서 구독자 리스트 UI와 함께.
 *        지금은 생성만 하고 DB에 저장.
 */

import { z } from 'zod'
import { chatModel } from '@/src/lib/ai/gemini-client'
import { safeGenerate } from '@/src/lib/ai/safe-generate'
import type { ChannelAdapter } from './types'
import { buildPersonaPrompt } from './persona-prompt'

const OUTPUT = z.object({
  subject: z.string().min(5).max(40, '이메일 제목은 40자 이하여야 합니다'),
  preview: z.string().min(10).max(80),
  body_md: z.string().min(200).max(5000),
})

export const emailNewsletterAdapter: ChannelAdapter = {
  channelFormat: 'email_newsletter',

  async run(input) {
    const { prompt: personaPrompt, usedSlots } = buildPersonaPrompt(input.persona, [
      'identity',
      'audience',
      'sentence_style',
      'ending_signature',
      'vocabulary',
      'taboos',
    ])

    const meta = JSON.stringify(input.eventMetadata, null, 2)
    const corpus = input.corpusHint ? `\n\n[참고 원본]\n${input.corpusHint}` : ''

    const prompt = `${personaPrompt}

# 과제
"${input.orgName}" 이름으로 구독자에게 발송할 이메일 뉴스레터를 작성합니다.
독자는 동문·예비 지원자·스폰서 혼합. 과한 홍보는 구독 해지로 이어지니 정보 중심.

이벤트 타입: ${input.eventType}
이벤트 메타:
${meta}${corpus}

# 엄격한 규칙
- subject: 제목 40자 이내. 모바일 지메일 잘림 기준. 이모지 0~1개.
- preview: 프리헤더 80자 이내. 본문 첫 줄과 달라야 함(중복 방지).
- body_md: 마크다운 본문. 섹션 3~5개 구성 (## 헤더). 각 섹션 2~4 문장.
- 어미 "-습니다" 유지. CTA 1~2개는 [버튼 텍스트](URL) 형태로.
- 이벤트 메타의 apply_url / event_date 같은 필드는 반드시 본문에 반영
- 구독자 이탈 유발 금기: 감정 과잉, 카피 클리셰, 의미 없는 이모지 연발

반드시 JSON:
{
  "subject": "...",
  "preview": "...",
  "body_md": "## 섹션1\\n...\\n\\n## 섹션2\\n..."
}`

    const { data } = await safeGenerate({
      model: chatModel,
      prompt,
      schema: OUTPUT,
      extractJson: 'object',
      maxRetries: 1,
    })

    // 저장은 subject + preview + body_md를 합친 형태로 (R3.2에서 구조 분리 가능)
    const content = `# ${data.subject}\n\n> ${data.preview}\n\n${data.body_md}`

    return {
      channel_format: 'email_newsletter',
      generated_content: content,
      title: data.subject,
      format_constraints: {
        subject_limit: 40,
        subject_used: data.subject.length,
        preview_limit: 80,
        preview_used: data.preview.length,
        body_limit: 5000,
        body_used: data.body_md.length,
        is_copy_only: false, // Resend 발송 가능 (R3.4 구독자 리스트 연결)
      },
      is_copy_only: false,
      used_slots: usedSlots,
    }
  },
}
