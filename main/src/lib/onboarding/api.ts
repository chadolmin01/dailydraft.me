import type { ProfileDraft, StructuredResponse } from './types'

/** Save profile checkpoint (basic data, onboarding_completed: true) */
export async function saveProfileCheckpoint(profile: ProfileDraft): Promise<void> {
  const res = await fetch('/api/onboarding/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname: profile.name.trim(),
      desiredPosition: profile.position,
      affiliationType: profile.affiliationType || 'student',
      university: profile.university || undefined,
      major: profile.major || undefined,
      location: profile.locations.length > 0 ? profile.locations.join(', ') : undefined,
      currentSituation: profile.situation || undefined,
      skills: profile.skills.map(s => ({ name: s })),
      interestTags: profile.interests,
      personality: { risk: 3, time: 3, communication: 3, planning: 3, quality: 3, teamRole: 3 },
      // Phase 1-a
      studentId: profile.studentId,
      department: profile.department,
      universityId: profile.universityId,
      entranceYear: profile.entranceYear,
      // P0-1c: PIPA 동의 기록. IntroScreen 에서 필수 3종 체크 없이는 시작 자체가 불가.
      // 여기까지 흐름이 도달한 것은 동의 성립 시점.
      dataConsent: true,
    }),
  })
  if (!res.ok) {
    throw new Error('Checkpoint save failed')
  }
}

/** Save profile after scripted interview — single API call handles everything */
export async function saveProfileFromInterview(
  profile: ProfileDraft,
  structuredResponses: StructuredResponse[],
): Promise<void> {
  const byId = Object.fromEntries(structuredResponses.map(r => [r.questionId, r.value]))

  // ── All 5 spectrum values: direct 1-5 scale ──
  const communication = (byId['spectrum_communication'] as number | undefined) ?? 3
  const risk = (byId['spectrum_risk'] as number | undefined) ?? 3
  const planning = (byId['spectrum_planning'] as number | undefined) ?? 3
  const quality = (byId['spectrum_quality'] as number | undefined) ?? 3
  const teamRole = (byId['spectrum_teamrole'] as number | undefined) ?? 3

  const hoursRaw = byId['quick_number_hours'] as { hours?: number; semesterAvailable?: boolean } | undefined
  const hours = hoursRaw?.hours ?? 10
  const time = Math.min(Math.round(hours / 6), 5) || 1

  const strengthsRaw = byId['emoji_grid_strengths'] as string[] | undefined

  // ── Vision summary (for profile display + matching) ──
  const visionSummary = {
    work_style: { planning },
    team_preference: {
      role: teamRole >= 4 ? '리더' : teamRole <= 2 ? '팔로워' : '유연',
    },
    strengths: strengthsRaw,
    availability: {
      hours_per_week: hours,
      semester_available: hoursRaw?.semesterAvailable,
    },
  }

  const res = await fetch('/api/onboarding/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname: profile.name.trim(),
      desiredPosition: profile.position,
      affiliationType: profile.affiliationType || 'student',
      university: profile.university || undefined,
      major: profile.major || undefined,
      location: profile.locations.length > 0 ? profile.locations.join(', ') : undefined,
      currentSituation: profile.situation || 'exploring',
      skills: profile.skills.map(s => ({ name: s })),
      interestTags: profile.interests,
      personality: { risk, time, communication, planning, quality, teamRole },
      visionSummary: JSON.stringify(visionSummary),
      aiChatCompleted: true,
      // Phase 1-a
      studentId: profile.studentId,
      department: profile.department,
      universityId: profile.universityId,
      entranceYear: profile.entranceYear,
      // P0-1c: PIPA 동의 기록. IntroScreen 에서 필수 3종 체크 없이는 시작 자체가 불가.
      // 여기까지 흐름이 도달한 것은 동의 성립 시점.
      dataConsent: true,
    }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => null)
    const errMsg = errData?.error?.message || (typeof errData?.error === 'string' ? errData.error : null) || '저장에 실패했습니다.'
    throw new Error(errMsg)
  }
}
