import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import {
  approveBundle,
  archiveBundle,
  rejectBundle,
} from '@/src/lib/personas/bundles'

/**
 * GET /api/bundles/:bundleId
 *
 * 번들 + 하위 persona_outputs 전체.
 * RLS가 조회 권한(bundles_select / persona_outputs_select) 게이트.
 */
export const GET = withErrorCapture(async (_request, context) => {
  const { bundleId } = (await context.params) as { bundleId: string }
  const supabase = await createClient()

  // bundle + outputs 병렬 — outputs 는 bundleId 만 필요해 bundle 존재 여부 확인 기다릴 이유 없음
  const [bundleResult, outputsResult] = await Promise.all([
    supabase.from('persona_output_bundles').select('*').eq('id', bundleId).maybeSingle(),
    supabase
      .from('persona_outputs')
      .select('*')
      .eq('bundle_id', bundleId)
      .order('created_at', { ascending: true }),
  ])

  if (bundleResult.error) return ApiResponse.internalError('번들 조회 실패', bundleResult.error)
  if (!bundleResult.data) return ApiResponse.notFound('번들을 찾을 수 없습니다')

  return ApiResponse.ok({ bundle: bundleResult.data, outputs: outputsResult.data ?? [] })
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

/**
 * DELETE /api/bundles/:bundleId
 *
 * 덱 소프트 삭제(status='archived'). 발행된 덱은 외부 플랫폼 글까지 철회하진 않음.
 * 권한: 이 번들의 페르소나를 편집할 수 있는 사용자만 (can_edit_persona RPC).
 *
 * SSR auth.uid()가 RLS에 안 잡히는 이슈 때문에 admin 클라이언트 + RPC 선검증 패턴 사용.
 */
export const DELETE = withErrorCapture(async (_request, context) => {
  const { bundleId } = (await context.params) as { bundleId: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()

  // 1) 번들 → persona_id
  const { data: bundle, error: bErr } = await admin
    .from('persona_output_bundles')
    .select('persona_id')
    .eq('id', bundleId)
    .maybeSingle()
  if (bErr) return ApiResponse.internalError('번들 조회 실패', bErr)
  if (!bundle) return ApiResponse.notFound('번들을 찾을 수 없습니다')

  // 2) 편집 권한 확인
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: canEdit } = await (admin as any).rpc('can_edit_persona', {
    p_persona_id: (bundle as { persona_id: string }).persona_id,
    p_user_id: user.id,
  })
  if (!canEdit) return ApiResponse.forbidden('권한이 없습니다')

  // 3) archived 처리
  try {
    await archiveBundle(admin, bundleId)
    return ApiResponse.noContent()
  } catch (err) {
    return ApiResponse.internalError(err instanceof Error ? err.message : String(err))
  }
})
