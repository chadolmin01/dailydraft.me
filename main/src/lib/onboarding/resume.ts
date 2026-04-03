import type { DeepChatMessage, ProfileDraft, Step } from './types'

interface ResumeResult {
  step: Step
  draft: ProfileDraft
  messages?: DeepChatMessage[]
}

/**
 * Determine where to resume onboarding based on existing profile data.
 *
 * Logic:
 * - !profile || !onboarding_completed → null (fresh start)
 * - onboarding_completed && ai_chat_completed && !redoChat → null (shouldn't be here)
 * - onboarding_completed && !ai_chat_completed (or redoChat) → deep-chat-offer / deep-chat
 */
export function determineResumeStep(
  authProfile: Record<string, unknown> | null,
  options?: { redoChat?: boolean },
): ResumeResult | null {
  if (!authProfile) return null

  const p = authProfile
  // Not completed basic onboarding — fresh start
  if (!p.onboarding_completed || !p.nickname) return null
  // Fully completed and not redo — shouldn't be in onboarding
  if (p.ai_chat_completed && !options?.redoChat) return null

  // Build profile draft from DB
  const skills = Array.isArray(p.skills)
    ? (p.skills as Array<string | { name?: string }>).map(s =>
        typeof s === 'string' ? s : s?.name || ''
      ).filter(Boolean)
    : []

  const interests = Array.isArray(p.interest_tags) ? (p.interest_tags as string[]) : []

  const draft: ProfileDraft = {
    name: p.nickname as string,
    affiliationType: (p.affiliation_type as string) || 'student',
    university: (p.university as string) || '',
    major: (p.major as string) || '',
    locations: (p.location as string)?.split(', ').filter(Boolean) || [],
    position: (p.desired_position as string) || '',
    situation: (p.current_situation as string) || 'exploring',
    skills,
    interests,
  }

  // Has existing transcript (and not redo) → resume deep chat with messages
  if (!options?.redoChat && Array.isArray(p.ai_chat_transcript) && p.ai_chat_transcript.length > 0) {
    const messages: DeepChatMessage[] = (p.ai_chat_transcript as Array<{ role: string; content: string }>)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
    return { step: 'deep-chat', draft, messages }
  }

  // No transcript or redo → offer deep chat
  return { step: 'deep-chat-offer', draft }
}
