import type { Profile, Skill, CurrentSituation } from '@/src/types/profile'
import { positionToRole } from '@/src/constants/roles'

type RoleGroup = 'tech' | 'creative' | 'biz'

function toRoleGroup(desiredPosition: string | null): RoleGroup {
  const role = positionToRole(desiredPosition || '')
  if (role === 'developer' || role === 'data') return 'tech'
  if (role === 'designer') return 'creative'
  return 'biz'
}

/** 내 직렬 × 상대 직렬 → { skill, teamfit } (interest 20% + situation 15% 고정) */
const USER_WEIGHT_MATRIX: Record<RoleGroup, Record<RoleGroup, { skill: number; teamfit: number }>> = {
  tech:     { tech: { skill: 0.20, teamfit: 0.45 }, creative: { skill: 0.10, teamfit: 0.55 }, biz: { skill: 0.05, teamfit: 0.60 } },
  creative: { tech: { skill: 0.20, teamfit: 0.45 }, creative: { skill: 0.15, teamfit: 0.50 }, biz: { skill: 0.05, teamfit: 0.60 } },
  biz:      { tech: { skill: 0.30, teamfit: 0.35 }, creative: { skill: 0.15, teamfit: 0.50 }, biz: { skill: 0.05, teamfit: 0.60 } },
}

export interface UserMatchResult {
  userId: string
  score: number
  skillComplementarity: number
  interestOverlap: number
  situationCompatibility: number
  teamFit: number
  reason: string
}

interface VisionSummary {
  work_style?: { planning?: number }
  team_preference?: { role?: string }
  behavioral_traits?: { risk_style?: string; planning_style?: string }
  strengths?: string[]
  availability?: { hours_per_week?: number; semester_available?: boolean }
}

function parseVisionSummary(profile: Profile): VisionSummary | null {
  if (!profile.vision_summary) return null
  try { return JSON.parse(profile.vision_summary) } catch { return null }
}

/**
 * Team fit score (0-100)
 * Measures personality & work-style compatibility between two users
 * All personality fields are 1-5 spectrum values
 */
function calculateTeamFit(myProfile: Profile, candidate: Profile): number {
  const checks: number[] = []

  // 1. Leader-follower complementarity (personality.teamRole 1~5)
  const myRole = myProfile.personality?.teamRole
  const theirRole = candidate.personality?.teamRole
  if (myRole != null && theirRole != null) {
    // 리더(4-5) + 팔로워(1-2) = 보완 → 높은 점수
    const sum = myRole + theirRole
    const diff = Math.abs(myRole - theirRole)
    if (diff >= 3) checks.push(100)       // 리더+팔로워 (1+5, 2+5, 1+4)
    else if (diff >= 2) checks.push(80)   // 약간 보완적
    else if (sum >= 5 && sum <= 7) checks.push(70) // 둘 다 중간~유연
    else checks.push(40)                  // 리더+리더 or 팔로워+팔로워
  }

  // 2. Communication style similarity (personality.communication 1~5)
  const myComm = myProfile.personality?.communication
  const theirComm = candidate.personality?.communication
  if (myComm != null && theirComm != null) {
    const diff = Math.abs(myComm - theirComm)
    checks.push(diff <= 1 ? 100 : diff === 2 ? 70 : 40)
  }

  // 3. Planning style compatibility (personality.planning 1~5)
  const myPlanning = myProfile.personality?.planning
  const theirPlanning = candidate.personality?.planning
  if (myPlanning != null && theirPlanning != null) {
    const diff = Math.abs(myPlanning - theirPlanning)
    checks.push(diff <= 1 ? 90 : diff === 2 ? 65 : 45)
  }

  // 4. Risk tolerance similarity (personality.risk 1~5)
  const myRisk = myProfile.personality?.risk
  const theirRisk = candidate.personality?.risk
  if (myRisk != null && theirRisk != null) {
    const diff = Math.abs(myRisk - theirRisk)
    checks.push(diff <= 1 ? 90 : diff === 2 ? 60 : 35)
  }

  // 5. Quality/speed alignment (personality.quality 1~5)
  const myQuality = myProfile.personality?.quality
  const theirQuality = candidate.personality?.quality
  if (myQuality != null && theirQuality != null) {
    const diff = Math.abs(myQuality - theirQuality)
    checks.push(diff <= 1 ? 85 : diff === 2 ? 60 : 40)
  }

  return checks.length > 0 ? checks.reduce((a, b) => a + b, 0) / checks.length : 50
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
    teamFit: number
  }
): string {
  const reasons: { priority: number; text: string }[] = []

  // Team fit reasons
  if (scores.teamFit >= 80) {
    const myRole = myProfile.personality?.teamRole
    const theirRole = candidate.personality?.teamRole
    if (myRole != null && theirRole != null && Math.abs(myRole - theirRole) >= 3) {
      reasons.push({ priority: 2, text: '리더-서포터 조합이 잘 맞아요' })
    }
    const commDiff = Math.abs((myProfile.personality?.communication ?? 3) - (candidate.personality?.communication ?? 3))
    if (commDiff <= 1) {
      reasons.push({ priority: 3, text: '소통 스타일이 비슷해요' })
    }
  } else if (scores.teamFit >= 60) {
    reasons.push({ priority: 5, text: '작업 방식이 잘 맞아요' })
  }

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
  const teamfit = calculateTeamFit(myProfile, candidate)

  // 내 직렬 × 상대 직렬 → 동적 가중치
  const myGroup = toRoleGroup(myProfile.desired_position)
  const theirGroup = toRoleGroup(candidate.desired_position)
  const w = USER_WEIGHT_MATRIX[myGroup][theirGroup]

  const finalScore =
    skill * w.skill +
    interest * 0.20 +
    situation * 0.15 +
    teamfit * w.teamfit

  const reason = generateUserMatchReason(myProfile, candidate, {
    skillComplementarity: skill,
    interestOverlap: interest,
    situationCompatibility: situation,
    teamFit: teamfit,
  })

  return {
    userId: candidate.user_id,
    score: Math.round(finalScore),
    skillComplementarity: Math.round(skill),
    interestOverlap: Math.round(interest),
    situationCompatibility: Math.round(situation),
    teamFit: Math.round(teamfit),
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
      teamfit: number
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
          teamfit: match.teamFit,
        },
      }
    })
    .sort((a, b) => b.match_score - a.match_score)
}
