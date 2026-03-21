import { createClient } from '@/src/lib/supabase/server'
import { NextRequest } from 'next/server'
import { ApiResponse } from '@/src/lib/api-utils'

// PATCH: Update a checklist item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string }> }
) {
  try {
    const { id, checklistId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    // Verify user is the opportunity creator
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
  } catch (_error) {
    return ApiResponse.internalError()
  }
}

// DELETE: Delete a checklist item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string }> }
) {
  try {
    const { id, checklistId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    // Verify user is the opportunity creator
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
  } catch (_error) {
    return ApiResponse.internalError()
  }
}
