import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

// GET: 내 북마크 목록
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
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
      return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
    }

    return NextResponse.json(bookmarks)
  } catch (_err) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// POST: 북마크 추가
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { event_id, notify_before_days = 3 } = body

    if (!event_id) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 })
    }

    // 이벤트 존재 확인
    const { data: event } = await supabase
      .from('startup_events')
      .select('id')
      .eq('id', event_id)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // 북마크 추가 (upsert)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bookmark, error } = await (supabase.from('event_bookmarks') as any)
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
      return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
    }

    return NextResponse.json(bookmark, { status: 201 })
  } catch (_err) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
