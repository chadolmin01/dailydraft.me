/**
 * Persona Slot Extractor (R2)
 *
 * corpus(가중치 적용된 Discord 메시지) → Gemini Flash Lite → 슬롯별 구조화 값 + confidence.
 *
 * 구조:
 *   - 슬롯별로 독립된 추출 함수 (부분 실패 격리).
 *   - 각 함수는 Zod 스키마로 output 검증 → safeGenerate로 재시도.
 *   - R1에서 단순화한 { text: string } 값 구조를 그대로 유지하되,
 *     일부 슬롯(taboos, reproduction_checklist, ending_signature)은 { items: string[] }로 저장.
 *
 * 비용 근거: Gemini 2.5 Flash-Lite, 클럽당 월 $0.05 (memory: 비용 검증 2026-04-11).
 */

import { z } from 'zod'
import { chatModel } from '@/src/lib/ai/gemini-client'
import { safeGenerate } from '@/src/lib/ai/safe-generate'
import type { WeightedMessage } from './corpus'
import { formatCorpusForPrompt } from './corpus'
import type { FieldKey } from './types'

/** 개별 슬롯 추출 결과. */
export interface ExtractedSlot {
  field_key: FieldKey
  value: Record<string, unknown>
  confidence: number
  /** 추출 과정에서 발생한 에러 (있으면 해당 슬롯은 skip). */
  error?: string
}

/** 전체 추출 결과. training_runs.extracted_diff에 저장. */
export interface ExtractionResult {
  slots: ExtractedSlot[]
  /** 성공한 슬롯 수 / 전체 시도 수 */
  success_count: number
  total_count: number
  /** 사용한 corpus 요약 (snapshot_hash 계산용) */
  corpus_summary: {
    message_count: number
    channel_count: number
    date_range: { earliest: string; latest: string } | null
  }
}

const SLOT_TEXT = z.object({ text: z.string().min(1) })
const SLOT_ITEMS = z.object({ items: z.array(z.string().min(1)).min(1) })
const SLOT_STYLE = z.object({
  avg_length: z.number().optional(),
  paragraphs_per_post: z.number().optional(),
  linebreak_rule: z.string().optional(),
  conjunctions: z.array(z.string()).optional(),
  text: z.string().optional(),
})
const SLOT_ENDING = z.object({
  top_endings: z.array(
    z.object({
      ending: z.string(),
      percentage: z.number(),
      example: z.string().optional(),
    }),
  ),
  written_to_spoken_ratio: z.string().optional(),
})
const SLOT_HOOKING = z.object({
  patterns: z.array(
    z.object({
      name: z.string(),
      percentage: z.number(),
      example: z.string().optional(),
    }),
  ),
  avg_length_words: z.number().optional(),
  examples: z.array(z.string()).optional(),
})

type SlotSchema<T = unknown> = {
  schema: z.ZodType<T>
  prompt: (corpus: string, orgName: string) => string
}

