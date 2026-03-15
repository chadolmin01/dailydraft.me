import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { rankUserMatches } from '@/src/lib/ai/user-matcher'
import type { Profile } from '@/src/types/profile'
import type { ProfileAnalysisResult } from '@/src/types/profile-analysis'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const myProfile = profileData as any as Profile & {
      vision_embedding?: number[]
      profile_analysis?: { founder_type?: ProfileAnalysisResult['founder_type'] } | null
    }

    if (!myProfile.onboarding_completed) {
      return NextResponse.json([])
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let candidates: any[] = []

    // Try pgvector path if user has embedding
    if (myProfile.vision_embedding) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: similarUsers, error: rpcError } = await (supabase as any).rpc('match_users', {
        query_embedding: myProfile.vision_embedding,
        match_threshold: 0.3,
        match_count: 50,
        exclude_user_id: user.id,
      })

      if (!rpcError && similarUsers && similarUsers.length > 0) {
        candidates = similarUsers
      }
    }

    // Fallback: get recent public profiles
    if (candidates.length === 0) {
      const { data: fallbackUsers, error: fallbackError } = await supabase
        .from('profiles')
        .select('id, user_id, nickname, desired_position, skills, interest_tags, personality, current_situation, vision_summary, location, profile_analysis, extracted_profile')
        .eq('profile_visibility', 'public')
        .eq('onboarding_completed', true)
        .neq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50)

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 })
      }

      candidates = fallbackUsers || []
    }

    if (candidates.length === 0) {
      return NextResponse.json([])
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

    // Rank using the matching algorithm
    const ranked = rankUserMatches(myProfile, filteredCandidates)

    // Return top 15 with curated fields
    const results = ranked.slice(0, 15).map((r) => ({
      user_id: r.user_id,
      nickname: r.nickname,
      desired_position: r.desired_position,
      skills: (r.skills || []).slice(0, 3),
      interest_tags: (r.interest_tags || []).slice(0, 3),
      location: r.location,
      vision_summary: r.vision_summary,
      founder_type: r.profile_analysis?.founder_type || null,
      current_situation: r.current_situation,
      match_score: r.match_score,
      match_reason: r.match_reason,
      match_details: r.match_details,
    }))

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
