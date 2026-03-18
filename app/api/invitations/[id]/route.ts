import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { notifyInvitationResponse } from '@/src/lib/notifications/create-notification'
import { ApiResponse } from '@/src/lib/api-utils'

// PATCH: Accept or decline invitation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return ApiResponse.unauthorized()
    }

    const body = await request.json()
    const { status } = body

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

    // Update status
    const { error: updateError } = await supabase.from('project_invitations')
      .update({ status })
      .eq('id', id)

    if (updateError) {
      console.error('Invitation update error:', updateError.message)
      return ApiResponse.internalError()
    }

    // If accepted, create connection
    if (status === 'accepted') {
      const { error: _connError } = await supabase.from('accepted_connections')
        .insert({
          application_id: id,
          opportunity_creator_id: invitation.inviter_user_id,
          applicant_id: user.id,
        })
      // connection creation is non-critical, ignore errors
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

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('Invitation response error:', error)
    return ApiResponse.internalError()
  }
}
