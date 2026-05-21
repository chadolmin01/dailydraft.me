import { createClient } from '@/src/lib/supabase/server'
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

// Opportunity 조회수 증가
export const POST = withErrorCapture(async (
  request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  if (!isValidUUID(id)) return ApiResponse.badRequest('Invalid ID')
  const ip = getClientIp(request)

  const rateLimitResponse = await checkViewRateLimit(ip)
  if (rateLimitResponse) return rateLimitResponse

  // Inner try/catch: redis failure should gracefully degrade
  const dedupeKey = `view:opp:${ip}:${id}`
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

  const { data, error } = await supabase.rpc('increment_view_count', {
    table_name: 'opportunities',
    row_id: id,
  })

  if (error) {
    // RPC가 없으면 fallback: 직접 업데이트
    const { data: currentOpp, error: fetchError } = await supabase
      .from('opportunities')
      .select('views_count')
      .eq('id', id)
      .single()

    if (fetchError) {
      return ApiResponse.notFound('Opportunity not found')
    }

    const newCount = ((currentOpp as { views_count: number | null }).views_count || 0) + 1
    await supabase
      .from('opportunities')
      .update({ views_count: newCount } as never)
      .eq('id', id)

    return ApiResponse.ok({ success: true, views_count: newCount })
  }

  return ApiResponse.ok({ success: true, views_count: data })
})
