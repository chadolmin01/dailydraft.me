import { createClient } from '@/src/lib/supabase/server'
import { notifyProfileInterest } from '@/src/lib/notifications/create-notification'
import { NextRequest } from 'next/server'
import { ApiResponse } from '@/src/lib/api-utils'

// POST: Toggle profile interest (like/unlike)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetProfileId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    // Prevent self-like: check if target profile belongs to current user
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', targetProfileId)
      .single()

    if (targetProfile && (targetProfile as { user_id: string }).user_id === user.id) {
      return ApiResponse.badRequest('자신의 프로필에는 좋아요를 누를 수 없습니다')
    }

    // Check if already interested
    const { data: existing } = await supabase
      .from('profile_interests')
      .select('id')
      .eq('user_id', user.id)
      .eq('target_profile_id', targetProfileId)
      .maybeSingle()

    if (existing) {
      // Unlike — remove interest
      await supabase
        .from('profile_interests')
        .delete()
        .eq('id', existing.id)

      // Decrement count
      const { data: profile } = await supabase
        .from('profiles')
        .select('interest_count, user_id')
        .eq('id', targetProfileId)
        .single()

      const currentCount = (profile as { interest_count: number | null } | null)?.interest_count || 0
      await supabase
        .from('profiles')
        .update({ interest_count: Math.max(0, currentCount - 1) } as never)
        .eq('id', targetProfileId)

      return ApiResponse.ok({ interested: false, interest_count: Math.max(0, currentCount - 1) })
    } else {
      // Like — add interest
      const { error: insertError } = await supabase
        .from('profile_interests')
        .insert({
          user_id: user.id,
          target_profile_id: targetProfileId,
        } as never)

      if (insertError) {
        return ApiResponse.internalError()
      }

      // Increment count
      const { data: profile } = await supabase
        .from('profiles')
        .select('interest_count, user_id')
        .eq('id', targetProfileId)
        .single()

      const currentCount = (profile as { interest_count: number | null } | null)?.interest_count || 0
      await supabase
        .from('profiles')
        .update({ interest_count: currentCount + 1 } as never)
        .eq('id', targetProfileId)

      // Send notification to profile owner (not self)
      const targetUserId = (profile as { user_id: string } | null)?.user_id
      if (targetUserId && targetUserId !== user.id) {
        // Get liker's nickname
        const { data: likerProfile } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('user_id', user.id)
          .single()
        const likerName = (likerProfile as { nickname: string } | null)?.nickname || '누군가'
        notifyProfileInterest(targetUserId, likerName).catch(() => {})
      }

      return ApiResponse.ok({ interested: true, interest_count: currentCount + 1 })
    }
  } catch {
    return ApiResponse.internalError()
  }
}

// GET: Check if current user has expressed interest
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetProfileId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.ok({ interested: false, interest_count: 0 })
    }

    const { data: existing } = await supabase
      .from('profile_interests')
      .select('id')
      .eq('user_id', user.id)
      .eq('target_profile_id', targetProfileId)
      .maybeSingle()

    // Get count
    const { data: profile } = await supabase
      .from('profiles')
      .select('interest_count')
      .eq('id', targetProfileId)
      .single()

    const count = (profile as { interest_count: number | null } | null)?.interest_count || 0

    return ApiResponse.ok({ interested: !!existing, interest_count: count })
  } catch {
    return ApiResponse.internalError()
  }
}
