import { createClient } from '@/src/lib/supabase/server'
import { generateOpportunityEmbedding } from '@/src/lib/ai/embeddings'
import { ApiResponse, validateRequired } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import type { Tables } from '@/src/types/database'

interface CreateFromEventRequest {
  event_id: string
  type: 'side_project' | 'startup' | 'study'
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
export const POST = withErrorCapture(async (request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  const body: CreateFromEventRequest = await request.json()

  const { valid, missing } = validateRequired(body as unknown as Record<string, unknown>, ['event_id', 'type'])
  if (!valid) {
    return ApiResponse.badRequest(`필수 필드가 누락되었습니다: ${missing.join(', ')}`)
  }

  if (!['side_project', 'startup', 'study'].includes(body.type)) {
    return ApiResponse.badRequest('type은 "side_project", "startup", "study"만 가능합니다')
  }

  const { data: eventData, error: eventError } = await supabase
    .from('startup_events')
    .select('*')
    .eq('id', body.event_id)
    .single()

  if (eventError || !eventData) {
    return ApiResponse.notFound('행사를 찾을 수 없습니다')
  }

  const event = eventData as Tables<'startup_events'>

  const title = body.title?.trim() || `${event.title} 팀원 모집`
  const description = body.description?.trim() ||
    `[${event.organizer}] ${event.title}\n\n` +
    (event.description || '') +
    `\n\n마감일: ${event.registration_end_date}`

  if (title.length < 5 || title.length > 100) {
    return ApiResponse.badRequest('제목은 5자 이상 100자 이하여야 합니다')
  }

  if (description.length < 20) {
    return ApiResponse.badRequest('설명은 20자 이상이어야 합니다')
  }

  // Inner try/catch: embedding failure shouldn't fail creation
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

  // Link creation is best-effort, don't fail the request if it errors
  const { error: _linkError } = await supabase
    .from('event_opportunity_links')
    .insert({
      event_id: body.event_id,
      opportunity_id: opportunity.id,
      created_by: user.id,
      link_type: 'created_from',
    })

  return ApiResponse.created({
    ...opportunity,
    source_event: event,
  })
})
