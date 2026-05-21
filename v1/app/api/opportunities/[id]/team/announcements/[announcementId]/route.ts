import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// PATCH: Update an announcement
export const PATCH = withErrorCapture(async (
  request,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) => {
  const { id, announcementId } = await params
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
  const { title, content, is_pinned } = body

  const updateData: Record<string, unknown> = {}
  if (title !== undefined) updateData.title = title
  if (content !== undefined) updateData.content = content
  if (is_pinned !== undefined) updateData.is_pinned = is_pinned

  if (Object.keys(updateData).length === 0) {
    return ApiResponse.badRequest('No fields to update')
  }

  const { data, error } = await supabase
    .from('team_announcements')
    .update(updateData)
    .eq('id', announcementId)
    .eq('opportunity_id', id)
    .select()
    .single()

  if (error) {
    return ApiResponse.internalError()
  }

  return ApiResponse.ok(data)
})

// DELETE: Delete an announcement
export const DELETE = withErrorCapture(async (
  _request,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) => {
  const { id, announcementId } = await params
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

  const { error } = await supabase
    .from('team_announcements')
    .delete()
    .eq('id', announcementId)
    .eq('opportunity_id', id)

  if (error) {
    return ApiResponse.internalError()
  }

  return ApiResponse.ok({ success: true })
})
