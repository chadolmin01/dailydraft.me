import { createClient } from '@/src/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Get all checklists for an opportunity
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

    // Verify user is the opportunity creator or team member
    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    // Verify user is the creator or a team member
    const isCreator = opportunity.creator_id === user.id
    if (!isCreator) {
      const { data: membership } = await supabase.from('accepted_connections')
        .select('id')
        .eq('opportunity_id', id)
        .eq('applicant_id', user.id)
        .limit(1)
        .single()
      if (!membership) {
        return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
      }
    }

    const { data: checklists, error } = await supabase
      .from('team_checklists')
      .select('*')
      .eq('opportunity_id', id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
    }

    const completed = (checklists || []).filter((c: any) => c.is_completed).length
    const total = (checklists || []).length

    return NextResponse.json({
      checklists: checklists || [],
      progress: {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
    })
  } catch (_error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// POST: Create a new checklist item
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

    if (!opportunity || opportunity.creator_id !== user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Get max sort order
    const { data: maxOrder } = await supabase
      .from('team_checklists')
      .select('sort_order')
      .eq('opportunity_id', id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const sortOrder = maxOrder ? maxOrder.sort_order + 1 : 0

    const { data, error } = await supabase
      .from('team_checklists')
      .insert({
        opportunity_id: id,
        title,
        description: description || null,
        sort_order: sortOrder,
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
