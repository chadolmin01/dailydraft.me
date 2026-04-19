/**
 * University lookup + 학번 파싱 헬퍼.
 * Phase 1-a: 이메일 도메인 기반 대학 감지, 학번에서 입학년도 추출.
 *
 * universities 테이블의 email_domains 배열에 `@ac.kr` 도메인이 시드되어 있다.
 * 현재 단계에선 서버/클라이언트 양쪽에서 쓸 수 있도록 순수 유틸만 제공.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface UniversityMatch {
  id: string
  name: string
  short_name: string | null
  email_domains: string[]
}

/**
 * 이메일 주소에서 도메인 추출.
 * 서브도메인 대응: `m.ac.hanyang.ac.kr` → 가장 긴 매치 우선, 없으면 2단계 호스트.
 */
export function extractEmailDomain(email: string): string | null {
  if (!email || typeof email !== 'string') return null
  const atIdx = email.lastIndexOf('@')
  if (atIdx < 0 || atIdx === email.length - 1) return null
  return email.slice(atIdx + 1).toLowerCase().trim()
}

/**
 * 도메인이 대학 이메일 형식인지만 빠르게 판정.
 * `.ac.kr`, `.edu` 로 끝나는 경우 true.
 */
export function isAcademicDomain(domain: string | null): boolean {
  if (!domain) return false
  return domain.endsWith('.ac.kr') || domain.endsWith('.edu') || domain.endsWith('.edu.kr')
}

/**
 * 이메일의 도메인이 universities.email_domains 중 어느 하나와 일치하는지 조회.
 * 서브도메인 계층 매칭: `m.hanyang.ac.kr` → `hanyang.ac.kr` 까지 내려가며 매칭 시도.
 * 매치 없으면 null.
 */
export async function findUniversityByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<UniversityMatch | null> {
  const domain = extractEmailDomain(email)
  if (!domain) return null

  const candidates = expandDomainCandidates(domain)
  if (candidates.length === 0) return null

  const { data, error } = await supabase
    .from('universities')
    .select('id, name, short_name, email_domains')
    .overlaps('email_domains', candidates)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.warn('[universities] lookup failed:', error.message)
    return null
  }

  return (data as UniversityMatch) ?? null
}

/**
 * `m.hanyang.ac.kr` → ['m.hanyang.ac.kr', 'hanyang.ac.kr', 'ac.kr']
 * 가장 구체적인 것부터 시도. universities 테이블에는 보통 2-3단계 도메인만 등록돼 있음.
 */
function expandDomainCandidates(domain: string): string[] {
  const parts = domain.split('.')
  const out: string[] = []
  for (let i = 0; i < parts.length - 1; i++) {
    out.push(parts.slice(i).join('.'))
  }
  return out
}

/**
 * 학번에서 입학년도 추출.
 * 한국 대학은 대부분 앞 4자리 또는 2자리가 입학년도.
 * - 10자리: `2023123456` → 2023
 * - 8자리: `20231234` → 2023
 * - 9자리: `202312345` → 2023
 * - 7자리: `2312345` → 23 → 2023 (00~30은 2000대, 31~99는 1900대로 해석 시 위험 → 여기선 2000대 고정)
 *
 * 실패 시 null.
 */
export function parseEntranceYearFromStudentId(studentId: string): number | null {
  if (!studentId) return null
  const clean = studentId.replace(/\D/g, '')
  if (clean.length < 7) return null

  // 앞 4자리가 연도 범위(1990~2030)인지 검증
  const prefix4 = parseInt(clean.slice(0, 4), 10)
  if (!isNaN(prefix4) && prefix4 >= 1990 && prefix4 <= 2030) {
    return prefix4
  }

  // 앞 2자리 YY (2000년대 가정)
  const prefix2 = parseInt(clean.slice(0, 2), 10)
  if (!isNaN(prefix2)) {
    // 00~30은 2000~2030, 31~99는 1931~1999로 해석 (휴학/만학도 케이스)
    const year = prefix2 <= 30 ? 2000 + prefix2 : 1900 + prefix2
    if (year >= 1990 && year <= 2030) return year
  }

  return null
}

/**
 * 입학년도 + 현재 시점 → 추정 학년 (1-4+).
 * 실제 학년은 휴학/복학으로 달라질 수 있어 "추정"일 뿐.
 * - 4학년 초과 → 4로 클램프 (복학생 케이스)
 * - null entrance_year → null
 */
export function estimateYearLevel(entranceYear: number | null, now: Date = new Date()): number | null {
  if (entranceYear == null) return null
  const currentYear = now.getFullYear()
  const diff = currentYear - entranceYear
  if (diff < 0) return null
  return Math.max(1, Math.min(4, diff + 1))
}

/**
 * 학번 형식 기본 검증: 숫자만, 길이 6-10.
 * 학교별 세부 검증은 Phase 2에서 universities.sso_config로 분리.
 */
export function isValidStudentIdFormat(studentId: string): boolean {
  if (!studentId) return false
  const clean = studentId.replace(/\s/g, '')
  return /^\d{6,10}$/.test(clean)
}
