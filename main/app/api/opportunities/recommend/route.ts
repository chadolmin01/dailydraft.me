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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with vision_embedding
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const profile = profileData as unknown as Profile & { vision_embedding?: number[] }

    let opportunities: Opportunity[] = []

    // If user has vision_embedding, use pgvector similarity search
    if (profile.vision_embedding) {
      // Get opportunities with similarity score from pgvector
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: similarOpps, error: similarError } = await (supabase as any).rpc('match_opportunities', {
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
        .select('*')
        .eq('status', 'active')
        .neq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (oppError) {
        return NextResponse.json({ error: oppError.message }, { status: 500 })
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
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
