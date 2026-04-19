import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { applyRateLimit, getClientIp } from '@/src/lib/rate-limit'
import {
  extractEmailDomain,
  isAcademicDomain,
  findUniversityByEmail,
} from '@/src/lib/universities'

/**
 * GET /api/universities/by-email?email=foo@hanyang.ac.kr
 *
 * 온보딩 InfoContent에서 사용자 이메일 입력 시 실시간 호출.
 * 응답:
 *   { university: {...} | null, isAcademic: boolean, domain: string | null }
 *
 * 의도: 이메일만으로 대학 자동 감지. 매치 없어도 isAcademic으로 "학생 메일 같은데
 * DB에 없다" 케이스를 UI에서 "지원 예정 학교" 플로우로 분기 가능.
 */
export const GET = withErrorCapture(async (request) => {
  // anon 접근 가능 + 유저 이메일 열거 스캔 방어 (분당 20건 기본).
  // 정상 온보딩은 이메일 입력당 1-2회 호출이라 여유 충분.
  const rateLimitResponse = applyRateLimit(null, getClientIp(request))
  if (rateLimitResponse) return rateLimitResponse

  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return ApiResponse.badRequest('email 파라미터가 필요합니다')
  }

  const domain = extractEmailDomain(email)

  if (!domain) {
    return ApiResponse.ok({ university: null, isAcademic: false, domain: null })
  }

  const isAcademic = isAcademicDomain(domain)
  const university = await findUniversityByEmail(supabase, email)

  return ApiResponse.ok({ university, isAcademic, domain })
})
