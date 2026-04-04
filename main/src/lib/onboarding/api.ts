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
      location: profile.locations.length > 0 ? profile.locations.join(', ') : '미설정',
      currentSituation: profile.situation || 'exploring',
      skills: profile.skills.map(s => ({ name: s })),
      interestTags: profile.interests,
      personality: { risk: 3, time: 3, communication: 3, decision: 3 },
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

  // ── Personality scores from actual 6 interview questions (1-5 scale) ──
  const commRaw = byId['spectrum_communication'] as number | undefined
  const riskRaw = byId['this_or_that_risk'] as string | undefined
  const hoursRaw = byId['quick_number_hours'] as { hours?: number; semesterAvailable?: boolean } | undefined
  const planningRaw = byId['this_or_that_planning'] as string | undefined
  const teamRoleRaw = byId['spectrum_teamrole'] as number | undefined
  const strengthsRaw = byId['emoji_grid_strengths'] as string[] | undefined

  const communication = commRaw ?? 3
  const risk = riskRaw === 'adventurous' ? 4 : riskRaw === 'stable' ? 2 : 3
  const hours = hoursRaw?.hours ?? 10
  const time = Math.min(Math.round(hours / 6), 5) || 1
  // decision: no dedicated question → derive from planning preference
  const decision = planningRaw === 'build_first' ? 4 : planningRaw === 'plan_first' ? 2 : 3

  // ── Work style traits ──
  const workStyle = {
    planning: planningRaw === 'build_first' ? 2 : planningRaw === 'plan_first' ? 4 : 3,
  }

  // ── Vision summary (for profile display) ──
  const visionSummary = {
    work_style: workStyle,
    behavioral_traits: {
      ...(riskRaw && { risk_style: riskRaw }),
      ...(planningRaw && { planning_style: planningRaw }),
    },
    strengths: strengthsRaw,
    team_preference: {
      role: teamRoleRaw != null ? (teamRoleRaw >= 4 ? '리더' : teamRoleRaw <= 2 ? '팔로워' : '유연') : undefined,
    },
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
      location: profile.locations.length > 0 ? profile.locations.join(', ') : '미설정',
      currentSituation: profile.situation || 'exploring',
      skills: profile.skills.map(s => ({ name: s })),
      interestTags: profile.interests,
      personality: { risk, time, communication, decision },
      visionSummary: JSON.stringify(visionSummary),
      aiChatCompleted: true,
    }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => null)
    const errMsg = errData?.error?.message || (typeof errData?.error === 'string' ? errData.error : null) || '저장에 실패했습니다.'
    throw new Error(errMsg)
  }
}
