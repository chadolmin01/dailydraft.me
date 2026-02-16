import type { Opportunity } from '@/src/types/opportunity'
import type { Profile, Skill } from '@/src/types/profile'

interface MatchResult {
  opportunityId: string
  score: number
  skillMatch: number
  visionSimilarity: number
  practicalCompatibility: number
  roleMatch: number
  reason: string
}

/**
 * Calculate skill match score (0-100)
 */
function calculateSkillMatch(
  userSkills: Skill[],
  neededSkills: Skill[]
): number {
  if (neededSkills.length === 0) return 50 // Default if no skills specified

  let totalScore = 0

  for (const needed of neededSkills) {
    const userSkill = userSkills.find((s) => s.name === needed.name)

    if (userSkill) {
      // Level matching score
      const levelScore = {
        초급: 1,
        중급: 2,
        고급: 3,
      }

      const userLevel = levelScore[userSkill.level] || 0
      const neededLevel = levelScore[needed.level] || 0

      // Perfect match: 100, one level off: 70, two levels off: 40
      if (userLevel >= neededLevel) {
        totalScore += 100
      } else if (userLevel === neededLevel - 1) {
        totalScore += 70
      } else {
        totalScore += 40
      }
    }
  }

  if (neededSkills.length === 0) return 50

  return (totalScore / (neededSkills.length * 100)) * 100
}

/**
 * Calculate cosine similarity between two vectors
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
 * Calculate vision similarity (0-100)
 * If pgvector similarity is provided (from RPC), use it directly
 * Otherwise, calculate using JavaScript cosine similarity
 */
function calculateVisionSimilarity(
  userEmbedding: number[] | null,
  opportunityEmbedding: number[] | null,
  pgvectorSimilarity?: number
): number {
  // If pgvector already calculated similarity, use it (scaled 0-100)
  if (pgvectorSimilarity !== undefined) {
    return pgvectorSimilarity * 100
  }

  if (!userEmbedding || !opportunityEmbedding) return 50 // Default if no embeddings

  const similarity = cosineSimilarity(userEmbedding, opportunityEmbedding)

  // Convert from [-1, 1] to [0, 100]
  return ((similarity + 1) / 2) * 100
}

/**
 * Calculate practical compatibility (0-100)
 */
function calculatePracticalCompatibility(
  profile: Profile,
  opportunity: Opportunity
): number {
  let score = 0
  let totalChecks = 0

  // Location match
  if (opportunity.location_type === 'remote') {
    score += 100
    totalChecks++
  } else if (opportunity.location && profile.location) {
    if (opportunity.location === profile.location) {
      score += 100
    } else {
      score += 30 // Different location but within Korea
    }
    totalChecks++
  }

  // Interest tag overlap
  if (opportunity.interest_tags && profile.interest_tags) {
    const overlap = opportunity.interest_tags.filter((tag) =>
      profile.interest_tags.includes(tag)
    ).length

    if (opportunity.interest_tags.length > 0) {
      score += (overlap / opportunity.interest_tags.length) * 100
      totalChecks++
    }
  }

  // Time commitment (using personality.time as proxy)
  if (opportunity.time_commitment && profile.personality?.time) {
    if (opportunity.time_commitment === 'full_time' && profile.personality.time >= 7) {
      score += 100
      totalChecks++
    } else if (opportunity.time_commitment === 'part_time' && profile.personality.time <= 5) {
      score += 100
      totalChecks++
    } else {
      score += 50
      totalChecks++
    }
  }

  return totalChecks > 0 ? score / totalChecks : 50
}

/**
 * Calculate role match (0-100)
 */
function calculateRoleMatch(
  desiredPosition: string | null,
  neededRoles: string[]
): number {
  if (!desiredPosition || neededRoles.length === 0) return 50

  return neededRoles.includes(desiredPosition) ? 100 : 20
}

/**
 * Generate match reason with priority ordering
 */
