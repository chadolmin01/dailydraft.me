import { createClient } from '@/src/lib/supabase/server'
import { NextRequest } from 'next/server'
import { ApiResponse } from '@/src/lib/api-utils'

// PATCH: Update team member (role, notes, status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params
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
  } catch (_error) {
    return ApiResponse.internalError()
  }
}

// DELETE: Remove team member (set status to 'left')
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params
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

    // Set status to 'left' instead of deleting
    const { error } = await supabase
      .from('accepted_connections')
      .update({ status: 'left' })
      .eq('id', memberId)
      .eq('opportunity_id', id)

    if (error) {
      return ApiResponse.internalError()
    }

    return ApiResponse.ok({ success: true })
  } catch (_error) {
    return ApiResponse.internalError()
  }
}
