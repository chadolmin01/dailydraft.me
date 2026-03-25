import { createClient } from '@/src/lib/supabase/server'
import { NextRequest } from 'next/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { notifyNewConnection } from '@/src/lib/notifications/create-notification'

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

    // Get opportunity
    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('id, creator_id, title, status')
      .eq('id', id)
      .single()

    if (!opportunity) {
      return ApiResponse.notFound('Opportunity not found')
    }

    // Step 4: Allow creator OR active team member to view
    const isCreator = opportunity.creator_id === user.id
    if (!isCreator) {
      const { data: membership } = await supabase
        .from('accepted_connections')
        .select('id')
        .eq('opportunity_id', id)
        .eq('applicant_id', user.id)
        .eq('status', 'active')
        .maybeSingle()
      if (!membership) return ApiResponse.forbidden()
    }

    // Step 3: Query by opportunity_id directly (includes coffee chat members)
    const { data: connections } = await supabase
      .from('accepted_connections')
      .select(`
        id,
        applicant_id,
        assigned_role,
        notes,
        status,
        connected_at,
        applications (
          id,
          match_score,
          match_reason
        )
      `)
      .eq('opportunity_id', id)

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

// Step 6a: POST — creator manually adds a team member + sends notification
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
      return ApiResponse.unauthorized()
    }

    // Verify creator
    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('id, creator_id, title')
      .eq('id', id)
      .single()

    if (!opportunity) {
      return ApiResponse.notFound('Opportunity not found')
    }

    if (opportunity.creator_id !== user.id) {
      return ApiResponse.forbidden()
    }

    const body = await request.json()
    const { applicant_id, coffee_chat_id } = body as {
      applicant_id: string
      coffee_chat_id?: string
    }

    if (!applicant_id) {
      return ApiResponse.badRequest('applicant_id is required')
    }

    // Insert accepted_connection
    const insertData: Record<string, unknown> = {
      opportunity_creator_id: user.id,
      applicant_id,
      opportunity_id: id,
      status: 'active',
    }
    if (coffee_chat_id) {
      insertData.coffee_chat_id = coffee_chat_id
    }

    const { error } = await supabase
      .from('accepted_connections')
      .insert(insertData as any)

    if (error) {
      console.error('Team add error:', error.message)
      return ApiResponse.internalError()
    }

    // Get creator nickname for notification
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('user_id', user.id)
      .single()

    const creatorName = (creatorProfile as any)?.nickname || '팀 리더'

    // Notify the new team member
    await notifyNewConnection(
      applicant_id,
      creatorName,
      opportunity.title || '프로젝트'
    )

    return ApiResponse.ok({ success: true })
  } catch (_error) {
    return ApiResponse.internalError()
  }
}
