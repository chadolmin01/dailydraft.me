import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { notifyInvitationResponse } from '@/src/lib/notifications/create-notification'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// PATCH: Accept or decline invitation
export const PATCH = withErrorCapture(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return ApiResponse.unauthorized()
  }

  const body = await request.json()
  const { status, decline_reason } = body

  if (!status || !['accepted', 'declined'].includes(status)) {
    return ApiResponse.badRequest('올바르지 않은 상태값입니다')
  }

  // Fetch invitation
  const { data: invitation } = await supabase.from('project_invitations')
    .select('*')
    .eq('id', id)
    .single()

  if (!invitation) {
    return ApiResponse.notFound('초대를 찾을 수 없습니다')
  }

  // Only invited user can respond
  if (invitation.invited_user_id !== user.id) {
    return ApiResponse.forbidden()
  }

  if (invitation.status !== 'pending') {
    return ApiResponse.badRequest('이미 처리된 초대입니다')
  }

  // Update status (declined일 때 사유 함께 저장)
  const updatePayload: { status: string; decline_reason?: string | null } = { status }
  if (status === 'declined' && typeof decline_reason === 'string' && decline_reason.trim()) {
    updatePayload.decline_reason = decline_reason.trim().slice(0, 500)
  }
  const { error: updateError } = await supabase.from('project_invitations')
    .update(updatePayload)
    .eq('id', id)

  if (updateError) {
    console.error('Invitation update error:', updateError.message)
    return ApiResponse.internalError()
  }

  // If accepted, create connection + 환영 DM 자동 생성
  // Use admin client: RLS requires auth.uid()=opportunity_creator_id,
  // but here the current user is the invited user (applicant), not the creator.
  let acceptedProjectTitle: string | null = null
  if (status === 'accepted') {
    const adminSupabase = createAdminClient()
    const { error: connError } = await adminSupabase.from('accepted_connections')
      .insert({
        opportunity_creator_id: invitation.inviter_user_id,
        applicant_id: user.id,
        opportunity_id: invitation.opportunity_id,
      })
    if (connError) {
      console.error('Connection creation error:', connError.message)
    }

    // 환영 DM 자동 송신: 수락 직후 대화 흐름이 끊기지 않도록 첫 메시지를 시드.
    // 실패해도 수락 자체는 성공으로 처리 (DM은 부가 가치).
    const { data: oppRow } = await adminSupabase
      .from('opportunities')
      .select('title')
      .eq('id', invitation.opportunity_id)
      .single()
    acceptedProjectTitle = oppRow?.title || '프로젝트'

    // 정원 차감: filled_roles 배열에 수락한 역할 append. 중복 방지 위해 기존 값 read-modify-write.
    // 동시 수락 race가 이론상 가능하나 베타 단계 (한 자리에 동시 수락 동시성 매우 낮음).
    // 락이 필요해지면 RPC로 ARRAY_APPEND + UNIQUE 처리로 이동.
    const { data: oppRoles } = await adminSupabase
      .from('opportunities')
      .select('filled_roles')
      .eq('id', invitation.opportunity_id)
      .single()
    const currentFilled = (oppRoles?.filled_roles as string[] | null) || []
    if (!currentFilled.includes(invitation.role)) {
      await adminSupabase
        .from('opportunities')
        .update({ filled_roles: [...currentFilled, invitation.role] })
        .eq('id', invitation.opportunity_id)
    }

    const welcomeBody = `${acceptedProjectTitle} 프로젝트에 합류하신 것을 환영합니다! 첫 작업이나 일정 얘기를 이어가볼까요?`
    const { error: dmError } = await adminSupabase
      .from('direct_messages')
      .insert({
        sender_id: invitation.inviter_user_id,
        receiver_id: user.id,
        content: welcomeBody,
      })
    if (dmError) {
      console.error('Welcome DM insert error:', dmError.message)
    }
  }

  // Fetch profiles for notification
  const { data: invitedProfile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('user_id', user.id)
    .single()

  // Fetch opportunity title
  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('title')
    .eq('id', invitation.opportunity_id)
    .single()

  await notifyInvitationResponse(
    invitation.inviter_user_id,
    invitedProfile?.nickname || 'User',
    opportunity?.title || '프로젝트',
    status === 'accepted'
  )

  return ApiResponse.ok({
    success: true,
    status,
    next: status === 'accepted' ? { projectId: invitation.opportunity_id } : null,
  })
})

// DELETE: 발신자가 pending 초대 취소. accepted/declined는 취소 불가.
export const DELETE = withErrorCapture(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { data: invitation } = await supabase.from('project_invitations')
    .select('id, inviter_user_id, status')
    .eq('id', id)
    .single()
  if (!invitation) return ApiResponse.notFound('초대를 찾을 수 없습니다')
  if (invitation.inviter_user_id !== user.id) return ApiResponse.forbidden()
  if (invitation.status !== 'pending') {
    return ApiResponse.badRequest('이미 처리된 초대는 취소할 수 없습니다')
  }

  const { error } = await supabase.from('project_invitations').delete().eq('id', id)
  if (error) {
    console.error('Invitation delete error:', error.message)
    return ApiResponse.internalError()
  }
  return ApiResponse.ok({ success: true })
})

// Reminder POST는 별도 path가 자연스럽지만 최소화 위해 PATCH의 status='reminder'로 처리하지 않고
// 동일 [id]에 sub-action 없이 last_reminder_at만 갱신하는 케이스는 별도 핸들러를 만드는 게 명확해서
// 여기 모듈에 추가:
export const PUT = withErrorCapture(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  // PUT = "리마인더 알림 다시 보내기" (sender만 가능)
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { data: invitation } = await supabase.from('project_invitations')
    .select('id, inviter_user_id, invited_user_id, status, role, opportunity_id, last_reminder_at')
    .eq('id', id)
    .single()
  if (!invitation) return ApiResponse.notFound('초대를 찾을 수 없습니다')
  if (invitation.inviter_user_id !== user.id) return ApiResponse.forbidden()
  if (invitation.status !== 'pending') {
    return ApiResponse.badRequest('대기 중인 초대만 리마인더를 보낼 수 있습니다')
  }

  // 24h 쿨다운 — 도배 방지
  if (invitation.last_reminder_at) {
    const ageHours = (Date.now() - new Date(invitation.last_reminder_at).getTime()) / (1000 * 60 * 60)
    if (ageHours < 24) {
      return ApiResponse.rateLimited(`리마인더는 ${Math.ceil(24 - ageHours)}시간 후에 다시 보낼 수 있어요`)
    }
  }

  const { error: updErr } = await supabase
    .from('project_invitations')
    .update({ last_reminder_at: new Date().toISOString() })
    .eq('id', id)
  if (updErr) {
    console.error('Reminder update error:', updErr.message)
    return ApiResponse.internalError()
  }

  // 알림 재전송
  const { data: opp } = await supabase
    .from('opportunities').select('title').eq('id', invitation.opportunity_id).single()
  const { data: prof } = await supabase
    .from('profiles').select('nickname').eq('user_id', user.id).single()
  const { notifyProjectInvitation } = await import('@/src/lib/notifications/create-notification')
  await notifyProjectInvitation(
    invitation.invited_user_id,
    prof?.nickname || 'User',
    opp?.title || '프로젝트',
    invitation.role,
  )

  return ApiResponse.ok({ success: true })
})
