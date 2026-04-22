import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { parseNickname } from '@/src/lib/clean-nickname'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { autoEnrollByEmail, autoEnrollByUniversity } from '@/src/lib/institution/auto-enroll'
import { captureServerEvent } from '@/src/lib/posthog/server'
import { sendWelcomeEmail } from '@/src/lib/email/send-welcome'
import {
  findUniversityByEmail,
  parseEntranceYearFromStudentId,
  isValidStudentIdFormat,
} from '@/src/lib/universities'
import type { TablesInsert } from '@/src/types/database'

export const POST = withErrorCapture(async (request) => {
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
      // 2026-04-23: 유입 경로 (invite / matching / operator / exploring)
      onboardingSource,
      // Phase 1-a: 학생 신원 필드
      studentId,
      department,
      universityId,
      entranceYear,
      // P0-1c: PIPA 동의 (온보딩 intro 에서 필수 3종 체크시 true)
      dataConsent,
    } = body

    // 유입 경로 값 검증 — 허용된 enum 만 저장
    const ALLOWED_SOURCES = ['invite', 'matching', 'operator', 'exploring'] as const
    const normalizedSource =
      typeof onboardingSource === 'string' && (ALLOWED_SOURCES as readonly string[]).includes(onboardingSource)
        ? onboardingSource
        : null

    // 최소 필수: 닉네임만. location/currentSituation은 슬림 플로우에서 옵셔널.
    // 기존 풀 온보딩도 이 API를 쓰므로 필수는 닉네임으로만 축소.
    if (!nickname) {
      return ApiResponse.badRequest('닉네임은 필수 입력 항목입니다')
    }

    // Welcome email 중복 발송 방지 — upsert 이전에 기존 onboarding_completed 값 체크.
    // 처음 true 로 전환되는 경우만 welcome 발송.
    const { data: prevProfile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .maybeSingle()
    const wasOnboarded = prevProfile?.onboarding_completed === true

    // Sanitize nickname: extract name if it contains [affiliation](department)
    const parsed = parseNickname(nickname)
    const cleanName = parsed.name
    const inferredUniversity = university || parsed.department || null
    const inferredMajor = major || department || null

    // ── Phase 1-a: 이메일 도메인 기반 학생 신원 검증 ──
    // 의도: @ac.kr 이메일이고 universities DB 매칭되면 자동으로 university_id + student_verified_at 세팅.
    // 이게 없으면 학번 입력해도 "인증된 학생" 아님 → B2B 리포트에서 빠짐.
    // 매칭 없어도 학번 자체는 저장 (나중에 학교 추가되면 retroactive 인증 가능).
    let resolvedUniversityId: string | null = universityId || null
    let studentVerifiedAt: string | null = null
    let verificationMethod: string | null = null

    if (user.email && !resolvedUniversityId) {
      const matched = await findUniversityByEmail(supabase, user.email)
      if (matched) {
        resolvedUniversityId = matched.id
      }
    }

    if (resolvedUniversityId && studentId && isValidStudentIdFormat(studentId)) {
      // 이메일 도메인으로 대학 특정 + 학번 형식 OK → 1차 검증 완료
      studentVerifiedAt = new Date().toISOString()
      verificationMethod = 'email_domain'
    }

    const parsedEntranceYear =
      entranceYear ?? (studentId ? parseEntranceYearFromStudentId(studentId) : null)

    // 기본 프로필 데이터
    const profileData: Record<string, unknown> = {
      user_id: user.id,
      nickname: cleanName,
      university: inferredUniversity,
      major: inferredMajor,
      locations: Array.isArray(location) ? location : location ? [location] : [],
      skills: skills || [],
      interest_tags: interestTags || [],
      desired_position: desiredPosition,
      personality: personality || { risk: 3, time: 3, communication: 3, planning: 3, quality: 3, teamRole: 3 },
      ...(currentSituation && { current_situation: currentSituation }),
      ...(visionSummary && { vision_summary: visionSummary }),
      onboarding_completed: true,
      ...(aiChatCompleted && { ai_chat_completed: true }),
      // P0-1c: PIPA 동의 기록. 이미 true 인 경우(기존 온보딩 완료 유저 재진입) 덮어쓰지 않고
      // 새로 true 로 올라온 경우에만 도장 찍음.
      ...(dataConsent === true && {
        data_consent: true,
        data_consent_at: new Date().toISOString(),
      }),
    }

    // DB 컬럼이 있을 수도 없을 수도 있는 필드
    const optionalFields: Record<string, unknown> = {
      age_range: ageRange || null,
      affiliation_type: affiliationType || 'student',
      graduation_year: graduationYear ? parseInt(graduationYear) : null,
      // Phase 1-a 학적 필드 (마이그레이션 적용 전엔 schema cache 에러로 재시도 경로 진입)
      ...(resolvedUniversityId && { university_id: resolvedUniversityId }),
      ...(studentId && { student_id: studentId }),
      ...(department && { department }),
      ...(parsedEntranceYear && { entrance_year: parsedEntranceYear }),
      ...(studentVerifiedAt && { student_verified_at: studentVerifiedAt }),
      ...(verificationMethod && { student_verification_method: verificationMethod }),
      // 2026-04-23: 유입 경로. 20260423010000 마이그레이션 전에는 schema cache 에러로 재시도 경로 진입.
      ...(normalizedSource && { onboarding_source: normalizedSource }),
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

    // Funnel Stage 2: 온보딩 완료
    // - has_interview: AI 인터뷰까지 돌았는지 → 인게이지먼트 지표
    // - has_vision/skills/interests: 프로필 완성도 → 이후 매칭 품질 예측
    captureServerEvent('onboarding_completed', {
      userId: user.id,
      has_interview: !!aiChatCompleted,
      has_vision: !!visionSummary,
      skill_count: Array.isArray(skills) ? skills.length : 0,
      interest_count: Array.isArray(interestTags) ? interestTags.length : 0,
      affiliation_type: affiliationType || 'student',
      has_university: !!university,
      has_student_id: !!studentId,
      student_verified: !!studentVerifiedAt,
      verification_method: verificationMethod,
      // 2026-04-23: 유입 경로별 코호트 분석
      onboarding_source: normalizedSource,
    }).catch(() => {})

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

    // Welcome email — 온보딩 최초 완료 시 1회. Resend 미설정이면 조용히 skip.
    if (!wasOnboarded && user.email) {
      sendWelcomeEmail({
        recipientEmail: user.email,
        recipientName: cleanName,
        universityName: inferredUniversity,
        isVerifiedStudent: !!studentVerifiedAt,
      }).catch(e => console.warn('[onboarding/complete] welcome email failed:', e))
    }

    return ApiResponse.ok({
      success: true,
      message: '온보딩이 완료되었습니다',
    })
})

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
