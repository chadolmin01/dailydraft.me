import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { generateOpportunityEmbedding } from '@/src/lib/ai/embeddings'
import { ApiResponse, validateRequired } from '@/src/lib/api-utils'

interface CreateFromEventRequest {
  event_id: string
  type: 'team_building' | 'project_join'
  title?: string
  description?: string
  needed_roles?: string[]
  needed_skills?: Array<{ name: string; level: string }>
  interest_tags?: string[]
  location_type?: 'remote' | 'hybrid' | 'onsite'
  location?: string
  time_commitment?: 'part_time' | 'full_time'
  compensation_type?: 'equity' | 'salary' | 'unpaid' | 'hybrid'
  compensation_details?: string
}

/**
 * POST /api/opportunities/from-event
 * Create an opportunity from a startup event
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const body: CreateFromEventRequest = await request.json()

    // Validate required fields
    const { valid, missing } = validateRequired(body as unknown as Record<string, unknown>, ['event_id', 'type'])
    if (!valid) {
      return ApiResponse.badRequest(`필수 필드가 누락되었습니다: ${missing.join(', ')}`)
    }

    // Validate type
    if (!['team_building', 'project_join'].includes(body.type)) {
      return ApiResponse.badRequest('type은 "team_building" 또는 "project_join"만 가능합니다')
    }

    // Check if event exists
    const { data: eventData, error: eventError } = await supabase
      .from('startup_events')
      .select('*')
      .eq('id', body.event_id)
      .single()

    if (eventError || !eventData) {
      return ApiResponse.notFound('행사를 찾을 수 없습니다')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event = eventData as any

    // Use event data to fill in missing fields
    const title = body.title?.trim() || `${event.title} 팀원 모집`
    const description = body.description?.trim() ||
      `[${event.organizer}] ${event.title}\n\n` +
      (event.description || '') +
      `\n\n마감일: ${event.registration_end_date}`

    // Validate lengths
    if (title.length < 5 || title.length > 100) {
      return ApiResponse.badRequest('제목은 5자 이상 100자 이하여야 합니다')
    }

    if (description.length < 20) {
      return ApiResponse.badRequest('설명은 20자 이상이어야 합니다')
    }

    // Generate embedding
    let embedding = null
    try {
      embedding = await generateOpportunityEmbedding({
        title,
        description,
        neededRoles: body.needed_roles,
        neededSkills: body.needed_skills,
        interestTags: body.interest_tags || event.interest_tags || [],
      })
    } catch (_embeddingError) {
      // Embedding generation failed, continue without it
    }

    // Create opportunity with source_event_id
    const { data: opportunity, error: oppError } = await (supabase.from('opportunities') as ReturnType<typeof supabase.from>)
      .insert({
        creator_id: user.id,
        type: body.type,
        title,
        description,
        needed_roles: body.needed_roles || [],
        needed_skills: body.needed_skills || [],
        interest_tags: body.interest_tags || event.interest_tags || [],
        location_type: body.location_type || null,
        location: body.location || null,
        time_commitment: body.time_commitment || null,
        compensation_type: body.compensation_type || null,
        compensation_details: body.compensation_details || null,
        vision_embedding: embedding,
        source_event_id: body.event_id,
      })
      .select()
      .single()

    if (oppError) {
      return ApiResponse.internalError('Opportunity 생성에 실패했습니다', oppError.message)
    }

    // Create link in event_opportunity_links table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: _linkError } = await (supabase as any)
      .from('event_opportunity_links')
      .insert({
        event_id: body.event_id,
        opportunity_id: opportunity.id,
        created_by: user.id,
        link_type: 'created_from',
      })

    // Link creation is best-effort, don't fail the request if it errors

    return ApiResponse.created({
      ...opportunity,
      source_event: event,
    })

  } catch (error) {
    return ApiResponse.internalError(
      'Opportunity 생성 중 오류가 발생했습니다',
      error instanceof Error ? error.message : undefined
    )
  }
}
