import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse, isValidUUID, parseJsonBody } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { sendClubUpdatePostedWebhook } from '@/src/lib/webhooks/send-club-webhook'
import { notifyDraftApproved } from '@/app/api/cron/ghostwriter-generate/notify'

type RouteParams = { params: Promise<{ draftId: string }> }

/** GET: 초안 상세 조회 */
export const GET = withErrorCapture(async (_request, { params }: RouteParams) => {
  const { draftId } = await params
  if (!isValidUUID(draftId)) return ApiResponse.badRequest('유효하지 않은 ID입니다')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('weekly_update_drafts')
    .select('*')
    .eq('id', draftId)
    .eq('target_user_id', user.id)
    .single()

  if (error || !data) return ApiResponse.notFound('초안을 찾을 수 없습니다')

  return ApiResponse.ok(data)
})

/**
 * PATCH: 초안 승인/거절/수정
 *
 * action: 'approve' | 'reject' | 'edit'
 *
 * approve: 초안을 project_updates에 복사하고 status를 approved로 변경
 * reject: status를 rejected로 변경
 * edit: title/content/update_type 수정 (status는 그대로 pending)
 */
export const PATCH = withErrorCapture(async (request, { params }: RouteParams) => {
  const { draftId } = await params
  if (!isValidUUID(draftId)) return ApiResponse.badRequest('유효하지 않은 ID입니다')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await parseJsonBody<{
    action: 'approve' | 'reject' | 'edit'
    title?: string
    content?: string
    update_type?: string
    /** AI 초안 품질 평가 (1~5). 승인/거절 시 선택 제출 → 다음 주 AI에 피드백 */
    feedback_score?: number
    /** AI 초안에 대한 구체적 피드백. "작업 추출이 부정확함" 등 */
    feedback_note?: string
  }>(request)
  if (body instanceof Response) return body

  const admin = createAdminClient()
  const { data: draft, error: fetchError } = await admin
    .from('weekly_update_drafts')
    .select('*')
    .eq('id', draftId)
    .eq('target_user_id', user.id)
    .single()

  if (fetchError || !draft) return ApiResponse.notFound('초안을 찾을 수 없습니다')

  if (draft.status !== 'pending') {
    return ApiResponse.badRequest('이미 처리된 초안입니다')
  }

  // ── edit: 내용 수정 ──
  if (body.action === 'edit') {
    const updates: Record<string, unknown> = {}
    if (body.title) updates.title = body.title.trim()
    if (body.content) updates.content = body.content.trim()
    if (body.update_type) updates.update_type = body.update_type

    const { data: updated, error: updateError } = await admin
      .from('weekly_update_drafts')
      .update(updates)
      .eq('id', draftId)
      .select('*')
      .single()

    if (updateError) return ApiResponse.internalError('수정에 실패했습니다')
    return ApiResponse.ok(updated)
  }

  // ── reject: 거절 ──
  if (body.action === 'reject') {
    const rejectUpdate: Record<string, unknown> = {
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
    }
    // 피드백이 있으면 함께 저장 → 다음 주 AI 생성 시 프롬프트에 반영됨
    if (body.feedback_score) rejectUpdate.feedback_score = Math.min(5, Math.max(1, body.feedback_score))
    if (body.feedback_note) rejectUpdate.feedback_note = body.feedback_note.trim().slice(0, 500)

    await admin
      .from('weekly_update_drafts')
      .update(rejectUpdate)
      .eq('id', draftId)

    return ApiResponse.ok({ rejected: true })
  }

  // ── approve: 승인 → project_updates에 발행 ──
  const finalTitle = body.title?.trim() || draft.title
  const finalContent = body.content?.trim() || draft.content
  const finalType = body.update_type || draft.update_type

  // project_updates에 삽입
  const { data: published, error: publishError } = await admin
    .from('project_updates')
    .insert({
      opportunity_id: draft.opportunity_id,
      author_id: user.id,
      week_number: draft.week_number,
      title: finalTitle,
      content: finalContent,
      update_type: finalType,
    })
    .select('id')
    .single()

  if (publishError) {
    return ApiResponse.internalError('업데이트 발행에 실패했습니다')
  }

  // 초안 상태 업데이트 + 피드백 저장
  const approveUpdate: Record<string, unknown> = {
    status: 'approved',
    reviewed_at: new Date().toISOString(),
    published_update_id: published?.id,
    title: finalTitle,
    content: finalContent,
    update_type: finalType,
  }
  if (body.feedback_score) approveUpdate.feedback_score = Math.min(5, Math.max(1, body.feedback_score))
  if (body.feedback_note) approveUpdate.feedback_note = body.feedback_note.trim().slice(0, 500)

  await admin
    .from('weekly_update_drafts')
    .update(approveUpdate)
    .eq('id', draftId)

  // 프로필에서 닉네임 조회
  const { data: profile } = await admin
    .from('profiles')
    .select('nickname')
    .eq('user_id', user.id)
    .single()

  const { data: opportunity } = await admin
    .from('opportunities')
    .select('title')
    .eq('id', draft.opportunity_id)
    .single()

  const authorName = profile?.nickname ?? '팀원'
  const projectTitle = opportunity?.title ?? '프로젝트'

  // Discord 웹훅 알림 (fire-and-forget)
  sendClubUpdatePostedWebhook({
    opportunityId: draft.opportunity_id,
    authorName,
    projectTitle,
    updateTitle: finalTitle,
    updateType: finalType,
    weekNumber: draft.week_number,
  }).catch(() => {})

  // 팀 채널에 승인 알림 + 스레드 (fire-and-forget)
  notifyDraftApproved({
    opportunityId: draft.opportunity_id,
    projectTitle,
    title: finalTitle,
    content: finalContent,
    updateType: finalType,
    weekNumber: draft.week_number,
    authorName,
  }).catch(() => {})

  return ApiResponse.ok({
    approved: true,
    published_update_id: published?.id,
  })
})
