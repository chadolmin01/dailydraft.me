import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { notifyTeamKicked } from '@/src/lib/notifications/create-notification'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// PATCH: Update team member (role, notes, status)
export const PATCH = withErrorCapture(async (
  request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) => {
  const { id, memberId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('creator_id')
    .eq('id', id)
    .single()

  if (!opportunity || opportunity.creator_id !== user.id) {
    return ApiResponse.forbidden()
  }

  const body = await request.json()
  const { assigned_role, notes, status } = body

  const updateData: Record<string, unknown> = {}
  if (assigned_role !== undefined) updateData.assigned_role = assigned_role
  if (notes !== undefined) updateData.notes = notes
  if (status !== undefined) updateData.status = status

  if (Object.keys(updateData).length === 0) {
    return ApiResponse.badRequest('No fields to update')
  }

  const { data, error } = await supabase
    .from('accepted_connections')
    .update(updateData)
    .eq('id', memberId)
    .eq('opportunity_id', id)
    .select()
    .single()

  if (error) {
    return ApiResponse.internalError()
  }

  return ApiResponse.ok(data)
})

// DELETE: Remove team member (set status to 'left')
export const DELETE = withErrorCapture(async (
  _request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) => {
  const { id, memberId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('creator_id, title')
    .eq('id', id)
    .single()

  if (!opportunity || opportunity.creator_id !== user.id) {
    return ApiResponse.forbidden()
  }

  const { data: connection } = await supabase
    .from('accepted_connections')
    .select('applicant_id')
    .eq('id', memberId)
    .eq('opportunity_id', id)
    .single()

  if (connection?.applicant_id === user.id) {
    return ApiResponse.badRequest('자기 자신을 추방할 수 없습니다')
  }

  const { error } = await supabase
    .from('accepted_connections')
    .update({ status: 'left' })
    .eq('id', memberId)
    .eq('opportunity_id', id)

  if (error) {
    return ApiResponse.internalError()
  }

  if (connection) {
    await notifyTeamKicked(
      connection.applicant_id,
      opportunity.title || '프로젝트',
      id
    )
  }

  return ApiResponse.ok({ success: true })
})
