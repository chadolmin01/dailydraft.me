import type { ProfileDraft } from './types'

interface ResumeResult {
  step: string
  draft: ProfileDraft
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
    locations: (p.locations as string[] | null) ?? [],
    position: (p.desired_position as string) || '',
    situation: (p.current_situation as string) || 'exploring',
    skills,
    interests,
  }

  // Resume to interview step
  return { step: 'interview', draft }
}
