import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/events/[id]/linked-opportunities
 * Get opportunities linked to a specific event
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: eventId } = await context.params
    const supabase = await createClient()

    // Get opportunities linked via event_opportunity_links table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: links, error: linksError } = await (supabase as any)
      .from('event_opportunity_links')
      .select(`
        id,
        link_type,
        created_at,
        opportunity:opportunities (
          id,
          type,
          title,
          description,
          status,
          needed_roles,
          interest_tags,
          location_type,
          location,
          applications_count,
          views_count,
          created_at,
          creator:profiles!opportunities_creator_id_fkey (
            nickname,
            user_id
          )
        )
      `)
      .eq('event_id', eventId)

    if (linksError) {
      // Continue to check source_event_id fallback
    }

    // Also get opportunities that have this event as source_event_id
    const { data: sourceOpportunities, error: _sourceError } = await supabase
      .from('opportunities')
      .select(`
        id,
        type,
        title,
        description,
        status,
        needed_roles,
        interest_tags,
        location_type,
        location,
        applications_count,
        views_count,
        created_at,
        creator:profiles!opportunities_creator_id_fkey (
          nickname,
          user_id
        )
      `)
      .eq('source_event_id', eventId)
      .eq('status', 'active')

    // Source error handled silently

    // Combine and deduplicate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const linkedOpportunities = links?.map((link: any) => ({
      ...link.opportunity,
      link_type: link.link_type,
      linked_at: link.created_at,
    })) || []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sourceOpportunitiesFormatted = sourceOpportunities?.map((opp: any) => ({
      ...opp,
      link_type: 'created_from',
      linked_at: opp.created_at,
    })) || []

    // Deduplicate by opportunity ID
    const seen = new Set<string>()
    const allOpportunities = [...linkedOpportunities, ...sourceOpportunitiesFormatted].filter((opp) => {
      if (!opp || !opp.id) return false
      if (seen.has(opp.id)) return false
      seen.add(opp.id)
      return true
    })

    return ApiResponse.ok({
      opportunities: allOpportunities,
      total: allOpportunities.length,
    })

  } catch (_error) {
    return ApiResponse.internalError()
  }
}

/**
 * POST /api/events/[id]/linked-opportunities
 * Link an existing opportunity to an event
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: eventId } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const body = await request.json()
    const { opportunity_id, link_type = 'related' } = body

    if (!opportunity_id) {
      return ApiResponse.badRequest('opportunity_id is required')
    }

    if (!['created_from', 'related'].includes(link_type)) {
      return ApiResponse.badRequest('link_type must be "created_from" or "related"')
    }

    // Verify user owns the opportunity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: opportunity } = await (supabase as any)
      .from('opportunities')
      .select('id, creator_id')
      .eq('id', opportunity_id)
      .single()

    if (!opportunity) {
      return ApiResponse.notFound('Opportunity를 찾을 수 없습니다')
    }

    if (opportunity.creator_id !== user.id) {
      return ApiResponse.forbidden('본인의 Opportunity만 연결할 수 있습니다')
    }

    // Check if event exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: event } = await (supabase as any)
      .from('startup_events')
      .select('id')
      .eq('id', eventId)
      .single()

    if (!event) {
      return ApiResponse.notFound('행사를 찾을 수 없습니다')
    }

    // Create link
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: link, error } = await (supabase as any)
      .from('event_opportunity_links')
      .insert({
        event_id: eventId,
        opportunity_id,
        created_by: user.id,
        link_type,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return ApiResponse.badRequest('이미 연결된 Opportunity입니다')
      }
      return ApiResponse.internalError('연결 생성에 실패했습니다', error.message)
    }

    return ApiResponse.created(link)

  } catch (_error) {
    return ApiResponse.internalError()
  }
}

/**
 * DELETE /api/events/[id]/linked-opportunities
 * Unlink an opportunity from an event
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: eventId } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const opportunityId = searchParams.get('opportunity_id')

    if (!opportunityId) {
      return ApiResponse.badRequest('opportunity_id query parameter is required')
    }

    // Delete link (RLS will verify ownership)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('event_opportunity_links')
      .delete()
      .eq('event_id', eventId)
      .eq('opportunity_id', opportunityId)
      .eq('created_by', user.id)

    if (error) {
      return ApiResponse.internalError('연결 삭제에 실패했습니다', error.message)
    }

    return ApiResponse.noContent()

  } catch (_error) {
    return ApiResponse.internalError()
  }
}
