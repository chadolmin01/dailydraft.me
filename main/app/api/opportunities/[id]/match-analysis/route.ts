import { createClient } from '@/src/lib/supabase/server'
import { calculateMatchScore } from '@/src/lib/ai/opportunity-matcher'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import type { Profile, Skill } from '@/src/types/profile'
import type { Opportunity } from '@/src/types/opportunity'

interface SkillAnalysis {
  name: string
  userLevel: string | null
  requiredLevel: string
  match: 'perfect' | 'partial' | 'missing'
  score: number
}

interface MatchAnalysis {
  overallScore: number
  breakdown: {
    skill: number
    practical: number
    role: number
  }
  weights: {
    skill: number
    practical: number
    role: number
  }
  skillAnalysis: SkillAnalysis[]
  missingSkills: string[]
  strengthSkills: string[]
  recommendations: string[]
  competition: {
    totalApplicants: number
    averageMatchScore: number
    yourRank: string
  }
  similarOpportunities: Array<{
    id: string
    title: string
    matchScore: number
    creator: string
  }>
}

export const GET = withErrorCapture(async (
  _request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  // profile + opportunity 병렬 (서로 독립)
  const [profileResult, opportunityResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('opportunities').select('*').eq('id', id).single(),
  ])

  if (!profileResult.data) {
    return ApiResponse.notFound('Profile not found')
  }
  if (!opportunityResult.data) {
    return ApiResponse.notFound('Opportunity not found')
  }

  const profile = profileResult.data as unknown as Profile
  const opportunityData = opportunityResult.data

  const opportunity = opportunityData as unknown as Opportunity

  const { data: creatorProfile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('user_id', opportunity.creator_id)
    .single()

  const _creatorNickname = creatorProfile?.nickname ?? null

  const matchResult = calculateMatchScore(profile, opportunity)

  const neededSkills = (opportunity.needed_skills || []) as unknown as Skill[]
  const userSkills = (profile.skills || []) as unknown as Skill[]

  const skillAnalysis: SkillAnalysis[] = neededSkills.map((needed) => {
    const userSkill = userSkills.find((s) => s.name === needed.name)

    if (!userSkill) {
      return {
        name: needed.name,
        userLevel: null,
        requiredLevel: needed.name,
        match: 'missing' as const,
        score: 0,
      }
    }

    return {
      name: needed.name,
      userLevel: userSkill.name,
      requiredLevel: needed.name,
      match: 'perfect' as const,
      score: 100,
    }
  })

  const missingSkills = skillAnalysis
    .filter((s) => s.match === 'missing')
    .map((s) => s.name)

  const strengthSkills = skillAnalysis
    .filter((s) => s.match === 'perfect')
    .map((s) => s.name)

  const recommendations: string[] = []

  if (missingSkills.length > 0) {
    recommendations.push(
      `${missingSkills.slice(0, 2).join(', ')} 스킬을 추가하면 매칭률이 높아집니다`
    )
  }

  if (matchResult.roleMatch < 50 && (opportunity.needed_roles?.length ?? 0) > 0) {
    recommendations.push(
      `이 기회는 ${opportunity.needed_roles!.slice(0, 2).join(', ')} 역할을 찾고 있습니다`
    )
  }

  if (
    opportunity.location_type !== 'remote' &&
    !(profile.locations as string[] | null)?.includes(opportunity.location as string)
  ) {
    recommendations.push('위치가 다르지만 협의 가능할 수 있습니다')
  }

  const { data: applications } = await supabase
    .from('applications')
    .select('match_score')
    .eq('opportunity_id', id)

  const appList = (applications || []) as { match_score: number }[]
  const totalApplicants = appList.length
  const averageMatchScore =
    totalApplicants > 0
      ? Math.round(
          appList.reduce((sum, a) => sum + (a.match_score || 0), 0) /
            totalApplicants
        )
      : 0

  const higherScoreCount = appList.filter(
    (a) => (a.match_score || 0) > matchResult.score
  ).length
  let yourRank = '상위 50%'
  if (totalApplicants === 0) {
    yourRank = '첫 번째 지원자가 될 수 있어요!'
  } else if (higherScoreCount === 0) {
    yourRank = '상위 1%'
  } else {
    const percentile = Math.round(
      ((higherScoreCount + 1) / (totalApplicants + 1)) * 100
    )
    if (percentile <= 10) yourRank = '상위 10%'
    else if (percentile <= 25) yourRank = '상위 25%'
    else if (percentile <= 50) yourRank = '상위 50%'
    else yourRank = '평균 이하'
  }

  const { data: similarOpps } = await supabase
    .from('opportunities')
    .select('id, title, needed_skills, needed_roles, interest_tags, creator_id')
    .eq('status', 'active')
    .neq('id', id)
    .neq('creator_id', user.id)
    .limit(20)

  const similarOppsList = (similarOpps || []) as unknown as Array<
    Opportunity & { creator_id: string }
  >

  const simCreatorIds = [...new Set(similarOppsList.map(o => o.creator_id))]
  const { data: simCreatorProfiles } = simCreatorIds.length > 0
    ? await supabase.from('profiles').select('user_id, nickname').in('user_id', simCreatorIds)
    : { data: [] }
  const simCreatorMap = new Map(
    (simCreatorProfiles || []).map((p: { user_id: string; nickname: string }) => [p.user_id, p.nickname])
  )

  const rankedSimilar = similarOppsList
    .map((opp) => {
      const oppMatch = calculateMatchScore(profile, opp)

      const tagOverlap = (opp.interest_tags || []).filter((t) =>
        (opportunity.interest_tags || []).includes(t)
      ).length

      const skillOverlap = ((opp.needed_skills || []) as unknown as Skill[]).filter((s) =>
        neededSkills.some((ns) => ns.name === s.name)
      ).length

      const similarityScore = tagOverlap * 2 + skillOverlap * 3

      return {
        id: opp.id,
        title: opp.title,
        matchScore: oppMatch.score,
        creator: simCreatorMap.get(opp.creator_id) || '익명',
        similarityScore,
      }
    })
    .filter((o) => o.similarityScore > 0 || o.matchScore >= 60)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5)
    .map(({ similarityScore: _, ...rest }) => rest)

  const analysis: MatchAnalysis = {
    overallScore: matchResult.score,
    breakdown: {
      skill: matchResult.skillMatch,
      practical: matchResult.practicalCompatibility,
      role: matchResult.roleMatch,
    },
    weights: {
      skill: 40,
      practical: 25,
      role: 35,
    },
    skillAnalysis,
    missingSkills,
    strengthSkills,
    recommendations,
    competition: {
      totalApplicants,
      averageMatchScore,
      yourRank,
    },
    similarOpportunities: rankedSimilar,
  }

  return ApiResponse.ok(analysis)
})
