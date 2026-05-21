// V2 스키마 진행에 따라 `supabase gen types typescript --linked > database.ts` 로 덮어쓸 자리.
// 지금은 빈 스키마 stub — public 테이블이 추가될 때마다 재생성.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
