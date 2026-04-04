import { createClient } from '@/src/lib/supabase/server'
import { rankUserMatches, type CandidateProfile } from '@/src/lib/ai/user-matcher'
import type { Profile } from '@/src/types/profile'
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

    // Get current user's profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, nickname, desired_position, skills, interest_tags, personality, current_situation, vision_summary, location, onboarding_completed')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profileData) {
      return ApiResponse.notFound('프로필을 찾을 수 없습니다')
    }

    const myProfile = profileData as unknown as Profile

    if (!myProfile.onboarding_completed) {
      return ApiResponse.ok([])
    }

    // Get recent public profiles (pure DB query, no embedding)
    const { data: fallbackUsers, error: fallbackError } = await supabase
      .from('profiles')
      .select('id, user_id, nickname, desired_position, skills, interest_tags, personality, current_situation, vision_summary, location')
      .eq('profile_visibility', 'public')
      .eq('onboarding_completed', true)
      .neq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (fallbackError) {
      return ApiResponse.internalError()
    }

    const candidates = (fallbackUsers || []) as unknown as CandidateProfile[]

    if (candidates.length === 0) {
      return ApiResponse.ok([])
    }

    // Exclude already-connected users
    const { data: connectionsAsCreator } = await supabase
      .from('accepted_connections')
      .select('applicant_id')
      .eq('opportunity_creator_id', user.id)

    const { data: connectionsAsApplicant } = await supabase
      .from('accepted_connections')
      .select('opportunity_creator_id')
      .eq('applicant_id', user.id)

    const connectedIds = new Set<string>()
    for (const c of connectionsAsCreator || []) {
      if (c.applicant_id) connectedIds.add(c.applicant_id)
    }
    for (const c of connectionsAsApplicant || []) {
      if (c.opportunity_creator_id) connectedIds.add(c.opportunity_creator_id)
    }

    const filteredCandidates = candidates.filter(
      (c) => !connectedIds.has(c.user_id)
    )

    // Rank using pure algorithmic matching
    const ranked = rankUserMatches(myProfile, filteredCandidates)

    // Top 15 with curated fields
    const top15 = ranked.slice(0, 15).map((r) => ({
      user_id: r.user_id,
      nickname: r.nickname,
      desired_position: r.desired_position,
      skills: (r.skills || []).slice(0, 3),
      interest_tags: (r.interest_tags || []).slice(0, 3),
      location: r.location,
      vision_summary: r.vision_summary,
      current_situation: r.current_situation,
      match_score: r.match_score,
      match_reason: r.match_reason,
      match_details: r.match_details,
    }))

    return ApiResponse.ok(top15)
  } catch (error) {
    console.error('User recommendations error:', error)
    return ApiResponse.internalError()
  }
}
