import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/**
 * GET /api/personas/:id/calendar-outputs?start=ISO&end=ISO
 *
 * 콘텐츠 캘린더용 — 주어진 기간에 걸친 persona_outputs 반환.
 * - scheduled_at 있는 것(예약·발행 대기)
 * - published_at 있는 것(이미 발행됨)
 * - 둘 다 없으면 created_at 기준 최근 draft만
 *
 * 반환 각 row는 단일 "대표 날짜" cal_date + 표시용 상태 cal_status.
 *
 * 권한: can_view_persona RPC.
 */
export const GET = withErrorCapture(async (request, context) => {
  const { id: personaId } = (await context.params) as { id: string }
  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) return ApiResponse.badRequest('start, end 쿼리 필수')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: canView } = await (admin as any).rpc('can_view_persona', {
    p_persona_id: personaId,
    p_user_id: user.id,
  })
  if (!canView) return ApiResponse.forbidden('권한이 없습니다')

  // scheduled_at OR published_at 이 범위 내인 output 조회.
  // Supabase는 or() 복합 필터가 약하므로 두 쿼리 병렬로 돌려 union.
  const [schedRes, pubRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from('persona_outputs') as any)
      .select(
        'id, bundle_id, channel_format, scheduled_at, published_at, status, is_copy_only, destination, generated_content, created_at',
      )
      .eq('persona_id', personaId)
      .gte('scheduled_at', start)
      .lte('scheduled_at', end)
      .limit(300),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from('persona_outputs') as any)
      .select(
        'id, bundle_id, channel_format, scheduled_at, published_at, status, is_copy_only, destination, generated_content, created_at',
      )
      .eq('persona_id', personaId)
      .gte('published_at', start)
      .lte('published_at', end)
      .limit(300),
  ])

  if (schedRes.error) return ApiResponse.internalError('예약 조회 실패', schedRes.error)
  if (pubRes.error) return ApiResponse.internalError('발행 조회 실패', pubRes.error)

  type Row = {
    id: string
    bundle_id: string | null
    channel_format: string
    scheduled_at: string | null
    published_at: string | null
    status: string
    is_copy_only: boolean
    destination: string | null
    generated_content: string
    created_at: string
  }

  // dedupe by id
  const byId = new Map<string, Row>()
  for (const r of (schedRes.data ?? []) as Row[]) byId.set(r.id, r)
  for (const r of (pubRes.data ?? []) as Row[]) byId.set(r.id, r)

  const rows = Array.from(byId.values())

  // 번들 메타 일괄 로드
  const bundleIds = Array.from(
    new Set(rows.map((r) => r.bundle_id).filter(Boolean)),
  ) as string[]
  let bundleMap = new Map<
    string,
    { event_type: string; event_metadata: Record<string, unknown> }
  >()
  if (bundleIds.length > 0) {
    const { data: bundles } = await admin
      .from('persona_output_bundles')
      .select('id, event_type, event_metadata')
      .in('id', bundleIds)
    bundleMap = new Map(
      ((bundles ?? []) as Array<{
        id: string
        event_type: string
        event_metadata: Record<string, unknown>
      }>).map((b) => [b.id, { event_type: b.event_type, event_metadata: b.event_metadata }]),
    )
  }

  // 대표 날짜 + mirra식 상태 카테고리 부여
  const enriched = rows.map((r) => {
    const calDate =
      r.status === 'published' && r.published_at
        ? r.published_at
        : r.scheduled_at ?? r.published_at ?? r.created_at
    const calStatus = mapCalStatus(r.status, r.scheduled_at)
    return {
      ...r,
      cal_date: calDate,
      cal_status: calStatus,
      bundle: r.bundle_id ? bundleMap.get(r.bundle_id) ?? null : null,
    }
  })

  // 시간순 정렬
  enriched.sort(
    (a, b) => new Date(a.cal_date).getTime() - new Date(b.cal_date).getTime(),
  )

  return ApiResponse.ok({ outputs: enriched })
})

/**
 * mirra 필터 체크박스 매핑: published / scheduled / draft / rejected / failed.
 * 현재 스키마엔 failed 상태가 없어 거절됨으로 흡수.
 */
function mapCalStatus(
  status: string,
  scheduledAt: string | null,
): 'published' | 'scheduled' | 'draft' | 'rejected' {
  if (status === 'published') return 'published'
  if (status === 'rejected' || status === 'archived') return 'rejected'
  if (scheduledAt) return 'scheduled'
  return 'draft'
}
