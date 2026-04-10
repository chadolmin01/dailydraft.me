import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse, isValidUUID, parseJsonBody } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { sendClubUpdatePostedWebhook } from '@/src/lib/webhooks/send-club-webhook'

type RouteParams = { params: Promise<{ draftId: string }> }

/** GET: 초안 상세 조회 */
export const GET = withErrorCapture(async (_request, { params }: RouteParams) => {
  const { draftId } = await params
  if (!isValidUUID(draftId)) return ApiResponse.badRequest('유효하지 않은 ID입니다')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  // weekly_update_drafts는 아직 타입 미생성 → admin client + 수동 권한 체크
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('weekly_update_drafts' as never)
    .select('*' as never)
    .eq('id' as never, draftId)
    .eq('target_user_id' as never, user.id)
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
  }>(request)
  if (body instanceof Response) return body

  // 초안 조회 (타입 미생성 → admin + 수동 권한 체크)
  const admin = createAdminClient()
  const { data: draft, error: fetchError } = await admin
    .from('weekly_update_drafts' as never)
    .select('*' as never)
    .eq('id' as never, draftId)
    .eq('target_user_id' as never, user.id)
    .single()

  if (fetchError || !draft) return ApiResponse.notFound('초안을 찾을 수 없습니다')

  const draftData = draft as {
    id: string
    opportunity_id: string
    week_number: number
    title: string
    content: string
    update_type: string
    status: string
    source_message_count: number
  }

  if (draftData.status !== 'pending') {
    return ApiResponse.badRequest('이미 처리된 초안입니다')
  }

  // ── edit: 내용 수정 ──
  if (body.action === 'edit') {
    const updates: Record<string, unknown> = {}
    if (body.title) updates.title = body.title.trim()
    if (body.content) updates.content = body.content.trim()
    if (body.update_type) updates.update_type = body.update_type

    const { data: updated, error: updateError } = await admin
      .from('weekly_update_drafts' as never)
      .update(updates as never)
      .eq('id' as never, draftId)
      .select('*' as never)
      .single()

    if (updateError) return ApiResponse.internalError('수정에 실패했습니다')
    return ApiResponse.ok(updated)
  }

  // ── reject: 거절 ──
  if (body.action === 'reject') {
    await admin
      .from('weekly_update_drafts' as never)
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() } as never)
      .eq('id' as never, draftId)

    return ApiResponse.ok({ rejected: true })
  }

  // ── approve: 승인 → project_updates에 발행 ──
  const finalTitle = body.title?.trim() || draftData.title
  const finalContent = body.content?.trim() || draftData.content
  const finalType = body.update_type || draftData.update_type

  // project_updates에 삽입
  const { data: published, error: publishError } = await admin
    .from('project_updates')
    .insert({
      opportunity_id: draftData.opportunity_id,
      author_id: user.id,
      week_number: draftData.week_number,
      title: finalTitle,
      content: finalContent,
      update_type: finalType,
    })
    .select('id')
    .single()

  if (publishError) {
    return ApiResponse.internalError('업데이트 발행에 실패했습니다')
  }

  // 초안 상태 업데이트
  await admin
    .from('weekly_update_drafts' as never)
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      published_update_id: published?.id,
      title: finalTitle,
      content: finalContent,
      update_type: finalType,
    } as never)
    .eq('id' as never, draftId)

  // 프로필에서 닉네임 조회
  const { data: profile } = await admin
    .from('profiles')
    .select('nickname')
    .eq('user_id', user.id)
    .single()

  const { data: opportunity } = await admin
    .from('opportunities')
    .select('title')
    .eq('id', draftData.opportunity_id)
    .single()

  // Discord 웹훅 알림 (fire-and-forget)
  sendClubUpdatePostedWebhook({
    opportunityId: draftData.opportunity_id,
    authorName: (profile as { nickname?: string } | null)?.nickname ?? '팀원',
    projectTitle: (opportunity as { title?: string } | null)?.title ?? '프로젝트',
    updateTitle: finalTitle,
    updateType: finalType,
    weekNumber: draftData.week_number,
  }).catch(() => {})

  return ApiResponse.ok({
    approved: true,
    published_update_id: published?.id,
  })
})
