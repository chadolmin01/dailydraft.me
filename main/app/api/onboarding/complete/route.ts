import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { parseNickname } from '@/src/lib/clean-nickname'
import { captureServerError } from '@/src/lib/posthog/server'
import { autoEnrollByEmail, autoEnrollByUniversity } from '@/src/lib/institution/auto-enroll'
import type { TablesInsert } from '@/src/types/database'

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
      personality: personality || { risk: 3, time: 3, communication: 3, planning: 3, quality: 3, teamRole: 3 },
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

    // ── Background tasks (non-blocking) ──

    // Institution 자동 등록
    autoEnrollByEmail(supabase, user.id, user.email || '')
      .then(enrolled => {
        if (!enrolled && inferredUniversity) {
          return autoEnrollByUniversity(supabase, user.id, inferredUniversity)
        }
      })
      .catch(e => console.warn('[onboarding/complete] Auto-enroll failed:', e))

    // AI bio 생성 (인터뷰 완료 시에만, fire-and-forget)
    if (aiChatCompleted && visionSummary) {
      generateAiBio(supabase, user.id, skills, interestTags, desiredPosition).catch(e =>
        console.warn('[onboarding/complete] AI bio failed:', e)
      )
    }

    return ApiResponse.ok({
      success: true,
      message: '온보딩이 완료되었습니다',
    })
  } catch (error) {
    await captureServerError(error, { route: 'POST /api/onboarding/complete' })
    return ApiResponse.internalError('온보딩 완료 처리 중 오류가 발생했습니다')
  }
}

/** Background: generate AI bio and save to profile */
async function generateAiBio(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  skills: Array<{ name: string }> | undefined,
  interestTags: string[] | undefined,
  desiredPosition: string | undefined,
) {
  const { chatModel } = await import('@/src/lib/ai/gemini-client')

  const parts: string[] = []
  if (desiredPosition) parts.push(`직군: ${desiredPosition}`)
  if (skills?.length) parts.push(`기술: ${skills.map(s => s.name).join(', ')}`)
  if (interestTags?.length) parts.push(`관심분야: ${interestTags.join(', ')}`)

  if (parts.length === 0) return

  const prompt = `아래 사용자 정보를 바탕으로 팀 매칭 프로필에 들어갈 자기소개(bio)를 1-2문장으로 작성해주세요.
친근하고 자연스러운 존댓말. 반드시 1-2문장만. JSON으로만 응답: {"bio": "..."}

${parts.join('\n')}`

  const result = await chatModel.generateContent(prompt)
  const text = result.response?.text?.() || ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return

  const parsed = JSON.parse(match[0])
  if (!parsed?.bio || typeof parsed.bio !== 'string') return

  const { data: existing } = await supabase.from('profiles')
    .select('bio')
    .eq('user_id', userId)
    .single()

  if (!existing?.bio) {
    await supabase.from('profiles')
      .update({ bio: parsed.bio })
      .eq('user_id', userId)
  }
}
