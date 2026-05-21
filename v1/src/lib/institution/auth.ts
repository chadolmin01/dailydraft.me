import { createClient } from '@/src/lib/supabase/server'

/**
 * 현재 사용자가 기관 admin인지 확인하고 institution_id를 반환
 * @returns institution_id or null (not admin)
 */
export async function getInstitutionId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('institution_members')
    .select('institution_id')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .eq('status', 'active')
    .limit(1)
    .single()
  return data?.institution_id ?? null
}

/** POST에서 받는 role 값 검증 (admin 역할 부여 방지) */
export const ASSIGNABLE_ROLES = ['student', 'mentor'] as const
export type AssignableRole = typeof ASSIGNABLE_ROLES[number]

export function isAssignableRole(role: string): role is AssignableRole {
  return (ASSIGNABLE_ROLES as readonly string[]).includes(role)
}
