import { createClient } from '@/src/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { calculateMatchScore } from '@/src/lib/ai/opportunity-matcher'
import { ApiResponse } from '@/src/lib/api-utils'
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
    vision: number
    practical: number
    role: number
  }
  weights: {
    skill: number
    vision: number
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    // Get user profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!profileData) {
      return ApiResponse.notFound('Profile not found')
    }

    const profile = profileData as unknown as Profile

    // Get opportunity with creator info
    const { data: opportunityData } = await supabase
      .from('opportunities')
      .select(`
        *,
        profiles!opportunities_creator_id_fkey (
          nickname
        )
      `)
      .eq('id', id)
      .single()

    if (!opportunityData) {
      return ApiResponse.notFound('Opportunity not found')
    }

    const opportunity = opportunityData as unknown as Opportunity & {
      profiles: { nickname: string } | null
    }

    // Calculate match score
    const matchResult = calculateMatchScore(profile, opportunity)

    // Detailed skill analysis
    const neededSkills = (opportunity.needed_skills || []) as Skill[]
    const userSkills = (profile.skills || []) as Skill[]

    const levelScore: Record<string, number> = { '초급': 1, '중급': 2, '고급': 3 }

    const skillAnalysis: SkillAnalysis[] = neededSkills.map((needed) => {
      const userSkill = userSkills.find((s) => s.name === needed.name)

      if (!userSkill) {
        return {
          name: needed.name,
          userLevel: null,
          requiredLevel: needed.level,
          match: 'missing' as const,
          score: 0,
        }
      }

      const userLevelNum = levelScore[userSkill.level] || 0
      const neededLevelNum = levelScore[needed.level] || 0

      let match: 'perfect' | 'partial' | 'missing' = 'partial'
      let score = 70

      if (userLevelNum >= neededLevelNum) {
        match = 'perfect'
        score = 100
      } else if (userLevelNum === neededLevelNum - 1) {
        match = 'partial'
        score = 70
      } else {
        match = 'partial'
        score = 40
      }

      return {
        name: needed.name,
        userLevel: userSkill.level,
        requiredLevel: needed.level,
        match,
        score,
      }
    })

    const missingSkills = skillAnalysis
      .filter((s) => s.match === 'missing')
      .map((s) => s.name)

    const strengthSkills = skillAnalysis
      .filter((s) => s.match === 'perfect')
      .map((s) => s.name)

    // Generate recommendations
    const recommendations: string[] = []

    if (missingSkills.length > 0) {
      recommendations.push(
        `${missingSkills.slice(0, 2).join(', ')} 스킬을 추가하면 매칭률이 높아집니다`
      )
    }

    if (!profile.ai_chat_completed) {
      recommendations.push('AI 채팅을 완료하면 비전 매칭 정확도가 향상됩니다')
    }

    if (matchResult.roleMatch < 50 && opportunity.needed_roles.length > 0) {
      recommendations.push(
        `이 기회는 ${opportunity.needed_roles.slice(0, 2).join(', ')} 역할을 찾고 있습니다`
      )
    }

    if (
      opportunity.location_type !== 'remote' &&
      opportunity.location !== profile.location
    ) {
      recommendations.push('위치가 다르지만 협의 가능할 수 있습니다')
    }

    // Get competition data
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

    // Calculate user's rank
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

    // Get similar opportunities
    const { data: similarOpps } = await supabase
      .from('opportunities')
      .select(`
        id, title, needed_skills, needed_roles, interest_tags,
        profiles!opportunities_creator_id_fkey (nickname)
      `)
      .eq('status', 'active')
      .neq('id', id)
      .neq('creator_id', user.id)
      .limit(20)

    const similarOppsList = (similarOpps || []) as unknown as Array<
      Opportunity & { profiles: { nickname: string } | null }
    >

    // Rank by overlap with current opportunity
    const rankedSimilar = similarOppsList
      .map((opp) => {
        const oppMatch = calculateMatchScore(profile, opp)

        // Calculate similarity to current opportunity
        const tagOverlap = (opp.interest_tags || []).filter((t) =>
          (opportunity.interest_tags || []).includes(t)
        ).length

        const skillOverlap = ((opp.needed_skills || []) as Skill[]).filter((s) =>
          neededSkills.some((ns) => ns.name === s.name)
        ).length

        const similarityScore = tagOverlap * 2 + skillOverlap * 3

        return {
          id: opp.id,
          title: opp.title,
          matchScore: oppMatch.score,
          creator: opp.profiles?.nickname || '익명',
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
        vision: matchResult.visionSimilarity,
        practical: matchResult.practicalCompatibility,
        role: matchResult.roleMatch,
      },
      weights: {
        skill: 35,
        vision: 15,
        practical: 20,
        role: 30,
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

    return NextResponse.json(analysis)
  } catch (_error) {
    return ApiResponse.internalError()
  }
}
