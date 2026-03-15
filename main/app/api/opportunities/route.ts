import { createClient } from '@/src/lib/supabase/server'
import { generateOpportunityEmbedding } from '@/src/lib/ai/embeddings'
import { ApiResponse, validateRequired } from '@/src/lib/api-utils'
import {
  checkOpportunityLimit,
  incrementOpportunityUsage,
} from '@/src/lib/subscription/usage-checker'

// Boost type priority for sorting
const BOOST_PRIORITY: Record<string, number> = {
  weekly_feature: 1,
  opportunity_premium: 2,
  opportunity_boost: 3,
}

// GET: List opportunities with filters
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const location = searchParams.get('location')
    const sort = searchParams.get('sort') || 'recent'
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(parseInt(limitParam) || 50, 100) : 50

    // First, get boosted opportunities
    const { data: boostedOpportunities } = await supabase.rpc('get_boosted_opportunities')
    const boostedIds = new Set((boostedOpportunities || []).map((b: { opportunity_id: string }) => b.opportunity_id))
    const boostTypeMap = new Map(
      (boostedOpportunities || []).map((b: { opportunity_id: string; boost_type: string }) => [b.opportunity_id, b.boost_type])
    )

    let query = supabase
      .from('opportunities')
      .select('id, type, title, description, status, creator_id, needed_roles, needed_skills, interest_tags, location_type, location, time_commitment, compensation_type, compensation_details, applications_count, views_count, is_boosted, boost_type, created_at, updated_at')
      .eq('status', 'active')

    // Apply filters
    if (type && ['team_building', 'project_join'].includes(type)) {
      query = query.eq('type', type)
    }

    if (tags && tags.length > 0) {
      query = query.overlaps('interest_tags', tags)
    }

    if (location) {
      query = query.eq('location', location)
    }

    // Apply sorting
    if (sort === 'popular') {
      query = query.order('applications_count', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    query = query.limit(limit)

    const { data, error } = await query

    if (error) {
      return ApiResponse.internalError('Opportunity 목록을 가져오는데 실패했습니다')
    }

    // Sort with boosted opportunities first
    const sortedData = (data || []).map((opp) => ({
      ...opp,
      is_boosted: boostedIds.has(opp.id),
      boost_type: boostTypeMap.get(opp.id) || null,
    })).sort((a, b) => {
      // Boosted items first
      if (a.is_boosted && !b.is_boosted) return -1
      if (!a.is_boosted && b.is_boosted) return 1

      // If both boosted, sort by boost priority
      if (a.is_boosted && b.is_boosted) {
        const priorityA = BOOST_PRIORITY[a.boost_type as string] || 99
        const priorityB = BOOST_PRIORITY[b.boost_type as string] || 99
        if (priorityA !== priorityB) return priorityA - priorityB
      }

      // Maintain original sort order for non-boosted or same-priority items
      return 0
    })

    return ApiResponse.ok(sortedData)
  } catch (error) {
    return ApiResponse.internalError('Opportunity 목록 조회 중 오류가 발생했습니다')
  }
}

// POST: Create new opportunity
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const body = await request.json()

    // Validate required fields
    const validation = validateRequired(body, ['type', 'title', 'description'])
    if (!validation.valid) {
      return ApiResponse.badRequest(`필수 항목이 누락되었습니다: ${validation.missing.join(', ')}`)
    }

    // Validate type
    if (!['team_building', 'project_join'].includes(body.type)) {
      return ApiResponse.badRequest('type은 "team_building" 또는 "project_join"만 가능합니다')
    }

    // Validate title length
    if (body.title.length < 5 || body.title.length > 100) {
      return ApiResponse.badRequest('제목은 5자 이상 100자 이하여야 합니다')
    }

    // Validate description length
    if (body.description.length < 20) {
      return ApiResponse.badRequest('설명은 20자 이상이어야 합니다')
    }

    // Check opportunity limit
    const limitCheck = await checkOpportunityLimit(supabase, user.id)
    if (!limitCheck.allowed) {
      return ApiResponse.forbidden(
        limitCheck.message ||
          '활성 Opportunity 개수가 최대입니다. 기존 Opportunity를 마감하거나 업그레이드하세요.'
      )
    }

    // Generate embedding (with fallback if it fails)
    let embedding = null
    try {
      embedding = await generateOpportunityEmbedding({
        title: body.title,
        description: body.description,
        neededRoles: body.neededRoles,
        neededSkills: body.neededSkills,
        interestTags: body.interestTags,
      })
    } catch (_embeddingError) {
      // Embedding generation failed, continue without it
    }

    // Insert opportunity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('opportunities') as any).insert({
        creator_id: user.id,
        type: body.type,
        title: body.title.trim(),
        description: body.description.trim(),
        needed_roles: body.neededRoles || [],
        needed_skills: body.neededSkills || [],
        interest_tags: body.interestTags || [],
        location_type: body.locationType || null,
        location: body.location || null,
        time_commitment: body.timeCommitment || null,
        compensation_type: body.compensationType || null,
        compensation_details: body.compensationDetails || null,
        vision_embedding: embedding,
      })
      .select()
      .single()

    if (error) {
      return ApiResponse.internalError('Opportunity 생성에 실패했습니다')
    }

    // Increment user's opportunity usage count
    await incrementOpportunityUsage(supabase, user.id)

    return ApiResponse.created(data)
  } catch (error) {
    return ApiResponse.internalError('Opportunity 생성 중 오류가 발생했습니다')
  }
}
