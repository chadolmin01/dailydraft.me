import type { Profile, Skill, CurrentSituation } from '@/src/types/profile'

export interface UserMatchResult {
  userId: string
  score: number
  skillComplementarity: number
  interestOverlap: number
  situationCompatibility: number
  reason: string
}

export interface CandidateProfile extends Profile {
  extracted_profile?: Record<string, unknown> | null
}

/**
 * Skill complementarity (0-100)
 * Prioritizes people who have skills I DON'T have
 */
function calculateSkillComplementarity(
  mySkills: Skill[],
  theirSkills: Skill[],
  myPosition?: string | null,
  theirPosition?: string | null
): number {
  if (theirSkills.length === 0) {
    // Fallback: use desired_position when skills are empty
    if (myPosition && theirPosition) {
      return myPosition !== theirPosition ? 70 : 30
    }
    return 30
  }

  const mySkillNames = new Set(mySkills.map((s) => s.name))

  let complementScore = 0

  for (const skill of theirSkills) {
    if (!mySkillNames.has(skill.name)) {
      // They have a skill I don't — highly complementary
      complementScore += 1.0
    } else {
      // Shared skill — still useful but less complementary
      complementScore += 0.3
    }
  }

  return Math.min(100, (complementScore / theirSkills.length) * 100)
}

/**
 * Interest tag overlap via Jaccard similarity (0-100)
 */
function calculateInterestOverlap(
  myTags: string[],
  theirTags: string[]
): number {
  if (myTags.length === 0 && theirTags.length === 0) return 50
  if (myTags.length === 0 || theirTags.length === 0) return 20

  const mySet = new Set(myTags)
  const theirSet = new Set(theirTags)

  let intersection = 0
  for (const tag of theirSet) {
    if (mySet.has(tag)) intersection++
  }

  const union = new Set([...myTags, ...theirTags]).size
  return (intersection / union) * 100
}

/**
 * Situation compatibility (0-100)
 */
function calculateSituationCompatibility(
  mySituation: CurrentSituation | null,
  theirSituation: CurrentSituation | null
): number {
  if (!mySituation || !theirSituation) return 50

  const key = `${mySituation}+${theirSituation}`
  const reverseKey = `${theirSituation}+${mySituation}`

  const scores: Record<string, number> = {
    'has_project+want_to_join': 100,
    'want_to_join+has_project': 100,
    'solo+solo': 70,
    'solo+want_to_join': 60,
    'want_to_join+solo': 60,
    'has_project+solo': 50,
    'solo+has_project': 50,
    'want_to_join+want_to_join': 50,
    'has_project+has_project': 40,
  }

  return scores[key] ?? scores[reverseKey] ?? 50
}

/**
 * Generate a concise match reason
 */
function generateUserMatchReason(
  myProfile: Profile,
  candidate: CandidateProfile,
  scores: {
    skillComplementarity: number
    interestOverlap: number
    situationCompatibility: number
  }
): string {
  const reasons: { priority: number; text: string }[] = []

  // Skill complementarity
  if (scores.skillComplementarity >= 70) {
    const mySkillNames = new Set((myProfile.skills || []).map((s) => s.name))
    const complementary = (candidate.skills || [])
      .filter((s) => !mySkillNames.has(s.name))
      .slice(0, 2)
      .map((s) => s.name)
    if (complementary.length > 0) {
      reasons.push({ priority: 1, text: `${complementary.join(', ')} 보유` })
    } else {
      reasons.push({ priority: 1, text: '보완적 스킬 보유' })
    }
  }

  // Interest overlap
  const overlapping = (candidate.interest_tags || []).filter((t) =>
    (myProfile.interest_tags || []).includes(t)
  )
  if (overlapping.length >= 2) {
    reasons.push({
      priority: 2,
      text: `${overlapping.slice(0, 2).join(', ')}에 관심`,
    })
  } else if (overlapping.length === 1) {
    reasons.push({ priority: 3, text: `${overlapping[0]} 분야` })
  }

  // Situation match
  if (scores.situationCompatibility >= 90) {
    reasons.push({ priority: 2, text: '팀원을 찾고 있어요' })
  } else if (scores.situationCompatibility >= 60) {
    reasons.push({ priority: 4, text: '함께 시작 가능' })
  }

  // Location
  if (candidate.location && candidate.location === myProfile.location) {
    reasons.push({ priority: 5, text: `같은 지역(${candidate.location})` })
  }

  // Position complementarity
  if (
    myProfile.desired_position &&
    candidate.desired_position &&
    myProfile.desired_position !== candidate.desired_position
  ) {
    reasons.push({ priority: 3, text: `${candidate.desired_position} 포지션` })
  }

  reasons.sort((a, b) => a.priority - b.priority)
  const top = reasons.slice(0, 3).map((r) => r.text)

  if (top.length === 0) return '새로운 협업 가능성'
  return top.join(' · ')
}

/**
 * Calculate match score for a single candidate
 * Pure algorithmic — no AI/embedding dependency
 */
function calculateUserMatch(
  myProfile: Profile,
  candidate: CandidateProfile
): UserMatchResult {
  const skill = calculateSkillComplementarity(
    myProfile.skills || [],
    candidate.skills || [],
    myProfile.desired_position,
    candidate.desired_position
  )
  const interest = calculateInterestOverlap(
    myProfile.interest_tags || [],
    candidate.interest_tags || []
  )
  const situation = calculateSituationCompatibility(
    myProfile.current_situation,
    candidate.current_situation
  )

  // Pure algorithmic weights
  const weights = { skill: 0.50, interest: 0.30, situation: 0.20 }

  const finalScore =
    skill * weights.skill +
    interest * weights.interest +
    situation * weights.situation

  const reason = generateUserMatchReason(myProfile, candidate, {
    skillComplementarity: skill,
    interestOverlap: interest,
    situationCompatibility: situation,
  })

  return {
    userId: candidate.user_id,
    score: Math.round(finalScore),
    skillComplementarity: Math.round(skill),
    interestOverlap: Math.round(interest),
    situationCompatibility: Math.round(situation),
    reason,
  }
}

/**
 * Rank candidates by match score
 */
export function rankUserMatches(
  myProfile: Profile,
  candidates: CandidateProfile[]
): Array<
  CandidateProfile & {
    match_score: number
    match_reason: string
    match_details: {
      skill: number
      interest: number
      situation: number
    }
  }
> {
  return candidates
    .map((candidate) => {
      const match = calculateUserMatch(myProfile, candidate)
      return {
        ...candidate,
        match_score: match.score,
        match_reason: match.reason,
        match_details: {
          skill: match.skillComplementarity,
          interest: match.interestOverlap,
          situation: match.situationCompatibility,
        },
      }
    })
    .sort((a, b) => b.match_score - a.match_score)
}
