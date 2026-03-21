import { NextRequest } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'

/**
 * Cron job to expire boosts
 * Should be called periodically (e.g., every hour)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (fail-closed: reject if secret is missing or mismatched)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return ApiResponse.unauthorized()
    }

    const supabase = createAdminClient()

    // Call the expire_boosts function
    const { data, error } = await supabase.rpc('expire_boosts')

    if (error) {
      console.error('Error expiring boosts:', error)
      return ApiResponse.internalError('Failed to expire boosts')
    }

    const expiredCount = data || 0

    console.log(`[Cron] Expired ${expiredCount} boosts`)

    return ApiResponse.ok({
      success: true,
      expired_count: expiredCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in expire-boosts cron:', error)
    return ApiResponse.internalError('Cron job failed')
  }
}

// Also support GET for manual triggering in development
export async function GET(request: NextRequest) {
  return POST(request)
}
