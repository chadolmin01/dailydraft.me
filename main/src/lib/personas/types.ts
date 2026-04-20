/**
 * Persona Engine - Type Definitions (R1)
 *
 * DB 스키마(20260418120000_create_persona_engine_core.sql)와 1:1 대응.
 * jsonb 컬럼(value, input_context 등)은 R1에서는 Record<string, unknown>으로
 * 느슨하게 두고, 슬롯별 스키마는 R2(자동 추출 파이프라인) 시점에 확정한다.
 */

// ============================================================
// 열거형
// ============================================================
export type PersonaType = 'club' | 'project' | 'personal'

export type PersonaStatus = 'draft' | 'active' | 'archived'

export type FieldSource = 'auto' | 'manual' | 'inherited'

export type MergeStrategy = 'full_inherit' | 'extend' | 'override'

/**
 * 페르소나 슬롯 카탈로그. DB CHECK 제약과 동일하게 유지.
 * 새 슬롯 추가 시 마이그레이션 + 여기 + field-catalog.ts 셋 다 업데이트.
 */
export const FIELD_KEYS = [
  'identity',
  'content_patterns',
  'audience',
  'sentence_style',
  'ending_signature',
  'thought_development',
  'hooking_style',
  'emotional_distance',
  'humor',
  'vocabulary',
  'rhythm',
  'taboos',
  'reproduction_checklist',
] as const

export type FieldKey = (typeof FIELD_KEYS)[number]

export type CorpusSourceType =
  | 'discord_channel'
  | 'discord_server'
  | 'github_repo'
  | 'sns_account'
  | 'notion_page'
  | 'draft_internal'

export type TrainingTrigger =
  | 'initial'
  | 'weekly'
  | 'event'
  | 'manual'
  | 'rejection_feedback'

export type TrainingStatus = 'running' | 'completed' | 'failed'

export type OutputStatus = 'draft' | 'approved' | 'published' | 'rejected'

// ============================================================
// R3 — Output Bundles
// ============================================================

/**
 * 11개 표준 이벤트 타입. DB CHECK 제약과 일치시켜야 함.
 * 새 이벤트 추가 시: DB 마이그레이션 + EVENT_CONFIG + 여기 3곳 동기화.
 */
export const EVENT_TYPES = [
  'recruit_teaser',
  'recruit_open',
  'recruit_close',
  'onboarding',
  'project_kickoff',
  'weekly_update',
  'monthly_recap',
  'mid_showcase',
  'sponsor_outreach',
  'final_showcase',
  'semester_report',
  'vacation_harvest',
  // ★ 2026-04-19 추가: 범용 공지. 서브카테고리는 event_metadata.category로 구분.
  //   일반공지 · 모임안내 · 이벤트공지 · 스터디모집 · 후기 등 자유 확장.
  'announcement',
] as const
export type EventType = (typeof EVENT_TYPES)[number]

/**
 * R3.1에서 구현하는 5개 채널 포맷.
 * 나머지는 R3.2+에서 추가 (YouTube shorts, X(Twitter), 카카오채널 등).
 */
export const CHANNEL_FORMATS = [
  'discord_forum_markdown',   // Discord 포럼 포스트 (자동 발행)
  'instagram_caption',        // 인스타 캡션 + 해시태그 (R3.1 복사, R3.4 자동)
  'linkedin_post',            // 링크드인 장문 (R3.1 복사, R3.4 자동)
  'everytime_post',           // 에브리타임 복사 전용 (영구 수동)
  'email_newsletter',         // 이메일 뉴스레터 (R3.4 자동 발송)
  'threads_post',             // Threads 포스트 (R3.1 복사, R3.4 자동)
] as const
export type ChannelFormat = (typeof CHANNEL_FORMATS)[number]

export type BundleStatus =
  | 'generating'
  | 'pending_approval'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'archived'

export interface PersonaOutputBundleRow {
  id: string
  persona_id: string
  event_type: EventType
  event_metadata: Record<string, unknown>
  status: BundleStatus
  semester_ref: string | null
  week_number: number | null
  created_by: string | null
  created_at: string
  updated_at: string
  approved_by: string | null
  approved_at: string | null
  rejected_reason: string | null
  published_at: string | null
}

export interface ClubSemesterCycleRow {
  id: string
  club_id: string
  semester_ref: string
  start_date: string
  end_date: string
  cohort_number: string | null
  is_active: boolean
  created_at: string
}

// ============================================================
// Persona Templates (스냅샷 저장·복원)
// ============================================================

