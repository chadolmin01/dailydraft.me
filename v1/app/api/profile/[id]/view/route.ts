import { createClient } from '@/src/lib/supabase/server'
import { notifyProfileViewMilestone } from '@/src/lib/notifications/create-notification'
import { NextRequest } from 'next/server'
import { checkViewRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'
import { ApiResponse, isValidUUID } from '@/src/lib/api-utils'
import { Redis } from '@upstash/redis'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

const VIEW_COOLDOWN_SEC = 15 * 60 // 15분

function getRedisClient(): Redis | null {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
    return Redis.fromEnv()
  } catch {
    return null
  }
}

// 프로필 조회수 증가
export const POST = withErrorCapture(async (
  request,
  { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params
    if (!isValidUUID(id)) return ApiResponse.badRequest('Invalid ID')
    const ip = getClientIp(request)

    const rateLimitResponse = await checkViewRateLimit(ip)
    if (rateLimitResponse) return rateLimitResponse

    // Redis 기반 중복 조회 방지 (15분 TTL)
    const dedupeKey = `view:profile:${ip}:${id}`
    const redis = getRedisClient()
    if (redis) {
      try {
        const wasSet = await redis.set(dedupeKey, '1', { ex: VIEW_COOLDOWN_SEC, nx: true })
        if (!wasSet) {
          return ApiResponse.ok({ success: true, deduplicated: true })
        }
      } catch {
        // Redis 실패 시 중복 체크 스킵 (graceful degradation)
      }
    }

    const supabase = await createClient()

    // 원자적 조회수 증가 (RPC)
    const { data: newViews, error: rpcError } = await supabase.rpc('increment_view_count', {
      table_name: 'profiles',
      row_id: id,
    })

    if (rpcError) {
      // RPC 실패 시 fallback: 직접 업데이트
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('profile_views, user_id')
        .eq('id', id)
        .single()

      if (fetchError) {
        return ApiResponse.notFound('프로필을 찾을 수 없습니다')
      }

      const typedProfile = profile as { profile_views: number | null; user_id: string }
      const currentViews = typedProfile.profile_views || 0
      const fallbackViews = currentViews + 1
      await supabase
        .from('profiles')
        .update({ profile_views: fallbackViews } as never)
        .eq('id', id)

      if (fallbackViews % 10 === 0) {
        notifyProfileViewMilestone(typedProfile.user_id, fallbackViews).catch(() => {})
      }

      return ApiResponse.ok({ success: true, profile_views: fallbackViews })
    }

    // RPC 성공 — 마일스톤 체크를 위해 user_id 조회
    if (newViews && newViews % 10 === 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', id)
        .single()
      if (profile) {
        notifyProfileViewMilestone((profile as { user_id: string }).user_id, newViews).catch(() => {})
      }
    }

    return ApiResponse.ok({ success: true, profile_views: newViews })
})

// 프로필 조회수 조회
export const GET = withErrorCapture(async (
  _request,
  { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params
    if (!isValidUUID(id)) return ApiResponse.badRequest('Invalid ID')
    const supabase = await createClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('profile_views')
      .eq('id', id)
      .single()

    if (error) {
      return ApiResponse.notFound('Profile not found')
    }

    return ApiResponse.ok({
      profile_views: (profile as { profile_views: number | null }).profile_views || 0,
    })
})
