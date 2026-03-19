import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

// GET: 내 북마크 목록
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return ApiResponse.unauthorized()
    }

    const { data: bookmarks, error } = await supabase
      .from('event_bookmarks')
      .select(`
        *,
        startup_events (
          id, title, organizer, event_type,
          registration_end_date, registration_url, interest_tags
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return ApiResponse.internalError()
    }

    return NextResponse.json(bookmarks)
  } catch (_err) {
    return ApiResponse.internalError()
  }
}

// POST: 북마크 추가
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return ApiResponse.unauthorized()
    }

    const body = await request.json()
    const { event_id, notify_before_days = 3 } = body

    if (!event_id) {
      return ApiResponse.badRequest('event_id is required')
    }

    // 이벤트 존재 확인
    const { data: event } = await supabase
      .from('startup_events')
      .select('id')
      .eq('id', event_id)
      .single()

    if (!event) {
      return ApiResponse.notFound('Event not found')
    }

    // 북마크 추가 (upsert)
    const { data: bookmark, error } = await supabase.from('event_bookmarks')
      .upsert({
        user_id: user.id,
        event_id,
        notify_before_days,
      }, {
        onConflict: 'user_id,event_id',
      })
      .select()
      .single()

    if (error) {
      return ApiResponse.internalError()
    }

    return NextResponse.json(bookmark, { status: 201 })
  } catch (_err) {
    return ApiResponse.internalError()
  }
}
