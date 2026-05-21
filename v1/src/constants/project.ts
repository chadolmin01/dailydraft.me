/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  PROJECT ENUMS — 단일 진실의 원천 (Single Source of Truth)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 *  프로젝트의 유형, 상태, 위치, 시간, 보수 등 열거형 상수.
 *  DB에는 value(영문)가 저장됩니다. label 변경 시 DB 영향 없음.
 *
 *  사용처:
 *    - 프로젝트 생성/수정 폼
 *    - 프로젝트 상세 페이지 표시
 *    - Explore 필터 (유형)
 *    - API 유효성 검사
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/* ── 프로젝트 유형 ─────────────────────────────────────────── */

export interface EnumDef {
  /** DB 저장값. 절대 변경 금지 — 변경 시 DB 마이그레이션 필요 */
  value: string
  /** UI 표시 라벨. 자유롭게 변경 가능 */
  label: string
}

/**
 * 프로젝트 유형. opportunities.type에 value가 저장됨.
 *
 * NOTE: 과거 'team_building' 값이 DB에 존재할 수 있음.
 *       → normalizeProjectType()으로 'startup'에 매핑됨.
 */
export const PROJECT_TYPES: EnumDef[] = [
  { value: 'side_project', label: '함께 만들기' },
  { value: 'startup',      label: '창업 준비' },
  { value: 'study',        label: '함께 배우기' },
]

/** 유효한 프로젝트 유형 value 목록 (API 유효성 검사용) */
export const PROJECT_TYPE_VALUES = PROJECT_TYPES.map(t => t.value)

/** 'team_building' 등 레거시 값 정규화 */
export function normalizeProjectType(type: string): string {
  if (type === 'team_building') return 'startup'
  return type
}

/** value → label */
export function projectTypeLabel(value: string): string {
  const normalized = normalizeProjectType(value)
  return PROJECT_TYPES.find(t => t.value === normalized)?.label ?? value
}

/* ── 프로젝트 상태 ─────────────────────────────────────────── */

/**
 * opportunities.status에 저장되는 값.
 * 프론트에서 상태 비교 시 반드시 이 상수를 사용할 것.
 */
export const PROJECT_STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  FILLED: 'filled',
} as const

export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS]

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  [PROJECT_STATUS.ACTIVE]: '모집중',
  [PROJECT_STATUS.CLOSED]: '마감',
  [PROJECT_STATUS.FILLED]: '모집 완료',
}

/* ── 위치 타입 ─────────────────────────────────────────────── */

/**
 * opportunities.location_type에 저장되는 값.
 *
 * IMPORTANT: 과거 'offline'과 'onsite'가 혼용되었음.
 *            DB 마이그레이션으로 'offline' → 'onsite'로 통일함.
 *            코드에서는 반드시 'onsite'만 사용할 것.
 */
export const LOCATION_TYPES: EnumDef[] = [
  { value: 'remote',  label: '원격' },
  { value: 'hybrid',  label: '하이브리드' },
  { value: 'onsite',  label: '오프라인' },
]

export const LOCATION_TYPE_VALUES = LOCATION_TYPES.map(l => l.value)

export function locationTypeLabel(value: string): string {
  // 하위 호환: 'offline' → 'onsite'
  const normalized = value === 'offline' ? 'onsite' : value
  return LOCATION_TYPES.find(l => l.value === normalized)?.label ?? value
}

/* ── 시간 투자 ─────────────────────────────────────────────── */

export const TIME_COMMITMENTS: EnumDef[] = [
  { value: 'part_time', label: '파트타임' },
  { value: 'full_time', label: '풀타임' },
]

export function timeCommitmentLabel(value: string): string {
  return TIME_COMMITMENTS.find(t => t.value === value)?.label ?? value
}

/* ── 보수 타입 ─────────────────────────────────────────────── */

/**
 * opportunities.compensation에 저장되는 값.
 *
 * IMPORTANT: 과거 'paid'가 사용된 코드가 있었음.
 *            정식 값은 'salary'임. 'paid' 사용 금지.
 */
export const COMPENSATION_TYPES: EnumDef[] = [
  { value: 'unpaid', label: '무급' },
  { value: 'equity', label: '지분' },
  { value: 'salary', label: '유급' },
  { value: 'hybrid', label: '혼합' },
]

export function compensationLabel(value: string): string {
  // 하위 호환: 'paid' → 'salary'
  const normalized = value === 'paid' ? 'salary' : value
  return COMPENSATION_TYPES.find(c => c.value === normalized)?.label ?? value
}

/* ── Application 상태 ──────────────────────────────────────── */

export const APPLICATION_STATUS = {
  PENDING:  'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const

export type ApplicationStatus = (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS]

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  [APPLICATION_STATUS.PENDING]:  '대기중',
  [APPLICATION_STATUS.ACCEPTED]: '수락됨',
  [APPLICATION_STATUS.REJECTED]: '거절됨',
}