const SLOT_SPECS: Record<FieldKey, SlotSchema> = {
  identity: {
    schema: SLOT_TEXT,
    prompt: (corpus, org) => `아래는 "${org}"라는 동아리의 Discord 대화 모음입니다.
가중치(weight)가 높은 메시지는 운영진/공지/반응 많은 것으로, 동아리의 "공식 얼굴"에 가깝습니다.

이 동아리가 "누구인지" 외부에 보여줄 한 문단으로 요약하세요.
규칙:
- 3~5문장
- 소속(학교/상위조직/기수)이 있으면 반드시 포함
- "-입니다/-습니다" 합쇼체
- 과장·홍보 문구 금지

반드시 JSON으로만 응답: {"text": "..."}

[corpus]
${corpus}`,
  },

  audience: {
    schema: SLOT_TEXT,
    prompt: (corpus, org) => `"${org}"의 Discord 대화를 분석해, 이 조직이 외부로 발화할 때의 "타깃 독자"를 정의하세요.
- 연령/직군/관심사/고민(FOMO 등) 포함
- 3~5문장, 합쇼체
JSON: {"text": "..."}

[corpus]
${corpus}`,
  },

  content_patterns: {
    schema: SLOT_TEXT,
    prompt: (corpus, org) => `"${org}" 멤버들이 반응이 좋았던 메시지(reactions 높음, weight 높음)를 참고해,
이 조직이 외부 SNS/공지에 올릴 때 "어떤 형태·주제의 콘텐츠가 반응이 좋을지" 패턴을 도출하세요.
- 2~4개 패턴을 서술식으로
- 구체 예시 1개 포함
- 합쇼체

JSON: {"text": "..."}

[corpus]
${corpus}`,
  },

  hooking_style: {
    schema: SLOT_HOOKING,
    prompt: (corpus, org) => `"${org}"의 대화에서 반응이 좋았던 메시지의 "첫 1~2문장" 패턴을 분석하세요.
아래 JSON만 응답:
{
  "patterns": [
    {"name": "경탄/이모지형", "percentage": 40, "example": "실제 corpus에서 뽑은 짧은 문장"},
    {"name": "단정적 고백형", "percentage": 30, "example": "..."}
  ],
  "avg_length_words": 10,
  "examples": ["실제 corpus 문장 3~5개"]
}

[corpus]
${corpus}`,
  },

  sentence_style: {
    schema: SLOT_STYLE,
    prompt: (corpus, org) => `"${org}" 대화를 바탕으로 문장 스타일 DNA를 추출하세요.
아래 JSON:
{
  "avg_length": 15,
  "paragraphs_per_post": 3,
  "linebreak_rule": "의미 단위마다 빈 줄",
  "conjunctions": ["특히", "근데", "사실"],
  "text": "한 문단 요약 (합쇼체)"
}

[corpus]
${corpus}`,
  },

  ending_signature: {
    schema: SLOT_ENDING,
    prompt: (corpus, org) => `"${org}" 메시지에서 실제 사용된 "어미"들의 빈도 순위를 Top 5로 추출하세요.
한국어 종결 어미(-입니다/-습니다/-네요/-해요/명사형 등)를 기준으로.
JSON:
{
  "top_endings": [
    {"ending": "-입니다", "percentage": 45, "example": "압도적인 퀄리티입니다"},
    ...
  ],
  "written_to_spoken_ratio": "8:2"
}

[corpus]
${corpus}`,
  },

  thought_development: {
    schema: SLOT_TEXT,
    prompt: (corpus, org) => `"${org}"의 긴 메시지/공지에서 논리 전개 방식(도입→핵심→분석→결론)을 분석해
한 문단으로 요약. 대조/반전 빈도, 결론 유형도 언급. 합쇼체.
JSON: {"text": "..."}

[corpus]
${corpus}`,
  },

  emotional_distance: {
    schema: SLOT_TEXT,
    prompt: (corpus, org) => `"${org}"의 톤이 독자와 얼마나 가깝거나 먼지(선배/동료/관찰자),
자신감 수준, 자기노출 정도를 한 문단으로 서술. 합쇼체.
JSON: {"text": "..."}

[corpus]
${corpus}`,
  },

  humor: {
    schema: SLOT_TEXT,
    prompt: (corpus, org) => `"${org}" 대화의 유머 기제(직설적 비판, 자조, 의외성 등)와 빈도를
실제 예시 1~2개와 함께 서술. 유머가 없으면 "유머 없음"이라고 기술. 합쇼체.
JSON: {"text": "..."}

[corpus]
${corpus}`,
  },

  vocabulary: {
    schema: SLOT_TEXT,
    prompt: (corpus, org) => `"${org}" 대화에서 반복 등장하는 전문용어, 즐겨 쓰는 표현, 비유/직유를
카테고리별로 정리. 합쇼체 한 문단.
JSON: {"text": "..."}

[corpus]
${corpus}`,
  },

  rhythm: {
    schema: SLOT_TEXT,
    prompt: (corpus, org) => `"${org}" 메시지의 문장 길이 변주 패턴(짧은/긴 교차), 반복 구조, 대구법 사용을
한 문단으로 서술. 합쇼체.
JSON: {"text": "..."}

[corpus]
${corpus}`,
  },

  taboos: {
    schema: SLOT_ITEMS,
    prompt: (corpus, org) => `"${org}"의 톤에 맞지 않는 "하지 말아야 할 것" 목록을 도출하세요.
기준:
- corpus에서 관찰되지 않는 상투어(예: 여러분 안녕하세요)
- 과도한 느낌표·이모지
- 모호한 감성 표현
- 해당 도메인 특유의 금기

JSON: {"items": ["항목1", "항목2", ...]}
7~12개.

[corpus]
${corpus}`,
  },

  reproduction_checklist: {
    schema: SLOT_ITEMS,
    prompt: (corpus, org) => `"${org}"의 톤을 재현하기 위한 자가 점검 체크리스트를 만드세요.
각 항목은 "~했는가?" 형태의 질문. 5~8개.
JSON: {"items": ["첫 문장에 ... 했는가?", ...]}

[corpus]
${corpus}`,
  },
}

