import { createClient } from '@/src/lib/supabase/server'
import { rankOpportunities } from '@/src/lib/ai/opportunity-matcher'
import type { Opportunity } from '@/src/types/opportunity'
import type { Profile } from '@/src/types/profile'
import { ApiResponse } from '@/src/lib/api-utils'
import { captureServerError } from '@/src/lib/posthog/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    // Get user profile (no embedding needed)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, nickname, desired_position, skills, interest_tags, personality, current_situation, vision_summary, location, onboarding_completed')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profileData) {
      return ApiResponse.notFound('Profile not found')
    }

    const profile = profileData as unknown as Profile

    // Get active opportunities (pure DB query, no embedding)
    const { data: opps, error: oppError } = await supabase
      .from('opportunities')
      .select('id, type, title, description, status, creator_id, needed_roles, needed_skills, interest_tags, location_type, location, time_commitment, compensation_type, compensation_details, applications_count, views_count, created_at, updated_at')
      .eq('status', 'active')
      .neq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .limit(50)

    if (oppError) {
      return ApiResponse.internalError()
    }

    const opportunities = (opps || []) as unknown as Opportunity[]

    if (opportunities.length === 0) {
      return ApiResponse.ok([])
    }

    // Rank opportunities with pure algorithmic matching
    const ranked = rankOpportunities(profile, opportunities)

    // Return top 20
    return ApiResponse.ok(ranked.slice(0, 20))
  } catch (error) {
    console.error('Opportunity recommend error:', error)
    captureServerError(error, { route: 'GET /api/opportunities/recommend' })
    return ApiResponse.internalError()
  }
}
