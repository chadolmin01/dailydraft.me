import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/**
 * GET /api/personas/:id/scheduled-outputs
 *
 * 예약되어 있지만 아직 발행되지 않은 persona_outputs 목록.
 * 번들 메타데이터까지 함께 반환해 UI에서 제목·이벤트를 표시.
 *
 * 권한: can_view_persona — admin 클라이언트로 조회 후 can_view RPC로 게이트.
 */
export const GET = withErrorCapture(async (_request, context) => {
  const { id: personaId } = (await context.params) as { id: string }
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from('persona_outputs') as any)
    .select(
      'id, bundle_id, channel_format, scheduled_at, status, is_copy_only, destination, generated_content, created_at',
    )
    .eq('persona_id', personaId)
    .not('scheduled_at', 'is', null)
    .in('status', ['approved', 'draft'])
    .order('scheduled_at', { ascending: true })
    .limit(100)

  if (error) return ApiResponse.internalError('예약 목록 조회 실패', error)

  const outputs = (data ?? []) as Array<{
    id: string
    bundle_id: string | null
    channel_format: string
    scheduled_at: string
    status: string
    is_copy_only: boolean
    destination: string | null
    generated_content: string
    created_at: string
  }>

  // 번들 메타데이터 한번에 로드
  const bundleIds = Array.from(
    new Set(outputs.map((o) => o.bundle_id).filter(Boolean)),
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

  const enriched = outputs.map((o) => ({
    ...o,
    bundle: o.bundle_id ? bundleMap.get(o.bundle_id) ?? null : null,
  }))

  return ApiResponse.ok({ outputs: enriched })
})
