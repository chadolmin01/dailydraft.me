import { createClient } from '@/src/lib/supabase/server'
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

export const POST = withErrorCapture(async (
  request,
  { params }: { params: Promise<{ id: string }> }
) => {
    const { id: eventId } = await params
    if (!isValidUUID(eventId)) return ApiResponse.badRequest('Invalid ID')
    const ip = getClientIp(request)

    const rateLimitResponse = await checkViewRateLimit(ip)
    if (rateLimitResponse) return rateLimitResponse

    // Redis 기반 중복 조회 방지 (15분 TTL)
    const dedupeKey = `view:event:${ip}:${eventId}`
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

    // 원자적 조회수 증가
    const { data, error } = await supabase.rpc('increment_view_count', {
      table_name: 'startup_events',
      row_id: eventId,
    })

    if (error) {
      // RPC가 없으면 fallback: 직접 업데이트
      const { data: currentEvent, error: fetchError } = await supabase
        .from('startup_events')
        .select('views_count')
        .eq('id', eventId)
        .single()

      if (fetchError || !currentEvent) {
        return ApiResponse.notFound('Event not found')
      }

      const newCount = ((currentEvent as { views_count: number | null }).views_count || 0) + 1
      await supabase
        .from('startup_events')
        .update({ views_count: newCount } as never)
        .eq('id', eventId)

      return ApiResponse.ok({ success: true, views_count: newCount })
    }

    return ApiResponse.ok({ success: true, views_count: data })
})
