import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { notifyProjectInvitation } from '@/src/lib/notifications/create-notification'
import { ApiResponse } from '@/src/lib/api-utils'

// POST: Create a new project invitation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const body = await request.json()
    const { opportunity_id, invited_user_id, role, message } = body

    if (!opportunity_id || !invited_user_id || !role) {
      return ApiResponse.badRequest('필수 항목이 누락되었습니다')
    }

    // Self-invite check
    if (invited_user_id === user.id) {
      return ApiResponse.badRequest('자기 자신을 초대할 수 없습니다')
    }

    // Verify user is the opportunity creator
    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('id, creator_id, title')
      .eq('id', opportunity_id)
      .single()

    if (!opportunity) {
      return ApiResponse.notFound('프로젝트를 찾을 수 없습니다')
    }

    if (opportunity.creator_id !== user.id) {
      return ApiResponse.forbidden('프로젝트 생성자만 초대할 수 있습니다')
    }

    // Duplicate check
    const { data: existing } = await supabase.from('project_invitations')
      .select('id, status')
      .eq('opportunity_id', opportunity_id)
      .eq('invited_user_id', invited_user_id)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'pending') {
        return ApiResponse.badRequest('이미 초대를 보냈습니다')
      }
      // If previously declined, allow re-invite by updating
      if (existing.status === 'declined') {
        const { error: updateError } = await supabase.from('project_invitations')
          .update({ status: 'pending', role, message: message || null })
          .eq('id', existing.id)

        if (updateError) {
          console.error('Invitation update error:', updateError.message)
          return ApiResponse.internalError()
        }

        // Fetch inviter profile for notification
        const { data: inviterProfile } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('user_id', user.id)
          .single()

        await notifyProjectInvitation(
          invited_user_id,
          inviterProfile?.nickname || 'User',
          opportunity.title,
          role
        )

        return ApiResponse.ok({ success: true, id: existing.id })
      }
    }

    // Create invitation
    const { data: invitation, error: insertError } = await supabase.from('project_invitations')
      .insert({
        opportunity_id,
        inviter_user_id: user.id,
        invited_user_id,
        role,
        message: message || null,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Invitation insert error:', insertError.message)
      return ApiResponse.internalError()
    }

    // Send notification
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('user_id', user.id)
      .single()

    await notifyProjectInvitation(
      invited_user_id,
      inviterProfile?.nickname || 'User',
      opportunity.title,
      role
    )

    return ApiResponse.ok({ success: true, id: invitation.id })
  } catch (error) {
    console.error('Invitation error:', error)
    return ApiResponse.internalError()
  }
}

// GET: Fetch invitations (sent or received)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'received'

    let query = supabase.from('project_invitations').select('*')

    if (type === 'sent') {
      query = query.eq('inviter_user_id', user.id)
    } else {
      query = query.eq('invited_user_id', user.id)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      // Table might not exist yet (migration not applied)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return ApiResponse.ok({ invitations: [] })
      }
      console.error('Invitation query error:', error.message)
      return ApiResponse.internalError()
    }

    return ApiResponse.ok({ invitations: data || [] })
  } catch (error) {
    console.error('Invitation error:', error)
    return ApiResponse.internalError()
  }
}
