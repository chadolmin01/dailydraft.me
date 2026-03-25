import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import {
  notifyApplicationAccepted,
  notifyApplicationRejected,
  notifyNewConnection,
} from '@/src/lib/notifications/create-notification'

// PATCH: Accept or reject application
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

    if (!status || !['accepted', 'rejected'].includes(status)) {
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
