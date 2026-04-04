import type { DeepChatMessage, ProfileDraft, StructuredResponse } from './types'

/** Parse free-text skills/interests via AI */
export async function aiParse(text: string, type: 'skills' | 'interests', signal?: AbortSignal): Promise<string[] | null> {
  try {
    const res = await fetch('/api/onboarding/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, type }),
      signal,
    })
    if (!res.ok) return null
    const { items } = await res.json()
    return Array.isArray(items) ? items : null
  } catch {
    return null
  }
}

/** Send a deep chat message and get AI reply */
export async function aiDeepChat(
  messages: DeepChatMessage[],
  profileCtx: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<{ reply: string; offTopic: boolean; suggestions: string[]; interactiveElement: string | null }> {
  try {
    const res = await fetch('/api/onboarding/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, profile: profileCtx }),
      signal,
    })
    if (!res.ok) {
      return { reply: '죄송해요, 일시적인 오류가 발생했어요. 다시 말씀해주세요!', offTopic: false, suggestions: [], interactiveElement: null }
    }
    const json = await res.json()
    const data = json?.data || json
    return {
      reply: data?.reply || '어떤 프로젝트 경험이 있으신지 알려주세요!',
      offTopic: !!data?.offTopic,
      suggestions: Array.isArray(data?.suggestions) ? data.suggestions : [],
      interactiveElement: data?.interactiveElement || null,
    }
  } catch (err) {
    // Re-throw AbortError so callers can distinguish cancellation from real errors
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    return { reply: '죄송해요, 네트워크 오류가 발생했어요. 인터넷 연결을 확인하고 다시 시도해주세요.', offTopic: false, suggestions: [], interactiveElement: null }
  }
}

/** Build profile context object for AI calls */
export function buildProfileCtx(profile: ProfileDraft): Record<string, unknown> {
  return {
    name: profile.name,
    university: profile.university,
    major: profile.major,
    position: profile.position,
    situation: profile.situation,
    skills: profile.skills,
    interests: profile.interests,
  }
}

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

/** Final save: profile + transcript + aiChatCompleted */
export async function saveProfileFinal(
  profile: ProfileDraft,
  deepChatMessages: DeepChatMessage[],
): Promise<void> {
  const hasDeepChat = deepChatMessages.length > 0
  const transcript = hasDeepChat
    ? deepChatMessages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp || new Date().toISOString(),
      }))
    : undefined

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
      // Only send default personality when deep chat was skipped.
      // When deep chat was done, summarize API already wrote AI-analyzed values — don't overwrite.
      ...(!hasDeepChat && { personality: { risk: 3, time: 3, communication: 3, decision: 3 } }),
      aiChatCompleted: hasDeepChat,
      ...(transcript && { aiChatTranscript: transcript }),
    }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => null)
    const errMsg = errData?.error?.message || (typeof errData?.error === 'string' ? errData.error : null) || '저장에 실패했습니다. 다시 시도해주세요.'
    throw new Error(errMsg)
  }
}