function generateMatchReason(
  profile: Profile,
  opportunity: Opportunity,
  scores: {
    skillMatch: number
    visionSimilarity: number
    practicalCompatibility: number
    roleMatch: number
  }
): string {
  const reasons: { priority: number; text: string }[] = []

  // Role match is most impactful when 100%
  if (scores.roleMatch === 100 && profile.desired_position) {
    reasons.push({
      priority: 1,
      text: `${profile.desired_position} 역할을 찾고 있어요`
    })
  }

  // Skill match
  if (scores.skillMatch >= 80) {
    const matchedSkills = (profile.skills || [])
      .filter(s => (opportunity.needed_skills || []).some(ns => ns.name === s.name))
      .slice(0, 2)
      .map(s => s.name)

    if (matchedSkills.length > 0) {
      reasons.push({
        priority: 2,
        text: `${matchedSkills.join(', ')} 스킬이 딱 맞아요`
      })
    } else {
      reasons.push({ priority: 2, text: '보유 스킬이 잘 맞아요' })
    }
  } else if (scores.skillMatch >= 60) {
    reasons.push({ priority: 5, text: '필요한 스킬 일부를 보유하고 있어요' })
  }

  // Vision similarity - only mention if strong
  if (scores.visionSimilarity >= 75) {
    reasons.push({ priority: 3, text: '비전과 목표가 유사해요' })
  }

  // Interest overlap
  const overlappingTags = (opportunity.interest_tags || []).filter((tag) =>
    (profile.interest_tags || []).includes(tag)
  )

  if (overlappingTags.length >= 2) {
    const tags = overlappingTags.slice(0, 2).join(', ')
    reasons.push({ priority: 4, text: `${tags}에 함께 관심있어요` })
  } else if (overlappingTags.length === 1) {
    reasons.push({ priority: 6, text: `${overlappingTags[0]} 분야에 관심있어요` })
  }

  // Location advantages
  if (opportunity.location_type === 'remote') {
    reasons.push({ priority: 7, text: '원격 근무 가능' })
  } else if (opportunity.location === profile.location && profile.location) {
    reasons.push({ priority: 7, text: `같은 지역(${profile.location})` })
  }

  // Sort by priority and take top 3
  reasons.sort((a, b) => a.priority - b.priority)
  const topReasons = reasons.slice(0, 3).map(r => r.text)

  if (topReasons.length === 0) {
    // Provide encouraging fallback based on overall score
    const avgScore = (scores.skillMatch + scores.visionSimilarity + scores.practicalCompatibility + scores.roleMatch) / 4
    if (avgScore >= 50) {
      return '새로운 도전을 위한 좋은 기회예요'
    }
    return '다양한 경험을 쌓을 수 있는 기회예요'
  }

  return topReasons.join(' · ')
}

/**
 * Calculate overall match score
 * @param pgvectorSimilarity - Optional pre-calculated similarity from pgvector RPC
 */
export function calculateMatchScore(
  profile: Profile,
  opportunity: Opportunity & { similarity?: number }
): MatchResult {
  const skillMatch = calculateSkillMatch(
    profile.skills as Skill[],
    (opportunity.needed_skills as Skill[]) || []
  )

  // Use pgvector similarity if available (from RPC result)
  const visionSimilarity = calculateVisionSimilarity(
    profile.vision_embedding,
    opportunity.vision_embedding,
    opportunity.similarity
  )

  const practicalCompatibility = calculatePracticalCompatibility(profile, opportunity)

  const roleMatch = calculateRoleMatch(profile.desired_position, opportunity.needed_roles)

  // Weighted score
  const finalScore =
    skillMatch * 0.4 +
    visionSimilarity * 0.3 +
    practicalCompatibility * 0.2 +
    roleMatch * 0.1

  const reason = generateMatchReason(profile, opportunity, {
    skillMatch,
    visionSimilarity,
    practicalCompatibility,
    roleMatch,
  })

  return {
    opportunityId: opportunity.id,
    score: Math.round(finalScore),
    skillMatch: Math.round(skillMatch),
    visionSimilarity: Math.round(visionSimilarity),
    practicalCompatibility: Math.round(practicalCompatibility),
    roleMatch: Math.round(roleMatch),
    reason,
  }
}

/**
 * Rank opportunities by match score
 * Supports opportunities with pre-calculated similarity from pgvector
 */
export function rankOpportunities(
  profile: Profile,
  opportunities: Array<Opportunity & { similarity?: number }>
): Array<Opportunity & { match_score: number; match_reason: string; match_details?: { skill: number; vision: number; practical: number; role: number } }> {
  const results = opportunities.map((opp) => {
    const match = calculateMatchScore(profile, opp)
    return {
      ...opp,
      match_score: match.score,
      match_reason: match.reason,
      match_details: {
        skill: match.skillMatch,
        vision: match.visionSimilarity,
        practical: match.practicalCompatibility,
        role: match.roleMatch,
      },
    }
  })

  // Sort by score descending
  return results.sort((a, b) => b.match_score - a.match_score)
}
