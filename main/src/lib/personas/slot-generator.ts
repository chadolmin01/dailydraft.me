/**
 * Slot Generator (self-refinement 루프 포함)
 *
 * 회장의 3개 답변 → Gemini → 13슬롯 초안.
 * Discord corpus 없이도 동작.
 *
 * 품질 원칙:
 *   - Pass 1: 초기 초안 생성 (풍부한 프롬프트 + 예시)
 *   - Pass 2~N: self-critique + refinement (기본 2회)
 *   각 refine pass에서 LLM이 이전 초안의 약점(합쇼체 불일치, 너무 일반적, 슬롯 간 톤 불통일 등)을
 *   내부적으로 찾아 개선된 버전만 반환한다.
 *
 * 비용: Gemini 2.5 Flash-Lite, iterations=2 → LLM 3회 호출 (초안 + 2 refine).
 *       클럽당 약 $0.005 수준. 품질 대비 비용 효율.
 */

import { z } from 'zod'
import { chatModel } from '@/src/lib/ai/gemini-client'
import { safeGenerate } from '@/src/lib/ai/safe-generate'
import { FIELD_KEYS, type FieldKey } from './types'

export interface GenerateAnswers {
  identity_seed: string
  audience_seed: string
  taboos_seed: string
}

export interface GeneratedSlot {
  field_key: FieldKey
  value: Record<string, unknown>
  confidence: number
  error?: string
}

export interface GenerateResult {
  slots: GeneratedSlot[]
  success_count: number
  total_count: number
  iterations_used: number
}

// 모든 슬롯 스키마 — text 또는 items 기반
const OUTPUT = z.object({
  identity: z.object({ text: z.string().min(30) }),
  audience: z.object({ text: z.string().min(30) }),
  content_patterns: z.object({ text: z.string().min(30) }),
  hooking_style: z.object({ text: z.string().min(30) }),
  sentence_style: z.object({ text: z.string().min(30) }),
  ending_signature: z.object({ text: z.string().min(30) }),
  thought_development: z.object({ text: z.string().min(30) }),
  emotional_distance: z.object({ text: z.string().min(30) }),
  humor: z.object({ text: z.string().min(20) }),
  vocabulary: z.object({ text: z.string().min(30) }),
  rhythm: z.object({ text: z.string().min(30) }),
  taboos: z.object({ items: z.array(z.string().min(5)).min(3).max(12) }),
  reproduction_checklist: z.object({
    items: z.array(z.string().min(5)).min(3).max(8),
  }),
})

type SlotsDraft = z.infer<typeof OUTPUT>

const DEFAULT_ITERATIONS = 2

interface GenerateOptions {
  /** self-refinement 반복 횟수. 기본 2 (초안 + 2 refine = LLM 3회) */
  iterations?: number
}

/**
 * 클럽 메타데이터(이름·설명·카테고리 등)를 기반으로 자동 seed 구성 + 13슬롯 생성.
 * "원버튼 추천 초안" 경로 — 회장이 질문에 답하지 않아도 즉시 초안.
 *
 * 내부 동작:
 *   1) 클럽 메타를 LLM에 넘겨 identity/audience/taboos seed를 먼저 추정
 *   2) 추정된 seed로 기존 generateSlotsFromAnswers() 루프(refine 포함) 실행
 *
 * 품질 트레이드오프: 회장 입력이 없으므로 confidence 약간 낮게 (-0.1). UI에서 검토 강조.
 */
export interface ClubMetaForSeeding {
  name: string
  description?: string | null
  category?: string | null
  cohorts?: string[]
  memberCount?: number
}

const SEED_ESTIMATION_SCHEMA = z.object({
  identity_seed: z.string().min(20),
  audience_seed: z.string().min(20),
  taboos_seed: z.string().min(10),
})

