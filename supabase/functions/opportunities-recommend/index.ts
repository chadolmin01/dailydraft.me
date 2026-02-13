import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  limit?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { limit = 10 }: RequestBody = await req.json()

    // Get user's profile with embedding
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('vision_embedding, interest_tags, desired_position')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      // Fallback to recent opportunities if no profile
      const { data: opportunities } = await supabaseClient
        .from('opportunities')
        .select('id, title, type, description')
        .eq('status', 'active')
        .neq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      return new Response(
        JSON.stringify({
          opportunities: opportunities?.map((o) => ({
            id: o.id,
            title: o.title,
            matchScore: 70, // Default score
            matchReason: '프로필을 완성하면 더 정확한 매칭을 받을 수 있습니다.',
          })) ?? [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If user has embedding, use vector similarity search
    if (profile.vision_embedding) {
      const { data: matchedOpportunities, error: matchError } = await supabaseClient.rpc(
        'match_opportunities',
        {
          query_embedding: profile.vision_embedding,
          match_threshold: 0.5,
          match_count: limit,
          exclude_creator_id: user.id,
        }
      )

      if (matchError) {
        console.error('Match error:', matchError)
        throw new Error('Failed to match opportunities')
      }

      return new Response(
        JSON.stringify({
          opportunities: matchedOpportunities?.map((o: { id: string; title: string; similarity: number }) => ({
            id: o.id,
            title: o.title,
            matchScore: Math.round(o.similarity * 100),
            matchReason: `비전 유사도 ${Math.round(o.similarity * 100)}%`,
          })) ?? [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fallback: tag-based matching
    const { data: opportunities } = await supabaseClient
      .from('opportunities')
      .select('id, title, type, interest_tags')
      .eq('status', 'active')
      .neq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit * 2)

    // Simple tag overlap scoring
    const userTags = profile.interest_tags || []
    const scored = opportunities?.map((o) => {
      const oppTags = o.interest_tags || []
      const overlap = userTags.filter((t: string) => oppTags.includes(t)).length
      const score = userTags.length > 0 ? (overlap / userTags.length) * 100 : 50
      return {
        id: o.id,
        title: o.title,
        matchScore: Math.round(score),
        matchReason: overlap > 0 ? `${overlap}개의 관심사가 일치합니다.` : '새로운 기회를 탐색해보세요.',
      }
    }) ?? []

    // Sort by score and limit
    scored.sort((a, b) => b.matchScore - a.matchScore)

    return new Response(
      JSON.stringify({ opportunities: scored.slice(0, limit) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in opportunities-recommend:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
