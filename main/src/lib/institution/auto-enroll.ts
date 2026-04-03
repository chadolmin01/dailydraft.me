import { createClient } from '@/src/lib/supabase/server'

/**
 * 이메일 도메인 기반 institution 자동 등록
 * - email에서 도메인 추출
 * - institutions.email_domains에 매칭되는 기관 검색
 * - 이미 멤버가 아니면 role='student'로 자동 등록
 *
 * @returns 등록된 institution_id 또는 null
 */
export async function autoEnrollByEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  email: string,
): Promise<string | null> {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null

  // 이메일 도메인으로 institution 검색
  const { data: institution } = await supabase
    .from('institutions')
    .select('id')
    .contains('email_domains', [domain])
    .limit(1)
    .single()

  if (!institution) return null

  // 이미 멤버인지 확인
  const { data: existing } = await supabase
    .from('institution_members')
    .select('id')
    .eq('user_id', userId)
    .eq('institution_id', institution.id)
    .limit(1)
    .single()

  if (existing) return institution.id

  // 자동 등록
  const { error } = await supabase
    .from('institution_members')
    .insert({
      institution_id: institution.id,
      user_id: userId,
      role: 'student',
      status: 'active',
    })

  if (error) {
    console.error('[auto-enroll] Failed:', error.message)
    return null
  }

  return institution.id
}

/**
 * 대학명 기반 institution 자동 등록 (개인 이메일 유저용)
 * - profiles.university와 institutions.university 매칭
 * - 이미 멤버가 아니면 role='student'로 등록
 */
export async function autoEnrollByUniversity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  university: string,
): Promise<string | null> {
  if (!university) return null

  const { data: institution } = await supabase
    .from('institutions')
    .select('id')
    .eq('university', university)
    .limit(1)
    .single()

  if (!institution) return null

  // 이미 멤버인지 확인
  const { data: existing } = await supabase
    .from('institution_members')
    .select('id')
    .eq('user_id', userId)
    .eq('institution_id', institution.id)
    .limit(1)
    .single()

  if (existing) return institution.id

  const { error } = await supabase
    .from('institution_members')
    .insert({
      institution_id: institution.id,
      user_id: userId,
      role: 'student',
      status: 'active',
    })

  if (error) {
    console.error('[auto-enroll] Failed:', error.message)
    return null
  }

  return institution.id
}
