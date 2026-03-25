import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/fragments - List fragments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') || 'active'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error, count } = await (supabase as any)
      .from('fragments')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', status)
      .order('captured_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching fragments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      fragments: data,
      total: count,
      hasMore: (count || 0) > offset + limit,
    })
  } catch (error) {
    console.error('Error in GET /api/fragments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/fragments - Create fragment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, content, photoData, location } = body

    if (!type || (type !== 'photo' && type !== 'memo')) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    if (type === 'memo' && !content?.trim()) {
      return NextResponse.json({ error: 'Content is required for memo' }, { status: 400 })
    }

    let photo_url: string | null = null
    let thumbnail_url: string | null = null

    // Handle photo upload
    if (type === 'photo' && photoData) {
      const base64Data = photoData.split(',')[1]
      if (!base64Data) {
        return NextResponse.json({ error: 'Invalid photo data' }, { status: 400 })
      }

      const buffer = Buffer.from(base64Data, 'base64')
      const filename = `${user.id}/${Date.now()}.jpg`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fragments')
        .upload(filename, buffer, {
          contentType: 'image/jpeg',
          upsert: false,
        })

      if (uploadError) {
        console.error('Error uploading photo:', uploadError)
        return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 })
      }

      const { data: { publicUrl } } = supabase.storage
        .from('fragments')
        .getPublicUrl(uploadData.path)

      photo_url = publicUrl
      thumbnail_url = publicUrl // For MVP, use same URL
    }

    // Create fragment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('fragments')
      .insert({
        user_id: user.id,
        type,
        content: content || null,
        photo_url,
        thumbnail_url,
        location: location || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating fragment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ fragment: data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/fragments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