export async function generateSlotsFromClubMeta(
  meta: ClubMetaForSeeding,
  options: GenerateOptions = {},
): Promise<GenerateResult> {
  // 1) 메타 → seed 3개 자동 추정
  const seeds = await estimateSeedsFromMeta(meta)

  // 2) 기존 로직 재활용. confidence만 살짝 하향 조정하기 위해 iterations는 유지.
  const result = await generateSlotsFromAnswers(meta.name, seeds, options)

  // 원버튼 경로는 회장 검토를 더 적극 유도 — confidence 10% 하향
  result.slots = result.slots.map((s) =>
    s.error || s.confidence === 0
      ? s
      : { ...s, confidence: Math.max(s.confidence - 0.1, 0.45) },
  )
  return result
}

async function estimateSeedsFromMeta(
  meta: ClubMetaForSeeding,
): Promise<GenerateAnswers> {
  const prompt = `당신은 한국 대학 동아리의 외부 커뮤니케이션 전략가입니다.
아래 클럽 메타데이터를 보고, 이 클럽의 브랜드 페르소나를 설계하기 위한 3개의 핵심 씨앗 답변을 추정하십시오.

# 클럽 메타데이터
이름: ${meta.name}
카테고리: ${meta.category ?? '미기재'}
설명: ${meta.description ?? '미기재'}
기수: ${meta.cohorts?.length ? meta.cohorts.join(', ') : '미기재'}
구성원 수: ${meta.memberCount ?? '미기재'}

# 추정 규칙
- 메타데이터에서 분명히 드러나는 사실만 활용. 과잉 추측 금지.
- 카테고리 + 한국 대학 생태계 상식을 결합해 합리적으로 추론.
- identity_seed는 클럽이 "누구이며 무엇을 하는지" 3~4 문장 (합쇼체).
- audience_seed는 "누구에게 말을 거는지" 3~4 문장. 연령·직군·고민 포함.
- taboos_seed는 이 카테고리에서 피해야 할 전형적 상투어를 2~4개.

# 응답 형식
JSON 하나만:
{
  "identity_seed": "...",
  "audience_seed": "...",
  "taboos_seed": "..."
}`

  const { data } = await safeGenerate({
    model: chatModel,
    prompt,
    schema: SEED_ESTIMATION_SCHEMA,
    extractJson: 'object',
    maxRetries: 1,
  })
  return data
}

