import { createClient } from '@/src/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const supabase = await createClient()

    // 조회수 증가 - RPC 사용하여 원자적 업데이트
    // RPC가 없는 경우 직접 쿼리 사용
    const { data: currentEvent, error: fetchError } = await supabase
      .from('startup_events')
      .select('views_count')
      .eq('id', eventId)
      .single()

    if (fetchError || !currentEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const currentCount = (currentEvent as { views_count: number | null }).views_count || 0
    const newCount = currentCount + 1

    // 업데이트 시도 (RLS 정책에 따라 성공/실패)
    const { error: updateError } = await supabase
      .from('startup_events')
      .update({ views_count: newCount } as never) // Type bypass for strict typing
      .eq('id', eventId)

    if (updateError) {
      // 업데이트 실패해도 현재 값 반환
      return NextResponse.json({ success: false, views_count: currentCount })
    }

    return NextResponse.json({ success: true, views_count: newCount })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
