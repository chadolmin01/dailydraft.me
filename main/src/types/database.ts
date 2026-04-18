/**
 * Supabase Database 타입.
 *
 * `./database.generated.ts` 는 `supabase gen types typescript --linked` CLI 출력.
 * CI/수동으로 주기적으로 재생성되며 수동 수정 금지. 이 파일은 그대로 re-export하는 얇은 레이어.
 *
 * 과거(2026-04-18) CLI 재생성이 뒤처져 persona 테이블이 누락된 시점엔 수동 Row 타입을
 * 여기서 유지했지만, `regen-db-types.yml` 워크플로우 도입 후에는 CLI가 즉시 반영하므로
 * 중복 타입을 제거함.
 */
export type { Database, Json } from './database.generated'
export { Constants } from './database.generated'
export type { Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes } from './database.generated'