/** Save profile after scripted interview (no AI chat) */
export async function saveProfileFromInterview(
  profile: ProfileDraft,
  structuredResponses: StructuredResponse[],
): Promise<void> {
  // Derive personality scores directly from structured responses
  const byId = Object.fromEntries(structuredResponses.map(r => [r.questionId, r.value]))

  // Numeric personality scores (1-5 scale)
  const commRaw = byId['spectrum_communication'] as number | undefined
  const riskRaw = byId['this_or_that_risk'] as string | undefined
  const hoursRaw = byId['quick_number_hours'] as { hours?: number } | undefined
  const decisionRaw = byId['scenario_decision'] as string | undefined

  const communication = commRaw ?? 3
  const risk = riskRaw === 'adventurous' ? 4 : riskRaw === 'stable' ? 2 : 3
  const hours = hoursRaw?.hours ?? 10
  const time = Math.min(Math.round(hours / 6), 5) || 1
  const decision = decisionRaw === 'fast' ? 4 : decisionRaw === 'careful' ? 2 : decisionRaw === 'consult' ? 3 : 3

  // Categorical work style traits
  const collabRaw = byId['scenario_collaboration'] as string | undefined
  const planningRaw = byId['this_or_that_planning'] as string | undefined
  const qualityRaw = byId['this_or_that_perfectionism'] as string | undefined

  // Build behavioral traits for vision_summary
  const behavioralTraits: Record<string, string> = {}
  if (collabRaw) behavioralTraits.collaboration_style = collabRaw
  if (decisionRaw) behavioralTraits.decision_style = decisionRaw
  if (planningRaw) behavioralTraits.planning_style = planningRaw
  if (qualityRaw) behavioralTraits.quality_style = qualityRaw

  // Build work_style numeric scores (1-5 scale)
  const workStyle: Record<string, number> = { collaboration: 3, planning: 3, perfectionism: 3 }
  if (collabRaw) {
    const scores: Record<string, number> = { solo: 1, organize: 3, share: 5 }
    workStyle.collaboration = scores[collabRaw] ?? 3
  }
  if (planningRaw) {
    const scores: Record<string, number> = { build_first: 2, plan_first: 4 }
    workStyle.planning = scores[planningRaw] ?? 3
  }
  if (qualityRaw) {
    const scores: Record<string, number> = { speed: 2, quality: 4 }
    workStyle.perfectionism = scores[qualityRaw] ?? 3
  }

  // Additional structured data
  const strengthsRaw = byId['emoji_grid_strengths'] as string[] | undefined
  const teamRoleRaw = byId['spectrum_teamrole'] as number | undefined
  const goalsRaw = byId['drag_rank_goals'] as string[] | undefined
  const wantsRaw = byId['drag_rank_wants'] as string[] | undefined
  const atmosphereRaw = byId['emoji_grid_atmosphere'] as string[] | undefined
  const teamSizeRaw = byId['emoji_grid_team_size'] as string[] | undefined
  const semesterRaw = hoursRaw as { hours?: number; semesterAvailable?: boolean } | undefined

  // Build vision_summary JSON
  const visionSummary: Record<string, unknown> = {
    work_style: workStyle,
    behavioral_traits: Object.keys(behavioralTraits).length > 0 ? behavioralTraits : undefined,
    strengths: strengthsRaw,
    goals: goalsRaw,
    team_preference: {
      role: teamRoleRaw != null ? (teamRoleRaw >= 4 ? '리더' : teamRoleRaw <= 2 ? '팔로워' : '유연') : undefined,
      preferred_size: teamSizeRaw?.[0],
      atmosphere: atmosphereRaw,
      wants_from_team: wantsRaw,
    },
    availability: {
      hours_per_week: hours,
      prefer_online: undefined,
      semester_available: semesterRaw?.semesterAvailable,
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

/** Fire-and-forget: generate AI bio from interview structured responses */
export async function generateBioFromInterview(
  structuredResponses: StructuredResponse[],
): Promise<void> {
  try {
    await fetch('/api/onboarding/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: [],
        structuredData: structuredResponses,
      }),
    })
  } catch {
    // Non-blocking — ignore errors
  }
}

/** Summarize deep chat transcript */
export async function summarizeTranscript(
  messages: DeepChatMessage[],
  signal?: AbortSignal,
  structuredResponses?: StructuredResponse[],
): Promise<{ summary?: string; bio?: string } | null> {
  try {
    const res = await fetch('/api/onboarding/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: messages.map(m => ({ role: m.role, content: m.content })),
        structuredData: structuredResponses?.length ? structuredResponses : undefined,
      }),
      signal,
    })
    if (!res.ok) return null
    const json = await res.json()
    return { summary: json?.profile?.summary, bio: json?.profile?.bio }
  } catch {
    return null
  }
}
