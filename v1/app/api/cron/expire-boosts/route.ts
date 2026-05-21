import { NextRequest } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture'

/**
 * Cron job to expire boosts
 */
export const POST = withCronCapture('expire-boosts', async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized()
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('expire_boosts')

  if (error) {
    throw new Error(`Failed to expire boosts: ${error.message}`)
  }

  const expiredCount = data || 0

  console.log(`[Cron] Expired ${expiredCount} boosts`)

  return ApiResponse.ok({
    success: true,
    expired_count: expiredCount,
    timestamp: new Date().toISOString(),
  })
})

// Also support GET for manual triggering in development
export const GET = POST
