/**
 * Persona 상속 엔진
 *
 * 부모→자식 체인을 순서대로 merge해서 최종 ResolvedPersona를 만든다.
 * 순수 함수. DB 접근은 호출 측에서 담당.
 *
 * merge 전략 3가지:
 *   - full_inherit: 부모 값 고정, 자식 편집 잠금 (소속 맥락)
 *   - extend:       부모 배열 + 자식 배열 concat, 중복 제거 (taboos)
 *   - override:     자식 값이 완전 덮어쓰기 (후킹, 어미)
 *
 * 정책 확정:
 *   - 어느 조상이라도 locked=true 필드는 effectively_locked=true
 *   - full_inherit은 자식 값이 있어도 부모 값 사용 (사실상 locked와 동일하지만
 *     의도를 분리해서 표현. locked는 "편집 금지", full_inherit은 "합성 시 부모 우선")
 */

import type {
  FieldKey,
  PersonaFieldRow,
  PersonaRow,
  ResolvedField,
  ResolvedPersona,
} from './types'
import { FIELD_KEYS } from './types'

export interface PersonaWithFields {
  persona: PersonaRow
  fields: PersonaFieldRow[]
}

/**
 * 부모 → 자식 순서로 체인을 받아 merge.
 * chain[0]이 최상위 조상, chain[chain.length-1]이 leaf 페르소나.
 *
 * 체인 fetch는 호출 측에서 parent_persona_id를 따라가며 수행.
 * 순환 참조는 DB 레벨에서 방지하지 않으므로 호출 측이 depth 제한(예: 5)을 걸어야 함.
 */
export function resolvePersonaChain(
  chain: PersonaWithFields[],
): ResolvedPersona {
  if (chain.length === 0) {
    throw new Error('resolvePersonaChain: empty chain')
  }

  const leaf = chain[chain.length - 1]!
  const ancestors = chain.slice(0, -1).map((n) => n.persona)

  const fields: Partial<Record<FieldKey, ResolvedField>> = {}

  for (const key of FIELD_KEYS) {
    const resolved = resolveOneField(key, chain)
    if (resolved !== null) {
      fields[key] = resolved
    }
  }

  return {
    persona: leaf.persona,
    ancestors,
    fields,
  }
}

/**
 * 단일 필드를 체인 전체에 대해 merge.
 * 반환 null = 어느 페르소나에도 이 필드가 정의돼 있지 않음.
 */
function resolveOneField(
  key: FieldKey,
  chain: PersonaWithFields[],
): ResolvedField | null {
  // 조상 중 하나라도 locked면 자식은 편집 불가.
  let effectivelyLocked = false
  const contributingIds: string[] = []

  // 최종 값 계산: 체인 순서대로 각 노드의 merge_strategy에 따라 적용.
  // full_inherit을 만나면 그 시점 값으로 고정 (이후 자식의 해당 필드는 무시).
  let currentValue: Record<string, unknown> | null = null
  let currentSource: ResolvedField['source'] = 'manual'
  let currentConfidence = 1.0
  let currentMergeStrategy: ResolvedField['merge_strategy'] = 'override'
  let fullInheritLocked = false

  for (const node of chain) {
    const field = node.fields.find((f) => f.field_key === key)
    if (!field) continue

    if (field.locked) effectivelyLocked = true

    if (fullInheritLocked) {
      // 이미 조상에서 full_inherit으로 고정됨 → 이 노드의 값은 무시.
      // 단 자식 쪽 locked 표시는 반영.
      continue
    }

    if (currentValue === null) {
      currentValue = field.value
      currentSource = field.source
      currentConfidence = field.confidence
      currentMergeStrategy = field.merge_strategy
      contributingIds.push(field.persona_id)
      if (field.merge_strategy === 'full_inherit') {
        fullInheritLocked = true
        effectivelyLocked = true
      }
      continue
    }

    // 이미 값이 있는 상태에서 다음 노드 적용.
    // 자식 노드의 merge_strategy 대신 "부모가 허락한 방식"으로 합쳐야 한다.
    // 즉 현재 누적된 merge_strategy(=부모 쪽)를 기준으로 분기.
    if (currentMergeStrategy === 'full_inherit') {
      fullInheritLocked = true
      effectivelyLocked = true
      continue
    }

    if (currentMergeStrategy === 'extend') {
      currentValue = extendMerge(currentValue, field.value)
      currentSource = field.source
      currentConfidence = Math.min(currentConfidence, field.confidence)
      contributingIds.push(field.persona_id)
      // extend는 유지 (계속 누적 가능)
      currentMergeStrategy = field.merge_strategy
      continue
    }

    // override: 자식 값으로 완전 덮어쓰기.
    currentValue = field.value
    currentSource = field.source
    currentConfidence = field.confidence
    currentMergeStrategy = field.merge_strategy
    contributingIds.splice(0, contributingIds.length, field.persona_id)
    if (field.merge_strategy === 'full_inherit') {
      fullInheritLocked = true
      effectivelyLocked = true
    }
  }

  if (currentValue === null) return null

  return {
    field_key: key,
    value: currentValue,
    source: currentSource,
    merge_strategy: currentMergeStrategy,
    confidence: currentConfidence,
    contributing_persona_ids: contributingIds,
    effectively_locked: effectivelyLocked,
  }
}

/**
 * extend merge: jsonb 값의 구조에 따라 concat.
 *
 * 규칙:
 *   - 양쪽이 { items: unknown[] } 모양이면 items 배열을 concat + dedupe
 *   - 양쪽이 순수 배열로 저장된 jsonb면 직접 concat
 *   - 그 외(객체)는 shallow spread (자식 키가 부모 키를 덮어씀)
 *
 * taboos 같은 배열형 슬롯은 { items: [...] } 규약으로 저장할 것을 권장.
 * R2에서 슬롯별 스키마 확정 시 이 함수가 슬롯별로 분기될 수 있음.
 */
function extendMerge(
  parent: Record<string, unknown>,
  child: Record<string, unknown>,
): Record<string, unknown> {
  const parentItems = parent['items']
  const childItems = child['items']
  if (Array.isArray(parentItems) && Array.isArray(childItems)) {
    const merged = [...parentItems, ...childItems]
    const deduped = dedupePrimitives(merged)
    return { ...parent, ...child, items: deduped }
  }

  // 배열형 jsonb 자체가 객체로 래핑되지 않은 경우는 잘못된 사용이지만
  // 런타임 안전을 위해 spread로 처리.
  return { ...parent, ...child }
}

function dedupePrimitives(arr: unknown[]): unknown[] {
  const seen = new Set<string>()
  const out: unknown[] = []
  for (const item of arr) {
    const key =
      typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
        ? String(item)
        : JSON.stringify(item)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}
