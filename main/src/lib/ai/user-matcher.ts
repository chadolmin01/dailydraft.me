import type { Profile, Skill, CurrentSituation } from '@/src/types/profile'
import type { ProfileAnalysisResult } from '@/src/types/profile-analysis'

export interface UserMatchResult {
  userId: string
  score: number
  visionSimilarity: number
  skillComplementarity: number
  founderSynergy: number
  interestOverlap: number
  situationCompatibility: number
  reason: string
}

type FounderType = ProfileAnalysisResult['founder_type']

interface CandidateProfile extends Profile {
  profile_analysis?: { founder_type?: FounderType } | null
  extracted_profile?: Record<string, unknown> | null
  similarity?: number
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) return 0

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Vision similarity (0-100)
 */
function calculateVisionSimilarity(
  myEmbedding: number[] | null,
  theirEmbedding: number[] | null,
  pgvectorSimilarity?: number
): number {
  if (pgvectorSimilarity !== undefined) {
    return pgvectorSimilarity * 100
  }
  if (!myEmbedding || !theirEmbedding) return -1 // signal: no data
  const sim = cosineSimilarity(myEmbedding, theirEmbedding)
  return ((sim + 1) / 2) * 100
}

/**
 * Skill complementarity (0-100)
 * Prioritizes people who have skills I DON'T have
 */
function calculateSkillComplementarity(
  mySkills: Skill[],
  theirSkills: Skill[]
): number {
  if (theirSkills.length === 0) return 30

  const mySkillNames = new Set(mySkills.map((s) => s.name))
  const levelWeight = { '초급': 1, '중급': 2, '고급': 3 }

  let complementScore = 0
  let totalWeight = 0

  for (const skill of theirSkills) {
    const weight = levelWeight[skill.level] || 1
    totalWeight += weight

    if (!mySkillNames.has(skill.name)) {
      // They have a skill I don't — highly complementary
      complementScore += weight * 1.0
    } else {
      // Shared skill — still useful but less complementary
      complementScore += weight * 0.3
    }
  }

  if (totalWeight === 0) return 30

  return Math.min(100, (complementScore / totalWeight) * 100)
}

/**
 * Founder type synergy matrix
 */
const FOUNDER_SYNERGY: Record<string, Record<string, number>> = {
  'Blitz Builder': {
    'Tech Pioneer': 95,
    'Market Sniper': 70,
    'Community Builder': 70,
    'Blitz Builder': 30,
  },
  'Market Sniper': {
    'Tech Pioneer': 95,
    'Blitz Builder': 70,
    'Community Builder': 70,
    'Market Sniper': 30,
  },
  'Tech Pioneer': {
    'Blitz Builder': 95,
    'Market Sniper': 95,
    'Community Builder': 70,
    'Tech Pioneer': 30,
  },
  'Community Builder': {
    'Blitz Builder': 70,
    'Market Sniper': 70,
    'Tech Pioneer': 70,
    'Community Builder': 30,
  },
}

function calculateFounderSynergy(
  myType: FounderType | undefined,
  theirType: FounderType | undefined
): number {
  if (!myType || !theirType) return -1
  return FOUNDER_SYNERGY[myType]?.[theirType] ?? 50
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
    visionSimilarity: number
    skillComplementarity: number
    founderSynergy: number
    interestOverlap: number
    situationCompatibility: number
  }
): string {
  const reasons: { priority: number; text: string }[] = []

  // Founder synergy
  const theirType = candidate.profile_analysis?.founder_type
  if (scores.founderSynergy >= 90 && theirType) {
    reasons.push({ priority: 1, text: `${theirType} 시너지` })
  } else if (scores.founderSynergy >= 60 && theirType) {
    reasons.push({ priority: 4, text: `${theirType} 타입` })
  }

  // Skill complementarity
  if (scores.skillComplementarity >= 70) {
    const mySkillNames = new Set((myProfile.skills || []).map((s) => s.name))
    const complementary = (candidate.skills || [])
      .filter((s) => !mySkillNames.has(s.name))
      .slice(0, 2)
      .map((s) => s.name)
    if (complementary.length > 0) {
      reasons.push({ priority: 2, text: `${complementary.join(', ')} 보유` })
    } else {
      reasons.push({ priority: 2, text: '보완적 스킬 보유' })
    }
  }

  // Vision similarity
  if (scores.visionSimilarity >= 75) {
    reasons.push({ priority: 3, text: '비전이 유사해요' })
  }

  // Interest overlap
  const overlapping = (candidate.interest_tags || []).filter((t) =>
    (myProfile.interest_tags || []).includes(t)
  )
  if (overlapping.length >= 2) {
    reasons.push({
      priority: 5,
      text: `${overlapping.slice(0, 2).join(', ')}에 관심`,
    })
  } else if (overlapping.length === 1) {
    reasons.push({ priority: 6, text: `${overlapping[0]} 분야` })
  }

  // Situation match
  if (scores.situationCompatibility >= 90) {
    reasons.push({ priority: 3, text: '팀원을 찾고 있어요' })
  } else if (scores.situationCompatibility >= 60) {
    reasons.push({ priority: 7, text: '함께 시작 가능' })
  }

  // Location
  if (candidate.location && candidate.location === myProfile.location) {
    reasons.push({ priority: 8, text: `같은 지역(${candidate.location})` })
  }

  reasons.sort((a, b) => a.priority - b.priority)
  const top = reasons.slice(0, 3).map((r) => r.text)

  if (top.length === 0) return '새로운 협업 가능성'
  return top.join(' · ')
}

