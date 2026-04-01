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
      skills: profile.skills.map(s => ({ name: s, level: '중급' })),
      interestTags: profile.interests,
      personality: { risk: 5, time: 5, communication: 5, decision: 5 },
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
      skills: profile.skills.map(s => ({ name: s, level: '중급' })),
      interestTags: profile.interests,
      // Only send default personality when deep chat was skipped.
      // When deep chat was done, summarize API already wrote AI-analyzed values — don't overwrite.
      ...(!hasDeepChat && { personality: { risk: 5, time: 5, communication: 5, decision: 5 } }),
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

/** Summarize deep chat transcript */
export async function summarizeTranscript(
  messages: DeepChatMessage[],
  signal?: AbortSignal,
  structuredResponses?: StructuredResponse[],
): Promise<{ summary?: string } | null> {
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
    return { summary: json?.profile?.summary }
  } catch {
    return null
  }
}
