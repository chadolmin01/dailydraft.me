import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { notifyTeamLeft } from '@/src/lib/notifications/create-notification'

// POST: Team member leaves the project voluntarily
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    // Prevent creator from leaving their own project
    const { data: opp } = await supabase
      .from('opportunities')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (opp?.creator_id === user.id) {
      return ApiResponse.badRequest('프로젝트 생성자는 탈퇴할 수 없습니다')
    }

    // Find the user's active membership
    const { data: membership } = await supabase
      .from('accepted_connections')
      .select('id')
      .eq('opportunity_id', id)
      .eq('applicant_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!membership) {
      return ApiResponse.badRequest('이 프로젝트의 팀원이 아닙니다')
    }

    // Set status to 'left'
    const { error } = await supabase
      .from('accepted_connections')
      .update({ status: 'left' })
      .eq('id', membership.id)

    if (error) {
      console.error('Team leave error:', error)
      return ApiResponse.internalError()
    }

    // Notify the project creator
    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('creator_id, title')
      .eq('id', id)
      .single()

    if (opportunity) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('user_id', user.id)
        .single()

      await notifyTeamLeft(
        opportunity.creator_id,
        (profile as any)?.nickname || '팀원',
        opportunity.title || '프로젝트',
        id
      )
    }

    return ApiResponse.ok({ success: true })
  } catch (error) {
    console.error('Team leave error:', error)
    return ApiResponse.internalError()
  }
}
