/**
 * 링크드인 장문 포스트 어댑터.
 *
 * 규칙:
 *   - 3000자 이하 (LinkedIn 공식 상한)
 *   - 격식체 ("-습니다" 필수). 페르소나가 캐주얼해도 LinkedIn은 공식 톤 우선.
 *   - 첫 3줄은 훅 (LinkedIn도 기본 3줄만 노출)
 *   - 실적 수치·성과 포함 시 LinkedIn 알고리즘 유리
 *   - 해시태그 3~5개 (인스타보다 적음)
 *
 * audience_mode 힌트: 'sponsor' / 'investor'면 비즈니스 톤 강화.
 */

import { z } from 'zod'
import { chatModel } from '@/src/lib/ai/gemini-client'
import { safeGenerate } from '@/src/lib/ai/safe-generate'
import type { ChannelAdapter } from './types'
import { buildPersonaPrompt } from './persona-prompt'

const OUTPUT = z.object({
  body: z.string().min(100).max(3000),
  hashtags: z.array(z.string().regex(/^#/)).min(3).max(5),
})

export const linkedinPostAdapter: ChannelAdapter = {
  channelFormat: 'linkedin_post',

  async run(input) {
    const { prompt: personaPrompt, usedSlots } = buildPersonaPrompt(input.persona, [
      'identity',
      'audience',
      'sentence_style',
      'vocabulary',
      'taboos',
    ])

    const meta = JSON.stringify(input.eventMetadata, null, 2)
    const audienceMode =
      (input.eventMetadata.audience_mode as string | undefined) ?? 'public'
    const audienceHint =
      audienceMode === 'sponsor'
        ? '잠재 스폰서/파트너에게 협업 여지를 제시하는 비즈니스 톤으로.'
        : audienceMode === 'investor'
          ? '투자자에게 성장 가능성을 설득하는 톤으로. 수치·시장 기회 중심.'
          : '일반 대중·동문·예비 지원자를 대상으로.'

    const prompt = `${personaPrompt}

# 과제
당신은 "${input.orgName}"의 공식 LinkedIn 페이지 운영자입니다.
아래 이벤트를 LinkedIn 장문 포스트로 작성하세요.

이벤트 타입: ${input.eventType}
이벤트 메타:
${meta}

대상 독자: ${audienceHint}

# 엄격한 규칙
- 3000자 이하, 1500~2500자 권장
- 첫 3줄은 훅. "..." 말줄임 유도 (LinkedIn은 기본 3줄만 노출)
- 어미는 반드시 "-습니다/-입니다" 격식체 (페르소나 어미가 캐주얼해도 예외)
- 성과 수치·구체 사실 최소 1개 이상 포함 (LinkedIn 알고리즘 유리)
- 줄바꿈 적극 (빈 줄로 문단 구분)
- **마크다운 문법 사용 절대 금지**: \`**굵게**\`, \`*기울임*\`, \`# 제목\`, \`- 리스트\`, \`\`\`코드\`\`\` 전부 금지. LinkedIn은 마크다운 렌더링 안 해서 그대로 리터럴 표시됨. 강조는 줄바꿈·유니코드 볼드(𝗕𝗼𝗹𝗱, 선택 사용)·이모지로만.
- 해시태그 3~5개, 업계·학교·도메인 중심
- 자기 홍보·과장 금지 (LinkedIn 문화)

반드시 JSON으로만 응답:
{
  "body": "...",
  "hashtags": ["#StartupKorea", "#UniversityClub", ...]
}`

    const { data } = await safeGenerate({
      model: chatModel,
      prompt,
      schema: OUTPUT,
      extractJson: 'object',
      maxRetries: 1,
    })

    const content = `${data.body}\n\n${data.hashtags.join(' ')}`

    return {
      channel_format: 'linkedin_post',
      generated_content: content,
      title: null,
      format_constraints: {
        char_limit: 3000,
        char_used: content.length,
        hashtag_min: 3,
        hashtag_max: 5,
        hashtag_count: data.hashtags.length,
        audience_mode: audienceMode,
        is_copy_only: true, // R3.1; R3.4에서 LinkedIn API 연결
      },
      is_copy_only: true,
      used_slots: usedSlots,
    }
  },
}
