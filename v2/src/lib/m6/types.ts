/**
 * M6 Glossary v1.1 — TypeScript types (V1 사용 부분만 포함).
 *
 * 단일 진실 소스: v2/glossary/glossary.ts (tsconfig 에서 exclude — pipeline.ts 의
 * 외부 의존성 때문). 이 파일은 V1 코드가 import 할 수 있게 한 미러.
 * v1.1 의 AtomType / RelationType 은 FROZEN — 글로서리 버전 업 시에만 변경.
 *
 * 참조: v2/glossary/M6_Glossary_v1.1.md
 */

export const ATOM_TYPES = [
  'Requirement',
  'Deadline',
  'Constraint',
  'Deliverable',
  'Metric',
  'Narrative',
  'Event',
  'Question',
  'Decision',
  'Reference',
  'Definition',
  'Entity',
] as const

export type AtomType = (typeof ATOM_TYPES)[number]

export const RELATION_TYPES = [
  'requires',
  'fulfills',
  'references',
  'assigned_to',
  'produced_by',
  'temporally_after',
  'responds_to',
  'triggers',
  'approves',
  'evolves_to',
] as const

export type RelationType = (typeof RELATION_TYPES)[number]

/**
 * Provenance — Atom 의 출처 정보. 모든 Atom 에 필수.
 * V1 에서는 deterministic extractor 만 사용 (LLM X) → model = 'rules-v1'.
 */
export interface Provenance {
  source: {
    file_id: string
    /** 위치 식별자: 'filename' | 'path:<index>' (e.g. 'path:1') */
    location: string
    /** 추출된 원문 일부 (예: "3주차", "3팀") */
    raw_text: string
  }
  extracted_by: {
    model: string
    extractor_version: string
    extracted_at: string  // ISO 8601
  }
}

/**
 * Atom — 정보의 indivisible 단위. 모든 Atom 은 Provenance 가짐.
 *
 * V1 에서 추출되는 Atom 들:
 *   - type: 'Event'  content: '3주차'        (시간 단위 — 일정)
 *   - type: 'Entity' content: '3팀'          (조직 단위 — 주체)
 *
 * V2+ 에서 LLM extractor 가 추가 AtomType 들 (Deliverable, Deadline 등) 생성 예정.
 */
export interface Atom {
  id: string
  type: AtomType
  content: string
  confidence: number  // [0, 1]
  provenance: Provenance
  /** 동일 의미의 Atom 끼리 묶기 위한 키. 예: 'team:3팀', 'week:3' */
  canonical_key?: string
}

/** V1 deterministic extractor 의 메타 */
export const V1_EXTRACTOR = {
  model: 'rules-v1',
  extractor_version: 'm6-extractor-v1.1',
} as const

/** V1 의 deterministic extraction 은 ISO timestamp 만 필요 */
export function v1ExtractedBy(): Provenance['extracted_by'] {
  return {
    model: V1_EXTRACTOR.model,
    extractor_version: V1_EXTRACTOR.extractor_version,
    extracted_at: new Date().toISOString(),
  }
}
