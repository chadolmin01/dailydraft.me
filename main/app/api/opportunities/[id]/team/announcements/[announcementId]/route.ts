import { createClient } from '@/src/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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
    const { title, content, is_pinned } = body

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('team_announcements')
      .update(updateData)
      .eq('id', announcementId)
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
      .from('team_announcements')
      .delete()
      .eq('id', announcementId)
      .eq('opportunity_id', id)

    if (error) {
      return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (_error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
