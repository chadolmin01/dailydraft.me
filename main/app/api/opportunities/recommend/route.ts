import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { rankOpportunities } from '@/src/lib/ai/opportunity-matcher'
import type { Opportunity } from '@/src/types/opportunity'
import type { Profile } from '@/src/types/profile'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // Get user profile with vision_embedding
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, nickname, desired_position, skills, interest_tags, personality, current_situation, vision_summary, location, profile_analysis, onboarding_completed, vision_embedding')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const profile = profileData as unknown as Profile & { vision_embedding?: string }

    let opportunities: Opportunity[] = []

    // If user has vision_embedding, use pgvector similarity search
    if (profile.vision_embedding) {
      // Get opportunities with similarity score from pgvector
      const { data: similarOpps, error: similarError } = await supabase.rpc('match_opportunities', {
          query_embedding: profile.vision_embedding,
          match_threshold: 0.3,
          match_count: 50,
          exclude_creator_id: user.id
        })

      if (!similarError && similarOpps && similarOpps.length > 0) {
        opportunities = similarOpps as unknown as Opportunity[]
      }
    }

    // Fallback: Get opportunities without similarity if no results or no embedding
    if (opportunities.length === 0) {
      const { data: fallbackOpps, error: oppError } = await supabase
        .from('opportunities')
        .select('id, type, title, description, status, creator_id, needed_roles, needed_skills, interest_tags, location_type, location, time_commitment, compensation_type, compensation_details, applications_count, views_count, created_at, updated_at')
        .eq('status', 'active')
        .neq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (oppError) {
        return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 })
      }

      opportunities = (fallbackOpps || []) as unknown as Opportunity[]
    }

    if (opportunities.length === 0) {
      return NextResponse.json([])
    }

    // Rank opportunities with full matching algorithm
    const ranked = rankOpportunities(profile as Profile, opportunities)

    // Return top 20
    return NextResponse.json(ranked.slice(0, 20))
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
