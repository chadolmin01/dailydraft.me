import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    // 프로필 가져오기
    const { data: profile } = await supabase
      .from('profiles')
      .select('skills, interest_tags, ai_chat_completed, contact_email, profile_views')
      .eq('user_id', user.id)
      .single()

    const profileData = profile as {
      skills: Array<{ name: string; level: string }> | null
      interest_tags: string[] | null
      ai_chat_completed: boolean | null
      contact_email: string | null
      profile_views: number | null
    } | null

    // 매칭 가능한 Opportunity 수 (관심 분야 겹치는)
    let matchedCount = 0
    if (profileData?.interest_tags && profileData.interest_tags.length > 0) {
      const { count } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .neq('creator_id', user.id)
        .overlaps('interest_tags', profileData.interest_tags)

      matchedCount = count || 0
    }

    // 인기 스킬 집계 (가장 많이 요구되는 스킬)
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('needed_skills, needed_roles')
      .eq('status', 'active')
      .limit(50)

    interface OppData {
      needed_skills: Array<{ name: string }> | null
      needed_roles: string[] | null
    }

    const opps = opportunities as OppData[] | null
    const skillCounts: Record<string, number> = {}

    opps?.forEach((opp) => {
      opp.needed_skills?.forEach((skill) => {
        skillCounts[skill.name] = (skillCounts[skill.name] || 0) + 1
      })
      opp.needed_roles?.forEach((role) => {
        skillCounts[role] = (skillCounts[role] || 0) + 1
      })
    })

    const demandedSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name)

    // 사용자 스킬과 매칭되는 스킬
    const userSkillNames =
      profileData?.skills?.map((s) => s.name.toLowerCase()) || []
    const topMatchingSkills = demandedSkills.filter((skill) =>
      userSkillNames.some(
        (us) => us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us)
      )
    )

    // 프로필 강도 계산
    let profileStrength = 0
    if (profileData) {
      if (profileData.skills && profileData.skills.length > 0) {
        profileStrength += 25 + Math.min(15, profileData.skills.length * 3)
      }
      if (profileData.interest_tags && profileData.interest_tags.length > 0) {
        profileStrength += 20 + Math.min(10, profileData.interest_tags.length * 2)
      }
      if (profileData.ai_chat_completed) {
        profileStrength += 20
      }
      if (profileData.contact_email) {
        profileStrength += 10
      }
    }
    profileStrength = Math.min(100, profileStrength)

    // 평균 매칭 점수 (임의 계산)
    const averageMatchScore = Math.round(
      40 + (profileStrength * 0.4) + (topMatchingSkills.length * 5)
    )

    return ApiResponse.ok({
      profileViews: profileData?.profile_views || 0,
      matchedOpportunities: matchedCount,
      topMatchingSkills,
      demandedSkills,
      profileStrength,
      averageMatchScore: Math.min(95, averageMatchScore),
    })
  } catch (_error) {
    return ApiResponse.internalError()
  }
}
