import { createClient } from '@/src/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface TeamMember {
  id: string
  applicant_id: string
  assigned_role: string | null
  notes: string | null
  status: string
  connected_at: string
  profile: {
    nickname: string
    desired_position: string | null
    skills: Array<{ name: string; level: string }> | null
    contact_email: string | null
    contact_kakao: string | null
  } | null
  application: {
    match_score: number | null
    match_reason: string | null
  } | null
}

// GET: Get all team members for an opportunity
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

    // Verify user is the opportunity creator
    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('id, creator_id, title, status')
      .eq('id', id)
      .single()

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    if ((opportunity as { creator_id: string }).creator_id !== user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
    }

    // Get accepted team members
    const { data: connections } = await supabase
      .from('accepted_connections')
      .select(`
        id,
        applicant_id,
        assigned_role,
        notes,
        status,
        connected_at,
        applications!inner (
          id,
          opportunity_id,
          match_score,
          match_reason
        )
      `)
      .eq('applications.opportunity_id', id)

    if (!connections || connections.length === 0) {
      return NextResponse.json({
        opportunity: {
          id: (opportunity as any).id,
          title: (opportunity as any).title,
          status: (opportunity as any).status,
        },
        members: [],
        stats: {
          total: 0,
          active: 0,
          rolesAssigned: 0,
        },
      })
    }

    // Get profiles for all team members
    const applicantIds = connections.map((c: any) => c.applicant_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, nickname, desired_position, skills, contact_email, contact_kakao')
      .in('user_id', applicantIds)

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]))

    const members: TeamMember[] = connections.map((conn: any) => ({
      id: conn.id,
      applicant_id: conn.applicant_id,
      assigned_role: conn.assigned_role,
      notes: conn.notes,
      status: conn.status || 'active',
      connected_at: conn.connected_at,
      profile: profileMap.get(conn.applicant_id) || null,
      application: conn.applications
        ? {
            match_score: conn.applications.match_score,
            match_reason: conn.applications.match_reason,
          }
        : null,
    }))

    const stats = {
      total: members.length,
      active: members.filter((m) => m.status === 'active').length,
      rolesAssigned: members.filter((m) => m.assigned_role).length,
    }

    return NextResponse.json({
      opportunity: {
        id: (opportunity as any).id,
        title: (opportunity as any).title,
        status: (opportunity as any).status,
      },
      members,
      stats,
    })
  } catch (_error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
