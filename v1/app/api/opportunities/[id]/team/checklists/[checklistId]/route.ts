import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// PATCH: Update a checklist item
export const PATCH = withErrorCapture(async (
  request,
  { params }: { params: Promise<{ id: string; checklistId: string }> }
) => {
  const { id, checklistId } = await params
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
  const { title, description, is_completed, sort_order } = body

  const updateData: Record<string, unknown> = {}
  if (title !== undefined) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (sort_order !== undefined) updateData.sort_order = sort_order

  if (is_completed !== undefined) {
    updateData.is_completed = is_completed
    if (is_completed) {
      updateData.completed_at = new Date().toISOString()
      updateData.completed_by = user.id
    } else {
      updateData.completed_at = null
      updateData.completed_by = null
    }
  }

  if (Object.keys(updateData).length === 0) {
    return ApiResponse.badRequest('No fields to update')
  }

  const { data, error } = await supabase
    .from('team_checklists')
    .update(updateData)
    .eq('id', checklistId)
    .eq('opportunity_id', id)
    .select()
    .single()

  if (error) {
    return ApiResponse.internalError()
  }

  return ApiResponse.ok(data)
})

// DELETE: Delete a checklist item
export const DELETE = withErrorCapture(async (
  _request,
  { params }: { params: Promise<{ id: string; checklistId: string }> }
) => {
  const { id, checklistId } = await params
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
    .from('team_checklists')
    .delete()
    .eq('id', checklistId)
    .eq('opportunity_id', id)

  if (error) {
    return ApiResponse.internalError()
  }

  return ApiResponse.ok({ success: true })
})
