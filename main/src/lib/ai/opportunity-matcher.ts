import type { Opportunity } from '@/src/types/opportunity'
import type { Profile, Skill } from '@/src/types/profile'

interface MatchResult {
  opportunityId: string
  score: number
  skillMatch: number
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

  let matchedCount = 0

  for (const needed of neededSkills) {
    const userSkill = userSkills.find((s) => s.name === needed.name)
    if (userSkill) {
      matchedCount++
    }
  }

  return (matchedCount / neededSkills.length) * 100
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
      .filter(s => ((opportunity.needed_skills || []) as unknown as Skill[]).some(ns => ns.name === s.name))
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

  // Interest overlap
  const overlappingTags = (opportunity.interest_tags || []).filter((tag) =>
    (profile.interest_tags || []).includes(tag)
  )

  if (overlappingTags.length >= 2) {
    const tags = overlappingTags.slice(0, 2).join(', ')
    reasons.push({ priority: 3, text: `${tags}에 함께 관심있어요` })
  } else if (overlappingTags.length === 1) {
    reasons.push({ priority: 4, text: `${overlappingTags[0]} 분야에 관심있어요` })
  }

  // Location advantages
  if (opportunity.location_type === 'remote') {
    reasons.push({ priority: 6, text: '원격 근무 가능' })
  } else if (opportunity.location === profile.location && profile.location) {
    reasons.push({ priority: 6, text: `같은 지역(${profile.location})` })
  }

  // Sort by priority and take top 3
  reasons.sort((a, b) => a.priority - b.priority)
  const topReasons = reasons.slice(0, 3).map(r => r.text)

  if (topReasons.length === 0) {
    const avgScore = (scores.skillMatch + scores.practicalCompatibility + scores.roleMatch) / 3
    if (avgScore >= 50) {
      return '새로운 도전을 위한 좋은 기회예요'
    }
    return '다양한 경험을 쌓을 수 있는 기회예요'
  }

  return topReasons.join(' · ')
}

/**
 * Calculate overall match score — pure algorithmic, no embedding
 */
export function calculateMatchScore(
  profile: Profile,
  opportunity: Opportunity
): MatchResult {
  const skillMatch = calculateSkillMatch(
    profile.skills as unknown as Skill[],
    ((opportunity.needed_skills as unknown as Skill[]) || [])
  )

  const practicalCompatibility = calculatePracticalCompatibility(profile, opportunity)

  const roleMatch = calculateRoleMatch(profile.desired_position, opportunity.needed_roles || [])

  // Weighted score (redistributed from vision removal)
  const finalScore =
    skillMatch * 0.40 +
    practicalCompatibility * 0.25 +
    roleMatch * 0.35

  const reason = generateMatchReason(profile, opportunity, {
    skillMatch,
    practicalCompatibility,
    roleMatch,
  })

  return {
    opportunityId: opportunity.id,
    score: Math.round(finalScore),
    skillMatch: Math.round(skillMatch),
    practicalCompatibility: Math.round(practicalCompatibility),
    roleMatch: Math.round(roleMatch),
    reason,
  }
}

/**
 * Rank opportunities by match score
 */
export function rankOpportunities(
  profile: Profile,
  opportunities: Opportunity[]
): Array<Opportunity & { match_score: number; match_reason: string; match_details?: { skill: number; practical: number; role: number } }> {
  const results = opportunities.map((opp) => {
    const match = calculateMatchScore(profile, opp)
    return {
      ...opp,
      match_score: match.score,
      match_reason: match.reason,
      match_details: {
        skill: match.skillMatch,
        practical: match.practicalCompatibility,
        role: match.roleMatch,
      },
    }
  })

  // Sort by score descending
  return results.sort((a, b) => b.match_score - a.match_score)
}
