/**
 * Slot Polisher (self-refinement 반복 루프 포함)
 *
 * 자연어 지시 → 현재 슬롯들을 일괄 rewrite.
 * 예: "더 격식있게", "GenZ 톤으로", "기술 전문가 독자 기준으로 다시"
 *
 * 2-pass 구조:
 *   Pass 1: 지시 반영 초안
 *   Pass 2: self-critique + 재조정 (지시를 실제로 반영했는지 스스로 점검)
 *
 * Gemini는 지시와 무관한 슬롯은 건드리지 않도록 유도.
 */

import { z } from 'zod'
import { chatModel } from '@/src/lib/ai/gemini-client'
import { safeGenerate } from '@/src/lib/ai/safe-generate'
import type { FieldKey, PersonaFieldRow } from './types'

export interface PolishInput {
  orgName: string
  currentFields: PersonaFieldRow[]
  instruction: string
  /** self-refinement 반복 횟수. 기본 1 (초안 + 1 refine = 2 호출). 최대 2. */
  iterations?: number
}

export interface PolishedSlot {
  field_key: FieldKey
  value: Record<string, unknown>
  changed: boolean
  error?: string
}

export interface PolishResult {
  slots: PolishedSlot[]
  changed_count: number
  skipped_count: number
  iterations_used: number
}

// 출력: 각 field_key → 수정된 value 객체 (수정 안 할 슬롯은 생략 가능)
const POLISH_OUTPUT = z
  .record(z.string(), z.object({}).passthrough())
  .describe('수정된 슬롯만 반환')

type PolishedMap = Record<string, Record<string, unknown>>

const DEFAULT_ITERATIONS = 1

