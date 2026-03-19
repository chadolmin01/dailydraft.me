import { createClient } from '@/src/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ApiResponse } from '@/src/lib/api-utils'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

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

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

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

    // 첫 시도: 모든 필드 포함
    let result = existingProfile
      ? await db.update(fullData).eq('user_id', user.id)
      : await db.insert(fullData)

    // schema cache 에러 → optional 필드 제거 후 재시도
    if (result.error?.message?.includes('column') || result.error?.message?.includes('schema cache')) {
      console.warn('[onboarding/complete] Retrying without optional fields:', result.error.message)
      result = existingProfile
        ? await db.update(profileData).eq('user_id', user.id)
        : await db.insert(profileData)
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
