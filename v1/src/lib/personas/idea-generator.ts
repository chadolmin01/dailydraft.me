/**
 * Content Idea Generator (R4 스코프, 최소 기능)
 *
 * 회장이 "아이디어 10개 뽑아줘" 했을 때 페르소나 + 최근 활동 기반으로
 * "글감 카드"를 생성. 각 카드는 제목 + 한 줄 설명.
 *
 * 실제 발행 콘텐츠는 회장이 카드를 골라 /bundles/new 로 이관할 때 생성됨.
 *
 * 소스:
 *   - 'self'        자체 창작 (페르소나 + 최근 이슈로)
 *   - 'internet'    인터넷 검색 — 현재는 self와 동일 (검색 API 연동은 이후)
 *   - 'internal'    내 자료 — Discord corpus/persona_corpus_sources 요약 기반
 */

import { z } from 'zod'
import { chatModel } from '@/src/lib/ai/gemini-client'
import { safeGenerate } from '@/src/lib/ai/safe-generate'

export type IdeaSource = 'self' | 'internet' | 'internal'

export interface IdeaGenerateInput {
  personaSummary: string // 페르소나 identity/audience 요약
  orgName: string
  source: IdeaSource
  count: number
  recentContext?: string // 최근 덱 제목·이번 주 이슈 등
  internalDigest?: string // corpus 요약 (source='internal' 일 때)
}

export interface GeneratedIdea {
  title: string
  description: string
  event_type_hint: string // announcement / weekly_update / ...
  source: IdeaSource
}

const SCHEMA = z.object({
  ideas: z
    .array(
      z.object({
        title: z.string().min(5).max(80),
        description: z.string().min(10).max(200),
        event_type_hint: z.string().default('announcement'),
      }),
    )
    .min(1),
})

export async function generateIdeas(
  input: IdeaGenerateInput,
): Promise<GeneratedIdea[]> {
  const sourceLabel =
    input.source === 'internet'
      ? '인터넷에서 찾기 (주제 트렌드 반영)'
      : input.source === 'internal'
        ? '내 자료에서 뽑기 (동아리 내부 컨텍스트)'
        : '자체적으로 창작하기 (브랜드 톤에 맞는 주제)'

  const internalBlock = input.internalDigest
    ? `\n\n내부 자료 요약:\n${input.internalDigest.slice(0, 1500)}`
    : ''

  const recentBlock = input.recentContext
    ? `\n\n최근 활동/맥락:\n${input.recentContext.slice(0, 800)}`
    : ''

  const prompt = `당신은 대학 동아리 "${input.orgName}"의 콘텐츠 기획자입니다.
아래 페르소나 톤을 유지하며 SNS(Discord/LinkedIn/Instagram)에 올릴 ${input.count}개의 글감 아이디어를 제안하십시오.

**소스 모드**: ${sourceLabel}

**페르소나 요약**:
${input.personaSummary.slice(0, 1500)}
${recentBlock}${internalBlock}

**제약**:
- 각 아이디어는 실제로 이번 주·이번 달에 쓸만한 실용적 주제
- 제목은 50자 내외로 구체적 (나쁜 예: "AI 소식") (좋은 예: "우리 팀이 이번 주 Claude로 해커톤 준비한 3가지")
- 설명은 1~2문장으로 "무엇에 대해 쓸지"가 명확해야 함
- event_type_hint는 다음 중 하나: announcement / weekly_update / mid_showcase / project_kickoff / monthly_recap
- 모두 다른 주제 (중복 금지)
- 한국어, 합쇼체 유지

JSON 스키마:
{
  "ideas": [
    { "title": "...", "description": "...", "event_type_hint": "announcement" }
  ]
}`

  const { data } = await safeGenerate({
    model: chatModel,
    prompt,
    schema: SCHEMA,
    maxRetries: 2,
  })

  return data.ideas.slice(0, input.count).map((i) => ({
    title: i.title,
    description: i.description,
    event_type_hint: i.event_type_hint,
    source: input.source,
  }))
}