export async function polishSlots(input: PolishInput): Promise<PolishResult> {
  const iterations = Math.min(
    Math.max(input.iterations ?? DEFAULT_ITERATIONS, 0),
    2,
  )

  const nonEmptyFields = input.currentFields.filter((f) => {
    const v = f.value as Record<string, unknown>
    return v && (typeof v.text === 'string' || Array.isArray(v.items))
  })
  if (nonEmptyFields.length === 0) {
    return { slots: [], changed_count: 0, skipped_count: 0, iterations_used: 0 }
  }

  const fieldMap = new Map(
    nonEmptyFields.map((f) => [f.field_key, f.value as Record<string, unknown>]),
  )

  try {
    // Pass 1 — initial polish
    let polished = await initialPolish(input, nonEmptyFields)

    // Pass 2..N — self-refinement
    for (let i = 0; i < iterations; i++) {
      try {
        polished = await refinePolish(
          input,
          nonEmptyFields,
          polished,
          i + 1,
        )
      } catch (err) {
        console.warn(
          `[slot-polisher] refine pass ${i + 1} 실패, 이전 버전 사용:`,
          (err as Error).message,
        )
      }
    }

    const slots: PolishedSlot[] = nonEmptyFields.map((f) => {
      const newValue = polished[f.field_key]
      if (newValue && typeof newValue === 'object') {
        // 실제로 값이 바뀌었는지 비교 (string-level)
        const changed =
          JSON.stringify(newValue) !== JSON.stringify(fieldMap.get(f.field_key))
        return {
          field_key: f.field_key,
          value: newValue,
          changed,
        }
      }
      return {
        field_key: f.field_key,
        value: (fieldMap.get(f.field_key) ?? {}) as Record<string, unknown>,
        changed: false,
      }
    })

    const changed = slots.filter((s) => s.changed).length
    return {
      slots,
      changed_count: changed,
      skipped_count: slots.length - changed,
      iterations_used: iterations,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[slot-polisher] 실패:', message)
    return {
      slots: nonEmptyFields.map((f) => ({
        field_key: f.field_key,
        value: f.value as Record<string, unknown>,
        changed: false,
        error: message,
      })),
      changed_count: 0,
      skipped_count: nonEmptyFields.length,
      iterations_used: 0,
    }
  }
}

// ============================================================
// Pass 1 — Initial Polish
// ============================================================
async function initialPolish(
  input: PolishInput,
  fields: PersonaFieldRow[],
): Promise<PolishedMap> {
  const currentJson = fields
    .map((f) => `  "${f.field_key}": ${JSON.stringify(f.value)}`)
    .join(',\n')

  const prompt = `당신은 "${input.orgName}"의 브랜드 톤 에디터입니다.
아래 지시에 따라 현재 슬롯들을 수정하십시오.

# 지시 (회장이 직접 입력)
${input.instruction}

# 현재 슬롯
{
${currentJson}
}

# 엄격한 규칙
1. 지시의 방향으로 **실제 문장을 바꿔야 합니다**. 동의어 치환만으로 "했다"고 주장하지 마십시오.
2. **합쇼체 유지** ("-습니다/-입니다"). 지시가 명시적으로 다른 어미를 요구하면 예외.
3. 각 슬롯의 구조 유지 (text / items).
4. **지시와 무관한 슬롯은 건드리지 마십시오**. 응답 JSON에서 해당 슬롯을 아예 제외.
5. 클리셰·과장 금지. 구체적 예시 포함 유지.

# 응답
수정한 슬롯만 포함한 JSON 하나:
{"슬롯키": {...}, ...}

수정할 필요 없는 슬롯은 JSON에서 생략.`

  const { data } = await safeGenerate({
    model: chatModel,
    prompt,
    schema: POLISH_OUTPUT,
    extractJson: 'object',
    maxRetries: 1,
  })
  return data as PolishedMap
}

// ============================================================
// Pass N — Self-refinement (지시 실제 반영 점검)
// ============================================================
async function refinePolish(
  input: PolishInput,
  originalFields: PersonaFieldRow[],
  prevPolished: PolishedMap,
  passNumber: number,
): Promise<PolishedMap> {
  // 이전 수정본과 원본을 병합한 current state를 보여줘야 정확한 비교 가능
  const originalMap = new Map(
    originalFields.map((f) => [f.field_key, f.value as Record<string, unknown>]),
  )
  const current: Record<string, Record<string, unknown>> = {}
  for (const [key, val] of originalMap.entries()) {
    current[key] = prevPolished[key] ?? val
  }

  const prompt = `당신은 "${input.orgName}"의 브랜드 편집자입니다.
이전 패스(${passNumber}차 refine 전)에서 수정된 슬롯 상태를 보고 다음을 스스로 점검하십시오.

# 지시 (원본)
${input.instruction}

# 점검 체크리스트
1. **지시 실제 반영**: 단순 단어 교체가 아니라 문장 톤이 실제로 바뀌었는가?
2. **합쇼체 일관**: 지시가 다른 어미를 요구하지 않는 한 유지됐는가?
3. **씨앗 불일치**: identity/audience와 모순되는 방향으로 튀진 않았는가?
4. **과잉 수정**: 지시와 무관한 슬롯까지 건드렸으면 원본으로 되돌려라.
5. **구체성 유지**: 수정 과정에서 예시가 사라져 추상적으로 변한 슬롯이 있는가?

# 현재 상태 (원본 + 이전 수정 반영)
${JSON.stringify(current, null, 2)}

# 지시
- 위 체크리스트에서 문제 있는 슬롯만 추가 수정.
- 수정 필요 없으면 해당 슬롯을 응답에서 생략.
- **무관한 슬롯이 수정됐다면 반드시 원본으로 되돌릴 것.**

# 응답
변경할 슬롯만 포함한 JSON (없으면 빈 객체):
{"슬롯키": {...}, ...} 또는 {}`

  const { data } = await safeGenerate({
    model: chatModel,
    prompt,
    schema: POLISH_OUTPUT,
    extractJson: 'object',
    maxRetries: 1,
  })

  // 병합: 이전 polished + 이번 pass의 추가 수정
  return { ...prevPolished, ...(data as PolishedMap) }
}
