import type { SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Platform admin 체크 — H4 RLS 하드닝 (rls_audit_2026-04-18.md H4).
 *
 * 전환 전략: JWT `app_metadata.is_admin` → DB `platform_admins` 테이블.
 * 이 helper 는 **둘 다 허용하는 공존 단계**.
 * 후속 마이그레이션에서 JWT 폴백 제거 예정.
 *
 * 우선순위:
 *   1. JWT app_metadata.is_admin === true (백워드 호환, 빠름)
 *   2. platform_admins 테이블 조회 (단일 진실 소스)
 *
 * 사용 예:
 *   import { isPlatformAdmin } from '@/src/lib/auth/platform-admin'
 *   ...
 *   if (!(await isPlatformAdmin(supabase, user))) {
 *     return ApiResponse.unauthorized()
 *   }
 *
 * Note: 기존 `user.app_metadata?.is_admin !== true` 코드는 점진 교체.
 * 새로 작성하는 admin 라우트에서는 반드시 이 helper 사용.
 */
export async function isPlatformAdmin(
  supabase: SupabaseClient,
  user: User | null,
): Promise<boolean> {
  if (!user) return false

  // 1) JWT 클레임 (레거시, 빠름)
  if (user.app_metadata?.is_admin === true) return true

  // 2) DB 조회 (신규, 단일 진실 소스)
  try {
    const { data, error } = await supabase.rpc('is_platform_admin' as never, {
      p_user_id: user.id,
    } as never)
    if (error) {
      // RPC 실패 시 JWT 만 신뢰 — 이미 false 반환한 상태
      console.warn('[is_platform_admin] RPC failed, falling back to JWT-only:', error.message)
      return false
    }
    return data === true
  } catch (err) {
    console.warn('[is_platform_admin] Exception:', err)
    return false
  }
}

/**
 * Superadmin 체크 — 플랫폼 전체 조작 권한이 필요한 케이스 (다른 admin 부여·박탈 등).
 */
export async function isPlatformSuperadmin(
  supabase: SupabaseClient,
  user: User | null,
): Promise<boolean> {
  if (!user) return false

  if (user.app_metadata?.is_superadmin === true) return true

  try {
    const { data, error } = await supabase.rpc('is_platform_superadmin' as never, {
      p_user_id: user.id,
    } as never)
    if (error) return false
    return data === true
  } catch {
    return false
  }
}
