import { createClient } from '@/src/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // Verify user is the opportunity creator
    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (!opportunity || opportunity.creator_id !== user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
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
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('team_checklists')
      .update(updateData)
      .eq('id', checklistId)
      .eq('opportunity_id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (_error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
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
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // Verify user is the opportunity creator
    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (!opportunity || opportunity.creator_id !== user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
    }

    const { error } = await supabase
      .from('team_checklists')
      .delete()
      .eq('id', checklistId)
      .eq('opportunity_id', id)

    if (error) {
      return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (_error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