/**
 * 템플릿에 저장되는 필드 스냅샷 항목.
 * persona_fields 컬럼 중 복원에 필요한 것만 보관:
 *   - 포함: value / source / locked / merge_strategy
 *   - 제외: confidence(추출 시점 가치 변함), updated_by/updated_at(새로 생성됨)
 */
export interface PersonaTemplateFieldSnapshot {
  field_key: FieldKey
  value: Record<string, unknown>
  source: FieldSource
  locked: boolean
  merge_strategy: MergeStrategy
}

export interface PersonaTemplateRow {
  id: string
  type: PersonaType
  owner_id: string
  name: string
  description: string | null
  fields_snapshot: PersonaTemplateFieldSnapshot[]
  source_persona_id: string | null
  created_by: string | null
  created_at: string
}

export interface PersonaChannelCredentialRow {
  id: string
  persona_id: string
  channel_type: string
  account_ref: string
  encrypted_token: string | null
  refresh_token_ref: string | null
  scope: string[]
  installed_by: string | null
  expires_at: string | null
  active: boolean
  created_at: string
  updated_at: string
}

// ============================================================
// 본체 레코드 (DB row 그대로)
// ============================================================
export interface PersonaRow {
  id: string
  type: PersonaType
  /** polymorphic. type에 따라 clubs.id / opportunities.id / auth.users.id */
  owner_id: string
  parent_persona_id: string | null
  name: string
  version: number
  status: PersonaStatus
  created_by: string | null
  created_at: string
  updated_at: string
  owner_last_edited_at: string | null
  /** AI 생성 시 parent 필드 참고 여부. project/personal 에서만 의미. default true. */
  inherit_from_parent: boolean | null
  /** term_end_at 도래 또는 수동 아카이브 시각. */
  archived_at: string | null
  /** 프로젝트 기수 종료 예정일. NULL 이면 자동 아카이브 없음. */
  term_end_at: string | null
}

export interface PersonaFieldRow {
  id: string
  persona_id: string
  field_key: FieldKey
  value: Record<string, unknown>
  source: FieldSource
  merge_strategy: MergeStrategy
  /** 0~1. auto 추출의 신뢰도. manual은 1.0. */
  confidence: number
  /** true면 자식 페르소나에서 편집 불가. */
  locked: boolean
  updated_by: string | null
  updated_at: string
}

export interface PersonaCorpusSourceRow {
  id: string
  persona_id: string
  source_type: CorpusSourceType
  /** channel_id / repo full_name / account handle 등 타입별 식별자. */
  source_ref: string
  weight: number
  role_weight_rules: Record<string, unknown>
  active: boolean
  last_synced_at: string | null
  created_at: string
}

export interface PersonaTrainingRunRow {
  id: string
  persona_id: string
  corpus_snapshot_hash: string | null
  extracted_diff: Record<string, unknown>
  model_version: string | null
  trigger: TrainingTrigger
  status: TrainingStatus
  error_message: string | null
  started_at: string
  completed_at: string | null
}

export interface PersonaOutputRow {
  id: string
  persona_id: string
  output_type: string
  prompt_template_id: string | null
  input_context: Record<string, unknown>
  generated_content: string
  destination: string | null
  status: OutputStatus
  rejected_reason: string | null
  approved_by: string | null
  approved_at: string | null
  published_at: string | null
  external_ref: string | null
  created_at: string
  updated_at: string
  // R3.1 추가 컬럼
  bundle_id: string | null
  channel_format: ChannelFormat | null
  format_constraints: Record<string, unknown> | null
  is_copy_only: boolean
  // Phase 2 추가 (예약 발행)
  scheduled_at: string | null
  scheduled_by: string | null
}

// ============================================================
// 런타임 해석 결과 (상속 merge 후)
// ============================================================

/**
 * resolvePersonaFields()가 반환하는 단일 필드.
 * - value: merge 후 최종 값
 * - origin: 이 값이 어느 페르소나(자신/부모/조부모)에서 기여했는지
 * - effectively_locked: 자식에서 편집 가능한지 (조상 중 하나라도 locked면 true)
 */
export interface ResolvedField {
  field_key: FieldKey
  value: Record<string, unknown>
  source: FieldSource
  merge_strategy: MergeStrategy
  confidence: number
  /** 값이 어느 페르소나 id에서 왔는지. extend 시 여러 개 가능. */
  contributing_persona_ids: string[]
  effectively_locked: boolean
}

export interface ResolvedPersona {
  persona: PersonaRow
  /** 상위 → 하위 순서의 조상 체인. leaf 페르소나 자신은 포함하지 않음. */
  ancestors: PersonaRow[]
  fields: Partial<Record<FieldKey, ResolvedField>>
}
