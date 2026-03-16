import { createClient } from '@/src/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Get all announcements for an opportunity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // Verify user is the creator or a team member
    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    const isCreator = (opportunity as any).creator_id === user.id
    if (!isCreator) {
      const { data: membership } = await (supabase.from('accepted_connections') as any)
        .select('id')
        .eq('opportunity_id', id)
        .eq('applicant_id', user.id)
        .limit(1)
        .single()
      if (!membership) {
        return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: announcements, error } = await (supabase as any)
      .from('team_announcements')
      .select(`
        *,
        profiles!team_announcements_author_id_fkey (
          nickname
        )
      `)
      .eq('opportunity_id', id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
    }

    const formattedAnnouncements = (announcements || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      is_pinned: a.is_pinned,
      created_at: a.created_at,
      updated_at: a.updated_at,
      author: a.profiles?.nickname || '알 수 없음',
      author_id: a.author_id,
    }))

    return NextResponse.json(formattedAnnouncements)
  } catch (_error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// POST: Create a new announcement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    if (!opportunity || (opportunity as any).creator_id !== user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, is_pinned } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('team_announcements')
      .insert({
        opportunity_id: id,
        author_id: user.id,
        title,
        content,
        is_pinned: is_pinned || false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (_error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