/**
 * 단일 슬롯 추출.
 */
async function extractOneSlot(
  key: FieldKey,
  corpus: string,
  orgName: string,
): Promise<ExtractedSlot> {
  const spec = SLOT_SPECS[key]
  try {
    const { data } = await safeGenerate({
      model: chatModel,
      prompt: spec.prompt(corpus, orgName),
      schema: spec.schema,
      extractJson: 'object',
      maxRetries: 1,
    })

    // 기본 confidence 산정: corpus가 풍부할수록 높게.
    // 짧은 corpus (<2000자)면 0.5, 중간 (<5000)면 0.7, 충분하면 0.85.
    // R2에서는 단순 규칙만. R3에서 LLM에게 self-rating 요청 가능.
    const confidence =
      corpus.length > 5000 ? 0.85 : corpus.length > 2000 ? 0.7 : 0.5

    return {
      field_key: key,
      value: data as Record<string, unknown>,
      confidence,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[persona/extract] slot=${key} 실패:`, message)
    return {
      field_key: key,
      value: {},
      confidence: 0,
      error: message,
    }
  }
}

/**
 * 전체 슬롯 추출. 병렬 실행하되 Gemini rate limit을 고려해 청크 분할.
 * CHUNK_SIZE=4 → 동시 4슬롯. 13슬롯 전체는 약 3~4 라운드.
 */
const CHUNK_SIZE = 4

interface ExtractOptions {
  /** 페르소나가 속한 조직명. 프롬프트 "${org}" 자리에 들어감. */
  orgName: string
  /** 추출할 슬롯을 제한하려면 명시. 기본: 전체 13슬롯. */
  targetSlots?: FieldKey[]
}

export async function extractSlotsFromCorpus(
  messages: WeightedMessage[],
  options: ExtractOptions,
): Promise<ExtractionResult> {
  const corpus = formatCorpusForPrompt(messages)
  const keys = options.targetSlots ?? (Object.keys(SLOT_SPECS) as FieldKey[])

  const slots: ExtractedSlot[] = []
  for (let i = 0; i < keys.length; i += CHUNK_SIZE) {
    const chunk = keys.slice(i, i + CHUNK_SIZE)
    const results = await Promise.all(
      chunk.map((k) => extractOneSlot(k, corpus, options.orgName)),
    )
    slots.push(...results)
  }

  const timestamps = messages.map((m) => m.timestamp).sort()
  const channels = new Set(messages.map((m) => m.source_ref))

  return {
    slots,
    success_count: slots.filter((s) => !s.error && s.confidence > 0).length,
    total_count: keys.length,
    corpus_summary: {
      message_count: messages.length,
      channel_count: channels.size,
      date_range:
        timestamps.length > 0
          ? { earliest: timestamps[0]!, latest: timestamps[timestamps.length - 1]! }
          : null,
    },
  }
}
