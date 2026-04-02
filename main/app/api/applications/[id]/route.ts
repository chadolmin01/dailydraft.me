import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import {
  notifyApplicationAccepted,
  notifyApplicationRejected,
  notifyNewConnection,
  notifyInterviewScheduled,
} from '@/src/lib/notifications/create-notification'

// PATCH: Accept, reject, or schedule interview for application
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const body = await request.json()
    const { status } = body

    if (!status || !['interviewing', 'accepted', 'rejected'].includes(status)) {
      return ApiResponse.badRequest('올바르지 않은 상태값입니다')
    }

    // Get application with opportunity and applicant info
    const { data: applicationData } = await supabase
      .from('applications')
      .select(`
        *,
        opportunities (
          id,
          creator_id,
          title
        ),
        profiles!applications_applicant_id_fkey (
          nickname
        )
      `)
      .eq('id', id)
      .single()

    const application = applicationData as {
      id: string
      applicant_id: string
      opportunity_id: string
      opportunities: {
        id: string
        creator_id: string
        title: string
      } | null
      profiles: {
        nickname: string
      } | null
    } | null

    if (!application) {
      return ApiResponse.notFound('지원서를 찾을 수 없습니다')
    }

    // Check if user is the opportunity creator
    if (application.opportunities?.creator_id !== user.id) {
      return ApiResponse.forbidden()
    }

    // Update application status
    const { error: updateError } = await supabase.from('applications')
      .update({ status })
      .eq('id', id)

    if (updateError) {
      console.error('Application update error:', updateError.message)
      return ApiResponse.internalError()
    }

    const opportunityTitle = application.opportunities?.title || '프로젝트'
    const opportunityId = application.opportunities?.id || ''
    const supabaseAdmin = createAdminClient()

    // If interviewing, create coffee chat and notify
    if (status === 'interviewing') {
      // Fetch applicant email & profile
      const { data: applicantAuth } = await supabaseAdmin.auth.admin.getUserById(application.applicant_id)
      const { data: applicantProfile } = await supabaseAdmin
        .from('profiles')
        .select('nickname, contact_email')
        .eq('user_id', application.applicant_id)
        .single()

      const applicantEmail = (applicantProfile as any)?.contact_email || applicantAuth?.user?.email || ''
      const applicantName = (applicantProfile as any)?.nickname || '지원자'

      // Fetch creator profile for name
      const { data: creatorProfile } = await supabaseAdmin
        .from('profiles')
        .select('nickname')
        .eq('user_id', user.id)
        .single()
      const creatorName = (creatorProfile as any)?.nickname || '프로젝트 리더'

      // Create coffee chat linked to this application
      const { data: coffeeChat, error: chatError } = await supabaseAdmin
        .from('coffee_chats')
        .insert({
          opportunity_id: application.opportunity_id,
          application_id: application.id,
          requester_user_id: application.applicant_id,
          requester_email: applicantEmail,
          requester_name: applicantName,
          owner_user_id: user.id,
          status: 'pending',
          message: body.message || '지원서를 통해 약속이 잡혔습니다',
        } as never)
        .select('id')
        .single()

      if (chatError) {
        console.error('Coffee chat creation error:', chatError.message)
      }

      // Notify applicant
      await notifyInterviewScheduled(
        application.applicant_id,
        creatorName,
        opportunityTitle,
        opportunityId
      )

      return ApiResponse.ok({
        success: true,
        status,
        coffee_chat_id: coffeeChat?.id || null,
      })
    }

    // If accepted, create connection and send notifications
    if (status === 'accepted') {
      const { error: connectionError } = await supabase.from('accepted_connections')
        .insert({
          application_id: id,
          opportunity_creator_id: user.id,
          applicant_id: application.applicant_id,
          opportunity_id: application.opportunity_id,
        })

      if (connectionError) {
        // Don't fail the whole request if connection creation fails
      }

      // Update linked coffee chat outcome if exists
      await supabaseAdmin
        .from('coffee_chats')
        .update({ outcome: 'team_formed' } as never)
        .eq('application_id', id)

      // Notify applicant that their application was accepted
      await notifyApplicationAccepted(
        application.applicant_id,
        opportunityTitle,
        opportunityId
      )

      // Notify both parties about the new connection
      await notifyNewConnection(
        application.applicant_id,
        '팀 리더',
        opportunityTitle
      )
    }

    // If rejected, notify the applicant
    if (status === 'rejected') {
      // Update linked coffee chat status if exists
      await supabaseAdmin
        .from('coffee_chats')
        .update({ status: 'declined' } as never)
        .eq('application_id', id)

      await notifyApplicationRejected(
        application.applicant_id,
        opportunityTitle,
        opportunityId
      )
    }

    return ApiResponse.ok({ success: true, status })
  } catch (error) {
    console.error('Application error:', error)
    return ApiResponse.internalError()
  }
}
