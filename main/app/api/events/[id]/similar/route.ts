import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { getKSTDate } from '@/src/lib/utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

interface SimilarEvent {
  event_id: string
  title: string
  event_type: string
  registration_end_date: string
  similarity_score: number
}

/**
 * GET /api/events/[id]/similar
 * Get similar events based on embedding similarity
 */
export const GET = withErrorCapture(async (request, context: { params: Promise<{ id: string }> }) => {
    const { id: eventId } = await context.params
    const supabase = await createClient()

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5', 10)
    const minSimilarity = parseFloat(searchParams.get('min_similarity') || '0.3')

    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from('startup_events')
      .select('id, content_embedding')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return ApiResponse.notFound('행사를 찾을 수 없습니다')
    }

    if (!event.content_embedding) {
      return ApiResponse.ok({
        similar_events: [],
        message: '이 행사에는 임베딩이 없어 유사 행사를 찾을 수 없습니다',
      })
    }

    // Call the find_similar_events function
    // 타입 캐스팅: find_similar_events RPC가 generated types에 누락됨 (마이그레이션 추적 이슈).
    // 런타임 동작은 정상이라 any 캐스팅으로 빌드 통과.
    const { data: similarEventsRaw, error: rpcError } = await (supabase.rpc as any)(
      'find_similar_events',
      {
        p_event_id: eventId,
        p_limit: limit,
        p_min_similarity: minSimilarity,
      }
    )
    const similarEvents = similarEventsRaw as SimilarEvent[] | null

    if (rpcError) {
      // Fallback to manual query if function doesn't exist
      return await fallbackSimilarEvents(supabase, eventId, limit)
    }

    // Fetch full event details for the similar events
    if (!similarEvents || similarEvents.length === 0) {
      return ApiResponse.ok({
        similar_events: [],
      })
    }

    const eventIds = similarEvents.map((e: SimilarEvent) => e.event_id)
    const { data: fullEvents } = await supabase
      .from('startup_events')
      .select('id, title, organizer, event_type, registration_end_date, registration_url, interest_tags')
      .in('id', eventIds)

    // Merge similarity scores with full event data
    const enrichedEvents = (fullEvents || []).map((fullEvent: Record<string, unknown>) => {
      const similar = similarEvents.find((s: SimilarEvent) => s.event_id === fullEvent.id)
      return {
        ...fullEvent,
        similarity_score: similar?.similarity_score || 0,
      }
    }).sort((a: { similarity_score: number }, b: { similarity_score: number }) =>
      b.similarity_score - a.similarity_score
    )

    return ApiResponse.ok({
      similar_events: enrichedEvents,
    })
})

/**
 * Fallback implementation if RPC function doesn't exist
 */
async function fallbackSimilarEvents(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  eventId: string,
  limit: number
) {
  try {
    // Get source event
    const { data: sourceEvent } = await supabase
      .from('startup_events')
      .select('interest_tags, event_type')
      .eq('id', eventId)
      .single()

    if (!sourceEvent) {
      return ApiResponse.ok({ similar_events: [] })
    }

    // Find events with overlapping tags
    let query = supabase
      .from('startup_events')
      .select('id, title, organizer, event_type, registration_end_date, registration_url, interest_tags')
      .eq('status', 'active')
      .neq('id', eventId)
      .gte('registration_end_date', getKSTDate())
      .limit(limit * 2) // Fetch more to filter

    // Prefer same event type
    if (sourceEvent.event_type) {
      query = query.eq('event_type', sourceEvent.event_type)
    }

    const { data: candidates } = await query

    if (!candidates || candidates.length === 0) {
      return ApiResponse.ok({ similar_events: [] })
    }

    // Calculate similarity based on tag overlap
    const sourceTagsLower = (sourceEvent.interest_tags || []).map((t: string) => t.toLowerCase())

    const scored = candidates.map((event) => {
      const eventTagsLower = (event.interest_tags || []).map((t: string) => t.toLowerCase())
      const commonTags = sourceTagsLower.filter((t: string) => eventTagsLower.includes(t))
      const totalTags = new Set([...sourceTagsLower, ...eventTagsLower]).size
      const similarity = totalTags > 0 ? commonTags.length / totalTags : 0

      return {
        ...event,
        similarity_score: Math.round(similarity * 100) / 100,
      }
    })

    // Sort by similarity and limit
    const sorted = scored
      .filter((e: { similarity_score: number }) => e.similarity_score > 0)
      .sort((a: { similarity_score: number }, b: { similarity_score: number }) =>
        b.similarity_score - a.similarity_score
      )
      .slice(0, limit)

    return ApiResponse.ok({
      similar_events: sorted,
      fallback: true,
    })

  } catch (_error) {
    return ApiResponse.ok({ similar_events: [] })
  }
}
