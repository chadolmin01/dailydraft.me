import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { createBundle } from '@/src/lib/personas/bundles'
import { EVENT_TYPES, type EventType } from '@/src/lib/personas/types'

/**
 * GET /api/personas/:id/bundles?status=pending_approval&limit=20
 *
 * 페르소나의 번들 목록. RLS(bundles_select)가 조회 권한 게이트.
 */
export const GET = withErrorCapture(async (request, context) => {
  const { id: personaId } = (await context.params) as { id: string }
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50)

  const supabase = await createClient()

  let q = supabase
    .from('persona_output_bundles' as never)
    .select('*')
    .eq('persona_id', personaId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) return ApiResponse.internalError('번들 조회 실패', error)

  return ApiResponse.ok({ bundles: data ?? [] })
})

/**
 * POST /api/personas/:id/bundles
 * body: { event_type, event_metadata, semester_ref?, week_number?, corpus_hint? }
 *
 * 번들 생성 트리거. createBundle() 호출.
 * RLS(bundles_write)가 can_edit_persona()로 쓰기 권한 게이트하므로 anon client로 충분.
 */
export const POST = withErrorCapture(async (request, context) => {
  const { id: personaId } = (await context.params) as { id: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json().catch(() => ({}))
  const eventType = body.event_type as string
  if (!EVENT_TYPES.includes(eventType as EventType)) {
    return ApiResponse.badRequest(`유효하지 않은 event_type: ${eventType}`)
  }

  try {
    const result = await createBundle(supabase, {
      personaId,
      eventType: eventType as EventType,
      eventMetadata: (body.event_metadata as Record<string, unknown>) ?? {},
      userId: user.id,
      corpusHint: typeof body.corpus_hint === 'string' ? body.corpus_hint : undefined,
      semesterRef: typeof body.semester_ref === 'string' ? body.semester_ref : undefined,
      weekNumber: typeof body.week_number === 'number' ? body.week_number : undefined,
      notifyOperator: body.notify_operator !== false,
    })
    return ApiResponse.created(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // 이벤트 비활성화 / 페르소나 없음 등은 400, 그 외 500
    if (msg.includes('아직 활성화') || msg.includes('만들어지지 않')) {
      return ApiResponse.badRequest(msg)
    }
    return ApiResponse.internalError(msg)
  }
})
