import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { checkAIRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'
import { parseNickname } from '@/src/lib/clean-nickname'
import { autoEnrollByEmail, autoEnrollByUniversity } from '@/src/lib/institution/auto-enroll'
import type { TablesInsert } from '@/src/types/database'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    // Rate limit
    const rateLimitResponse = await checkAIRateLimit(user.id, getClientIp(request))
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const {
      currentSituation,
      nickname,
      ageRange,
      affiliationType,
      university,
      major,
      graduationYear,
      location,
      skills,
      interestTags,
      desiredPosition,
      personality,
      visionSummary,
      aiChatCompleted,
    } = body

    // Validate required fields
    if (!nickname || !location || !currentSituation) {
      return ApiResponse.badRequest('닉네임, 지역, 현재 상황은 필수 입력 항목입니다')
    }

    // Sanitize nickname: extract name if it contains [affiliation](department)
    const parsed = parseNickname(nickname)
    const cleanName = parsed.name
    const inferredUniversity = university || parsed.department || null
    const inferredMajor = major || null

    // 기본 프로필 데이터
    const profileData: Record<string, unknown> = {
      user_id: user.id,
      current_situation: currentSituation,
      nickname: cleanName,
      university: inferredUniversity,
      major: inferredMajor,
      location,
      skills: skills || [],
      interest_tags: interestTags || [],
      desired_position: desiredPosition,
      personality: personality || { risk: 3, time: 3, communication: 3, decision: 3 },
      ...(visionSummary && { vision_summary: visionSummary }),
      onboarding_completed: true,
      ...(aiChatCompleted && { ai_chat_completed: true }),
    }

    // DB 컬럼이 있을 수도 없을 수도 있는 필드
    const optionalFields: Record<string, unknown> = {
      age_range: ageRange || null,
      affiliation_type: affiliationType || 'student',
      graduation_year: graduationYear ? parseInt(graduationYear) : null,
    }

    const fullData = { ...profileData, ...optionalFields }

    // Upsert: INSERT or UPDATE based on user_id conflict
    // Dynamic fields require type assertion since optional DB columns may not be in generated types
    let result = await supabase.from('profiles').upsert(
      fullData as unknown as TablesInsert<'profiles'>,
      { onConflict: 'user_id' }
    )

    // schema cache 에러 → optional 필드 제거 후 재시도
    if (result.error?.message?.includes('column') || result.error?.message?.includes('schema cache')) {
      console.warn('[onboarding/complete] Retrying without optional fields:', result.error.message)
      result = await supabase.from('profiles').upsert(
        profileData as unknown as TablesInsert<'profiles'>,
        { onConflict: 'user_id' }
      )
    }

    if (result.error) {
      console.error('[onboarding/complete] Supabase error:', JSON.stringify(result.error))
      return ApiResponse.internalError('프로필 저장에 실패했습니다', result.error.message)
    }

    // Institution 자동 등록: 이메일 도메인 → 대학명 순으로 시도
    try {
      const enrolled = await autoEnrollByEmail(supabase, user.id, user.email || '')
      if (!enrolled && inferredUniversity) {
        await autoEnrollByUniversity(supabase, user.id, inferredUniversity)
      }
    } catch (e) {
      console.warn('[onboarding/complete] Auto-enroll failed (non-blocking):', e)
    }

    return ApiResponse.ok({
      success: true,
      message: '온보딩이 완료되었습니다',
    })
  } catch {
    return ApiResponse.internalError('온보딩 완료 처리 중 오류가 발생했습니다')
  }
}
