import { createClient } from '@/src/lib/supabase/server'
import { NextRequest } from 'next/server'
import { ApiResponse } from '@/src/lib/api-utils'

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
      return ApiResponse.unauthorized()
    }

    // Verify user is the opportunity creator
    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('id, creator_id, title, status')
      .eq('id', id)
      .single()

    if (!opportunity) {
      return ApiResponse.notFound('Opportunity not found')
    }

    if (opportunity.creator_id !== user.id) {
      return ApiResponse.forbidden()
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
      return ApiResponse.ok({
        opportunity: {
          id: opportunity.id,
          title: opportunity.title,
          status: opportunity.status,
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

    return ApiResponse.ok({
      opportunity: {
        id: opportunity.id,
        title: opportunity.title,
        status: opportunity.status,
      },
      members,
      stats,
    })
  } catch (_error) {
    return ApiResponse.internalError()
  }
}
