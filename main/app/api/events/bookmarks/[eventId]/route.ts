import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

// GET: 특정 이벤트의 북마크 상태 확인
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const { data: bookmark } = await supabase
      .from('event_bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .single()

    return NextResponse.json({
      bookmarked: !!bookmark,
      bookmark,
    })
  } catch (_err) {
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// PATCH: 북마크 알림 설정 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { notify_before_days } = body

    if (notify_before_days === undefined) {
      return NextResponse.json({ error: '알림 일수를 지정해주세요' }, { status: 400 })
    }

    const { data: bookmark, error } = await supabase.from('event_bookmarks')
      .update({ notify_before_days })
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: '북마크 처리에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(bookmark)
  } catch (_err) {
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// DELETE: 북마크 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const { error } = await supabase
      .from('event_bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('event_id', eventId)

    if (error) {
      return NextResponse.json({ error: '북마크 처리에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (_err) {
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다' }, { status: 500 })
  }
}
