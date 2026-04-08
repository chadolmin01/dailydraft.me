import { NextRequest } from 'next/server'
import { sendDeadlineNotificationEmails } from '@/src/lib/email/send-deadline-notifications'
import { ApiResponse } from '@/src/lib/api-utils'
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture'

export const runtime = 'nodejs'
export const maxDuration = 60 // 1 minute

/**
 * Cron endpoint for sending email notifications
 * POST /api/cron/send-emails
 */
export const POST = withCronCapture('send-emails', async (request: NextRequest) => {
  const startTime = Date.now()

  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return ApiResponse.internalError('Server configuration error')
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized()
  }

  const result = await sendDeadlineNotificationEmails()

  const duration = Date.now() - startTime

  return ApiResponse.ok({
    success: result.success,
    timestamp: new Date().toISOString(),
    result: {
      emails_sent: result.emailsSent,
      errors: result.errors,
    },
    duration_ms: duration,
  })
})

/**
 * Health check endpoint
 */
export async function GET() {
  return ApiResponse.ok({
    status: 'ready',
    timestamp: new Date().toISOString(),
  })
}