export async function generateSlotsFromAnswers(
  orgName: string,
  answers: GenerateAnswers,
  options: GenerateOptions = {},
): Promise<GenerateResult> {
  const iterations = Math.min(
    Math.max(options.iterations ?? DEFAULT_ITERATIONS, 0),
    3,
  )

  try {
    // Pass 1 — initial draft
    let draft = await initialDraft(orgName, answers)

    // Pass 2..N — self-refinement
    for (let i = 0; i < iterations; i++) {
      try {
        draft = await refineOnce(orgName, answers, draft, i + 1)
      } catch (err) {
        // refine 실패는 치명적이지 않음 — 이전 draft 유지
        console.warn(
          `[slot-generator] refine pass ${i + 1} 실패, 이전 draft 사용:`,
          (err as Error).message,
        )
      }
    }

    const slots: GeneratedSlot[] = FIELD_KEYS.map((key) => {
      const value = (draft as Record<string, Record<string, unknown>>)[key]
      if (value && typeof value === 'object') {
        return {
          field_key: key,
          value,
          // 반복 횟수만큼 신뢰도 상승 (경험적).
          // 0 iter=0.55, 1=0.65, 2=0.75, 3=0.8
          confidence: Math.min(0.55 + iterations * 0.1, 0.8),
        }
      }
      return {
        field_key: key,
        value: {},
        confidence: 0,
        error: 'LLM 결과에 해당 슬롯 없음',
      }
    })

    return {
      slots,
      success_count: slots.filter((s) => !s.error && s.confidence > 0).length,
      total_count: FIELD_KEYS.length,
      iterations_used: iterations,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[slot-generator] 초안 생성 실패:', message)
    return {
      slots: FIELD_KEYS.map((key) => ({
        field_key: key,
        value: {},
        confidence: 0,
        error: message,
      })),
      success_count: 0,
      total_count: FIELD_KEYS.length,
      iterations_used: 0,
    }
  }
}

// ============================================================
// 내부 — Pass 1: Initial Draft
// ============================================================
async function initialDraft(
  orgName: string,
  answers: GenerateAnswers,
): Promise<SlotsDraft> {
  const prompt = `당신은 한국 대학 동아리의 "브랜드 페르소나 아키텍트"입니다.
회장이 제공한 3개 답변을 바탕으로 "${orgName}"의 13개 슬롯을 설계합니다.

# 회장 답변 (씨앗)
Q1. 이 조직은 누구이며 무엇을 합니까?
${answers.identity_seed}

Q2. 말을 걸고 싶은 독자는 누구입니까?
${answers.audience_seed}

Q3. 절대 쓰고 싶지 않은 표현이나 톤은?
${answers.taboos_seed}

# 철저한 규칙
1. **합쇼체 일관**: 모든 text 필드는 "-습니다/-입니다"로. "-에요/-어요" 절대 금지.
2. **구체성**: 슬롯마다 실제 예시 문장 1~2개 포함 (대괄호 [] 안에). 추상적 표현 금지.
3. **일관된 페르소나**: identity/audience/taboos 씨앗을 관통하는 하나의 인격.
4. **재현 가능성**: 누가 읽어도 같은 톤으로 글을 쓸 수 있을 만큼 구체적으로.
5. **"우리만의 ~" 같은 상투어 금지**: 과장된 브랜딩 문구 배제.

# 슬롯별 정의 + 예시
- **identity** — 정체성. 3~5 문장. 소속·활동·가치관·차별점 포함.
  좋은 예: "경희대학교 창업동아리 FLIP 10-1기입니다. 매 학기 8~12개 팀이 10주 안에 MVP를 띄웁니다. '책보다 필드'를 중시하며..."

- **audience** — 독자. 3~5 문장. 연령·직군·고민(FOMO 등)·커뮤니티.
  좋은 예: "창업을 꿈꾸지만 시작점을 찾지 못한 대학교 저학년. 유튜브보다 '실제 결과물'에 반응..."

- **content_patterns** — 반응 좋을 콘텐츠 2~4개 패턴. 각 패턴당 1줄 예시.
  좋은 예: "시행착오 공개 포스트 (예: 'PMF 못 찾은 12주 공개'). 수치 기반 성과 ('3일 만에 50지원')..."

- **hooking_style** — 첫 1~2 문장 패턴. 예시 2개 필수.
  좋은 예: "① 숫자/단정형 (예: '모집 3일차. 100명 넘었습니다.') ② 역설·질문 (예: '창업동아리, 아이디어가 없어도 괜찮을까요?')"

- **sentence_style** — 평균 길이·단락·줄바꿈 규칙. 모바일 가독성 반영.
  좋은 예: "평균 15~25자. 한 단락 1~2 문장. 의미 단위로 빈 줄..."

- **ending_signature** — 어미 Top 3~5. 각 어미별 사용 비율 추정.
  좋은 예: "'-입니다' 50%, '-습니다' 30%, '-네요' 10%, 명사형 종결 10%..."

- **thought_development** — 글 전개 패턴. 도입→본론→결론 구조.
  좋은 예: "속보/상황 제시 → 수치·근거 → 우리의 해석 → 독자에 대한 질문..."

- **emotional_distance** — 독자와의 관계. 친구/선배/관찰자/동료 중 어느 쪽.
  좋은 예: "조금 앞서 실험한 동료 선배. 자신감 높되 오만하지 않음. 실패 자기 노출 중간..."

- **humor** — 유머 기제와 빈도.
  좋은 예: "직설적 자조 ('근데 이거 망했습니다'). 빈도 낮음. 정보 중심 사이 1~2 문장..."

- **vocabulary** — 반복 용어·즐겨 쓰는 표현·비유.
  좋은 예: "반복: '실험', '현장', 'MVP', 'PMF'. 표현: '압도적', '현실 검증'. 비유: '판을 바꾸다'..."

- **rhythm** — 문장 길이 변주·반복 구조·대구.
  좋은 예: "짧은 후킹 → 긴 설명 → 짧은 마무리. 병렬 구조 '~하고, ~하며'..."

- **taboos** — items 배열. Q3 답변 + 일반 상투어 모두 포함. 7~10개.
  예 items: ["'여러분 안녕하세요' 인사 금지", "느낌표 남발 금지", "영문 대문자 라벨 금지"]

- **reproduction_checklist** — items 배열. "~했는가?" 형태. 5~7개.
  예 items: ["첫 문장에 숫자 또는 단정형이 있는가?", "한 단락을 1~2 문장으로 유지했는가?"]

# 응답 형식
JSON 객체 하나만. 마크다운 코드펜스 없이:
{
  "identity": {"text": "..."},
  "audience": {"text": "..."},
  "content_patterns": {"text": "..."},
  "hooking_style": {"text": "..."},
  "sentence_style": {"text": "..."},
  "ending_signature": {"text": "..."},
  "thought_development": {"text": "..."},
  "emotional_distance": {"text": "..."},
  "humor": {"text": "..."},
  "vocabulary": {"text": "..."},
  "rhythm": {"text": "..."},
  "taboos": {"items": ["...", "..."]},
  "reproduction_checklist": {"items": ["...", "..."]}
}`

  const { data } = await safeGenerate({
    model: chatModel,
    prompt,
    schema: OUTPUT,
    extractJson: 'object',
    maxRetries: 1,
  })
  return data
}

// ============================================================
// 내부 — Pass N: Self-refinement (critique + rewrite 단일 호출)
// ============================================================
async function refineOnce(
  orgName: string,
  answers: GenerateAnswers,
  prev: SlotsDraft,
  passNumber: number,
): Promise<SlotsDraft> {
  const prompt = `당신은 "${orgName}" 브랜드 페르소나의 편집자입니다.
아래는 이전 패스에서 생성된 초안입니다. 이걸 더 날카롭게 다듬으십시오.

# 이번 패스 (${passNumber}차)에서 중점적으로 확인할 약점 체크리스트
1. **합쇼체 불일치**: "-에요/-어요", "~임" 같은 명사형이 섞여 있지 않은가?
2. **너무 일반적**: 어느 동아리에나 쓸 수 있는 평범한 문장이 아닌가? (식별 가능성)
3. **씨앗 답변과의 불일치**: Q1/Q2/Q3와 어긋나는 슬롯이 없는가?
4. **슬롯 간 톤 불통일**: identity는 격식, humor는 과격처럼 모순된 인격이 아닌가?
5. **재현 불가능**: "멋있게" 같은 추상적 표현만 있어 누가 봐도 같은 문장을 못 쓰는 슬롯이 있는가?
6. **taboos/reproduction_checklist 얕음**: 실제로 검증 가능한 항목인가?
7. **상투어**: "우리만의 특별한", "세상을 바꾸는" 같은 브랜딩 클리셰가 남아 있는가?

# 지시
- 위 체크리스트 7개 중 해당되는 것을 내부적으로 찾아 **문장을 실제로 바꾸십시오**.
- 전체 JSON 구조는 유지. 모든 슬롯을 다 바꿀 필요 없음 — 개선이 필요한 곳만.
- 이전보다 **구체적이고 재현 가능하게**.
- 합쇼체 100% 일관.

# 원래 씨앗 답변 (참고용 — 방향 이탈 방지)
Q1: ${answers.identity_seed}
Q2: ${answers.audience_seed}
Q3: ${answers.taboos_seed}

# 이전 초안
${JSON.stringify(prev, null, 2)}

# 응답 형식
JSON 객체 하나만. 모든 슬롯 포함 (수정 안 한 슬롯도 그대로 포함):
{"identity": {...}, "audience": {...}, ... }`

  const { data } = await safeGenerate({
    model: chatModel,
    prompt,
    schema: OUTPUT,
    extractJson: 'object',
    maxRetries: 1,
  })
  return data
}
