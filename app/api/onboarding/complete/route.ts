import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { checkAIRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'

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
      aiChatTranscript,
      aiChatCompleted,
    } = body

    // Validate required fields
    if (!nickname || !location || !currentSituation) {
      return ApiResponse.badRequest('닉네임, 지역, 현재 상황은 필수 입력 항목입니다')
    }

    // 기본 프로필 데이터
    const profileData: Record<string, unknown> = {
      user_id: user.id,
      current_situation: currentSituation,
      nickname,
      university: university || null,
      major: major || null,
      location,
      skills: skills || [],
      interest_tags: interestTags || [],
      desired_position: desiredPosition,
      personality: personality || { risk: 5, time: 5, communication: 5, decision: 5 },
      onboarding_completed: true,
      ...(aiChatTranscript && { ai_chat_transcript: aiChatTranscript }),
      ...(aiChatCompleted && { ai_chat_completed: true }),
    }

    // DB 컬럼이 있을 수도 없을 수도 있는 필드
    const optionalFields: Record<string, unknown> = {
      age_range: ageRange || null,
      affiliation_type: affiliationType || 'student',
      graduation_year: graduationYear ? parseInt(graduationYear) : null,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase.from('profiles') as any
    const fullData = { ...profileData, ...optionalFields }

    // Upsert: INSERT or UPDATE based on user_id conflict
    let result = await db.upsert(fullData, { onConflict: 'user_id' })

    // schema cache 에러 → optional 필드 제거 후 재시도
    if (result.error?.message?.includes('column') || result.error?.message?.includes('schema cache')) {
      console.warn('[onboarding/complete] Retrying without optional fields:', result.error.message)
      result = await db.upsert(profileData, { onConflict: 'user_id' })
    }

    if (result.error) {
      console.error('[onboarding/complete] Supabase error:', JSON.stringify(result.error))
      return ApiResponse.internalError('프로필 저장에 실패했습니다', result.error.message)
    }

    return ApiResponse.ok({
      success: true,
      message: '온보딩이 완료되었습니다',
    })
  } catch {
    return ApiResponse.internalError('온보딩 완료 처리 중 오류가 발생했습니다')
  }
}
