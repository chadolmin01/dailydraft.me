import { createClient } from '@/src/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// 이 Opportunity에 적합한 다른 사용자 추천
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 현재 사용자 확인
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // Opportunity 정보 가져오기
    const { data: opportunityData, error: oppError } = await supabase
      .from('opportunities')
      .select('id, creator_id, needed_roles, needed_skills, interest_tags')
      .eq('id', id)
      .single()

    if (oppError || !opportunityData) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      )
    }

    const opportunity = opportunityData as {
      id: string
      creator_id: string
      needed_roles: string[] | null
      needed_skills: Array<{ name: string; level: string }> | null
      interest_tags: string[] | null
    }

    // 이미 지원한 사용자 목록 가져오기
    const { data: existingApplications } = await supabase
      .from('applications')
      .select('applicant_id')
      .eq('opportunity_id', id)

    const applications = existingApplications as { applicant_id: string }[] | null
    const appliedUserIds = new Set(
      (applications || []).map((a) => a.applicant_id)
    )

    // 프로필 가져오기 (creator와 현재 사용자 제외)
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
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      )
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

    // 매칭 점수 계산
    const scoredProfiles = (profiles || [])
      .filter((profile) => !appliedUserIds.has(profile.user_id))
      .map((profile) => {
        let score = 0
        const matchReasons: string[] = []

        // 스킬 매칭 (40점)
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

        // 역할 매칭 (30점)
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

        // 관심 분야 매칭 (30점)
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
      .filter((p) => p.match_score > 20) // 최소 20점 이상만
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 5) // 상위 5명

    return NextResponse.json(scoredProfiles)
  } catch (_error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
