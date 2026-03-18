import { createClient } from '@/src/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/src/lib/api-utils'

// PATCH: Update an announcement
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  try {
    const { id, announcementId } = await params
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

    return NextResponse.json(data)
  } catch (_error) {
    return ApiResponse.internalError()
  }
}

// DELETE: Delete an announcement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  try {
    const { id, announcementId } = await params
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
      .from('team_announcements')
      .delete()
      .eq('id', announcementId)
      .eq('opportunity_id', id)

    if (error) {
      return ApiResponse.internalError()
    }

    return NextResponse.json({ success: true })
  } catch (_error) {
    return ApiResponse.internalError()
  }
}
