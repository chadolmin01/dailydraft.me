import { createClient } from '@/src/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Opportunity 조회수 증가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 현재 조회수 가져오기
    const { data: currentOpp, error: fetchError } = await supabase
      .from('opportunities')
      .select('views_count')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      )
    }

    const oppData = currentOpp as { views_count: number | null }

    // 조회수 증가
    const { error: updateError } = await supabase
      .from('opportunities')
      .update({ views_count: (oppData.views_count || 0) + 1 } as never)
      .eq('id', id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update view count' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      views_count: (oppData.views_count || 0) + 1,
    })
  } catch (_error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
