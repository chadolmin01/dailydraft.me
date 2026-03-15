import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Call the expire_boosts function
    const { data, error } = await supabase.rpc('expire_boosts')

    if (error) {
      console.error('Error expiring boosts:', error)
      return NextResponse.json(
        { error: 'Failed to expire boosts' },
        { status: 500 }
      )
    }

    const expiredCount = data || 0

    console.log(`[Cron] Expired ${expiredCount} boosts`)

    return NextResponse.json({
      success: true,
      expired_count: expiredCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in expire-boosts cron:', error)
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    )
  }
}

// Also support GET for manual triggering in development
export async function GET(request: NextRequest) {
  return POST(request)
}