/**
 * Calculate match score for a single candidate
 */
function calculateUserMatch(
  myProfile: Profile & { profile_analysis?: { founder_type?: FounderType } | null },
  candidate: CandidateProfile
): UserMatchResult {
  const vision = calculateVisionSimilarity(
    myProfile.vision_embedding,
    candidate.vision_embedding,
    candidate.similarity
  )
  const skill = calculateSkillComplementarity(
    myProfile.skills || [],
    candidate.skills || []
  )
  const founder = calculateFounderSynergy(
    myProfile.profile_analysis?.founder_type,
    candidate.profile_analysis?.founder_type
  )
  const interest = calculateInterestOverlap(
    myProfile.interest_tags || [],
    candidate.interest_tags || []
  )
  const situation = calculateSituationCompatibility(
    myProfile.current_situation,
    candidate.current_situation
  )

  // Weights
  const weights = { vision: 0.3, skill: 0.25, founder: 0.2, interest: 0.15, situation: 0.1 }

  // Handle missing data: redistribute weight
  const hasVision = vision >= 0
  const hasFounder = founder >= 0

  let effectiveWeights = { ...weights }
  if (!hasVision && !hasFounder) {
    // Redistribute both to remaining
    effectiveWeights = { vision: 0, skill: 0.5, founder: 0, interest: 0.3, situation: 0.2 }
  } else if (!hasVision) {
    // Redistribute vision weight proportionally
    const remaining = weights.skill + weights.founder + weights.interest + weights.situation
    effectiveWeights.vision = 0
    effectiveWeights.skill = weights.skill / remaining * (1)
    effectiveWeights.founder = weights.founder / remaining * (1)
    effectiveWeights.interest = weights.interest / remaining * (1)
    effectiveWeights.situation = weights.situation / remaining * (1)
  } else if (!hasFounder) {
    const remaining = weights.vision + weights.skill + weights.interest + weights.situation
    effectiveWeights.founder = 0
    effectiveWeights.vision = weights.vision / remaining * (1)
    effectiveWeights.skill = weights.skill / remaining * (1)
    effectiveWeights.interest = weights.interest / remaining * (1)
    effectiveWeights.situation = weights.situation / remaining * (1)
  }

  const visionScore = hasVision ? vision : 0
  const founderScore = hasFounder ? founder : 0

  const finalScore =
    visionScore * effectiveWeights.vision +
    skill * effectiveWeights.skill +
    founderScore * effectiveWeights.founder +
    interest * effectiveWeights.interest +
    situation * effectiveWeights.situation

  const reason = generateUserMatchReason(myProfile, candidate, {
    visionSimilarity: visionScore,
    skillComplementarity: skill,
    founderSynergy: founderScore,
    interestOverlap: interest,
    situationCompatibility: situation,
  })

  return {
    userId: candidate.user_id,
    score: Math.round(finalScore),
    visionSimilarity: Math.round(hasVision ? vision : 0),
    skillComplementarity: Math.round(skill),
    founderSynergy: Math.round(hasFounder ? founder : 0),
    interestOverlap: Math.round(interest),
    situationCompatibility: Math.round(situation),
    reason,
  }
}

/**
 * Rank candidates by match score
 */
export function rankUserMatches(
  myProfile: Profile & { profile_analysis?: { founder_type?: FounderType } | null },
  candidates: CandidateProfile[]
): Array<
  CandidateProfile & {
    match_score: number
    match_reason: string
    match_details: {
      vision: number
      skill: number
      founder: number
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
          vision: match.visionSimilarity,
          skill: match.skillComplementarity,
          founder: match.founderSynergy,
          interest: match.interestOverlap,
          situation: match.situationCompatibility,
        },
      }
    })
    .sort((a, b) => b.match_score - a.match_score)
}
