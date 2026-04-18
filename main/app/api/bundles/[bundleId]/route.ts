import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { approveBundle, rejectBundle } from '@/src/lib/personas/bundles'

/**
 * GET /api/bundles/:bundleId
 *
 * 번들 + 하위 persona_outputs 전체.
 * RLS가 조회 권한(bundles_select / persona_outputs_select) 게이트.
 */
export const GET = withErrorCapture(async (_request, context) => {
  const { bundleId } = (await context.params) as { bundleId: string }
  const supabase = await createClient()

  const { data: bundle, error: bErr } = await supabase
    .from('persona_output_bundles')
    .select('*')
    .eq('id', bundleId)
    .maybeSingle()

  if (bErr) return ApiResponse.internalError('번들 조회 실패', bErr)
  if (!bundle) return ApiResponse.notFound('번들을 찾을 수 없습니다')

  const { data: outputs } = await supabase
    .from('persona_outputs')
    .select('*')
    .eq('bundle_id', bundleId)
    .order('created_at', { ascending: true })

  return ApiResponse.ok({ bundle, outputs: outputs ?? [] })
})

/**
 * PATCH /api/bundles/:bundleId
 * body: { action: 'approve' | 'reject', reason?: string }
 *
 * 승인 또는 거절. 거절 사유는 페르소나 taboos에 누적 (R2 학습 루프).
 */
export const PATCH = withErrorCapture(async (request, context) => {
  const { bundleId } = (await context.params) as { bundleId: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json().catch(() => ({}))
  const action = body.action as string

  try {
    if (action === 'approve') {
      const bundle = await approveBundle(supabase, bundleId, user.id)
      return ApiResponse.ok({ bundle })
    }
    if (action === 'reject') {
      const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
      if (!reason) return ApiResponse.badRequest('거절 사유를 입력해주세요')
      const bundle = await rejectBundle(supabase, bundleId, user.id, reason)
      return ApiResponse.ok({ bundle })
    }
    return ApiResponse.badRequest(`유효하지 않은 action: ${action}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('찾을 수 없')) return ApiResponse.notFound(msg)
    return ApiResponse.internalError(msg)
  }
})
