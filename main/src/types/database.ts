/**
 * Supabase Database 타입 — Generated + 수동 Row 타입 (cast 패턴).
 *
 * 구조:
 * - `./database.generated.ts` : `supabase gen types typescript` CLI 출력.
 *   CI가 주기적으로 덮어쓴다고 가정하고 수동 수정 금지.
 *
 * - 이 파일(`./database.ts`) : Generated를 그대로 re-export. Persona 테이블은
 *   Database 타입에 포함시키지 않음(intersection 하면 다른 테이블 Row가 never로
 *   해석되는 Supabase client 호환성 이슈).
 *
 * Persona 호출 관례:
 *   // SELECT
 *   const { data } = await supabase
 *     .from('personas' as never)
 *     .select('*')
 *     .eq('id', id)
 *     .maybeSingle<PersonaRow>()
 *
 *   // INSERT / UPDATE / UPSERT
 *   await supabase
 *     .from('persona_training_runs' as never)
 *     .insert({ ... } as never)
 *
 * 왜 이런 cast: Supabase가 알려진 테이블 enum 체크로 `from()` 인자를 좁히는데,
 * persona_* 는 아직 enum에 없어서 거기서 infinite instantiation 발생.
 * `as never` 는 그 체크를 우회. 런타임엔 문자열 그대로 전달되므로 동작 무해.
 * CLI가 persona 테이블을 반영하면 이 cast들은 안전하게 제거 가능.
 */

export type { Database, Json } from './database.generated'
export { Constants } from './database.generated'
export type { Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes } from './database.generated'

// ============================================================
// Persona 테이블 Row 타입 — CLI 미반영분
// ============================================================

export interface PersonaRow {
  id: string
  type: string
  owner_id: string
  parent_persona_id: string | null
  name: string
  version: number
  status: string
  created_by: string | null
  created_at: string
  updated_at: string
  owner_last_edited_at: string | null
}

export interface PersonaFieldRow {
  id: string
  persona_id: string
  field_key: string
  value: unknown
  source: string
  merge_strategy: string
  confidence: number
  locked: boolean
  updated_by: string | null
  updated_at: string
}

export interface PersonaCorpusSourceRow {
  id: string
  persona_id: string
  source_type: string
  source_ref: string
  weight: number
  role_weight_rules: unknown
  active: boolean
  last_synced_at: string | null
  created_at: string
}

export interface PersonaTrainingRunRow {
  id: string
  persona_id: string
  corpus_snapshot_hash: string | null
  extracted_diff: unknown
  model_version: string | null
  trigger: string
  status: string
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface PersonaOutputRow {
  id: string
  persona_id: string
  bundle_id: string | null
  channel_format: string | null
  format_constraints: unknown
  content: unknown
  status: string
  created_at: string
  updated_at: string
  [key: string]: unknown
}

export interface PersonaOutputBundleRow {
  id: string
  persona_id: string
  event_type: string
  event_metadata: unknown
  status: string
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

export interface PersonaChannelCredentialRow {
  id: string
  persona_id: string
  channel: string
  credentials: unknown
  active: boolean
  created_at: string
  updated_at: string
}
