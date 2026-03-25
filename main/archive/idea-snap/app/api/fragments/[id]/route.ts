import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// PATCH /api/fragments/[id] - Update fragment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { content, status } = body

    // Validate status if provided
    if (status !== undefined && status !== 'active' && status !== 'archived') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Build update object with explicit type
    const updates = {
      updated_at: new Date().toISOString(),
      ...(content !== undefined && { content }),
      ...(status !== undefined && { status }),
    }

    // Update fragment (RLS will ensure user owns it)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('fragments')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Fragment not found' }, { status: 404 })
      }
      console.error('Error updating fragment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ fragment: data })
  } catch (error) {
    console.error('Error in PATCH /api/fragments/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/fragments/[id] - Delete fragment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // First get the fragment to check for photo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: fragment, error: fetchError } = await (supabase as any)
      .from('fragments')
      .select('photo_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Fragment not found' }, { status: 404 })
      }
      console.error('Error fetching fragment:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Delete photo from storage if exists
    if (fragment?.photo_url) {
      // Extract path from URL
      const urlParts = fragment.photo_url.split('/fragments/')
      if (urlParts[1]) {
        const path = urlParts[1]
        await supabase.storage.from('fragments').remove([path])
      }
    }

    // Delete fragment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('fragments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting fragment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/fragments/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
