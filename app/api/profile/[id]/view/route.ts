import { createClient } from '@/src/lib/supabase/server'
import { notifyProfileViewMilestone } from '@/src/lib/notifications/create-notification'
import { NextRequest, NextResponse } from 'next/server'
import { checkViewRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'
import { ApiResponse } from '@/src/lib/api-utils'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()
const VIEW_COOLDOWN_SEC = 15 * 60 // 15분

// 프로필 조회수 증가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ip = getClientIp(request)

    const rateLimitResponse = await checkViewRateLimit(ip)
    if (rateLimitResponse) return rateLimitResponse

    // Redis 기반 중복 조회 방지 (15분 TTL)
    const dedupeKey = `view:profile:${ip}:${id}`
    try {
      const wasSet = await redis.set(dedupeKey, '1', { ex: VIEW_COOLDOWN_SEC, nx: true })
      if (!wasSet) {
        return NextResponse.json({ success: true, deduplicated: true })
      }
    } catch {
      // Redis 실패 시 중복 체크 스킵 (graceful degradation)
    }

    const supabase = await createClient()

    // 현재 조회수 가져와서 +1
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('profile_views, user_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      return ApiResponse.notFound('Profile not found')
    }

    const typedProfile = profile as { profile_views: number | null; user_id: string }
    const currentViews = typedProfile.profile_views || 0
    const newViews = currentViews + 1
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_views: newViews } as never)
      .eq('id', id)

    if (updateError) {
      return ApiResponse.internalError()
    }

    // 10단위 마일스톤 알림 (10, 20, 30, ...)
    if (newViews % 10 === 0) {
      notifyProfileViewMilestone(typedProfile.user_id, newViews).catch(() => {})
    }

    return NextResponse.json({ success: true, profile_views: newViews })
  } catch {
    return ApiResponse.internalError()
  }
}

// 프로필 조회수 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('profile_views')
      .eq('id', id)
      .single()

    if (error) {
      return ApiResponse.notFound('Profile not found')
    }

    return NextResponse.json({
      profile_views: (profile as { profile_views: number | null }).profile_views || 0,
    })
  } catch {
    return ApiResponse.internalError()
  }
}
