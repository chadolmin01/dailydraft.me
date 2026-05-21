import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// 이 Opportunity에 적합한 다른 사용자 추천
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

  const { data: opportunityData, error: oppError } = await supabase
    .from('opportunities')
    .select('id, creator_id, needed_roles, needed_skills, interest_tags')
    .eq('id', id)
    .single()

  if (oppError || !opportunityData) {
    return ApiResponse.notFound('Opportunity not found')
  }

  const opportunity = opportunityData as {
    id: string
    creator_id: string
    needed_roles: string[] | null
    needed_skills: Array<{ name: string; level: string }> | null
    interest_tags: string[] | null
  }

  const { data: existingApplications } = await supabase
    .from('applications')
    .select('applicant_id')
    .eq('opportunity_id', id)

  const applications = existingApplications as { applicant_id: string }[] | null
  const appliedUserIds = new Set(
    (applications || []).map((a) => a.applicant_id)
  )

  const { data: profilesData, error: profileError } = await supabase
    .from('profiles')
    .select(
      'user_id, nickname, desired_position, skills, interest_tags, university, major'
    )
    .neq('user_id', opportunity.creator_id)
    .neq('user_id', user.id)
    .not('nickname', 'is', null)
    .limit(50)

  if (profileError) {
    return ApiResponse.internalError('Failed to fetch profiles')
  }

  interface ProfileData {
    user_id: string
    nickname: string | null
    desired_position: string | null
    skills: Array<{ name: string; level: string }> | null
    interest_tags: string[] | null
    university: string | null
    major: string | null
  }

  const profiles = profilesData as ProfileData[] | null

  const scoredProfiles = (profiles || [])
    .filter((profile) => !appliedUserIds.has(profile.user_id))
    .map((profile) => {
      let score = 0
      const matchReasons: string[] = []

      const neededSkillNames =
        opportunity.needed_skills?.map(
          (s: { name: string }) => s.name.toLowerCase()
        ) || []
      const userSkillNames =
        profile.skills?.map(
          (s: { name: string }) => s.name.toLowerCase()
        ) || []

      const skillMatches = neededSkillNames.filter((skill: string) =>
        userSkillNames.some(
          (us: string) => us.includes(skill) || skill.includes(us)
        )
      )

      if (skillMatches.length > 0) {
        const skillScore = Math.min(
          40,
          (skillMatches.length / neededSkillNames.length) * 40
        )
        score += skillScore
        matchReasons.push(`${skillMatches.length}개 스킬 매칭`)
      }

      const neededRoles =
        opportunity.needed_roles?.map((r: string) => r.toLowerCase()) || []
      const desiredPosition = profile.desired_position?.toLowerCase() || ''

      if (
        neededRoles.some(
          (role: string) =>
            desiredPosition.includes(role) || role.includes(desiredPosition)
        )
      ) {
        score += 30
        matchReasons.push('원하는 역할 일치')
      }

      const oppTags = opportunity.interest_tags || []
      const userTags = profile.interest_tags || []
      const tagMatches = oppTags.filter((tag: string) =>
        userTags.includes(tag)
      )

      if (tagMatches.length > 0) {
        const tagScore = Math.min(30, (tagMatches.length / oppTags.length) * 30)
        score += tagScore
        matchReasons.push(`${tagMatches.length}개 관심 분야 일치`)
      }

      return {
        user_id: profile.user_id,
        nickname: profile.nickname,
        desired_position: profile.desired_position,
        skills: profile.skills?.slice(0, 3) || [],
        interest_tags: profile.interest_tags?.slice(0, 3) || [],
        university: profile.university,
        major: profile.major,
        match_score: Math.round(score),
        match_reasons: matchReasons,
      }
    })
    .filter((p) => p.match_score > 20)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 5)

  return ApiResponse.ok(scoredProfiles)
})
