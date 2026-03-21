import { NextRequest } from 'next/server'
import { sendDeadlineNotificationEmails } from '@/src/lib/email/send-deadline-notifications'
import { ApiResponse } from '@/src/lib/api-utils'

export const runtime = 'nodejs'
export const maxDuration = 60 // 1 minute

/**
 * Cron endpoint for sending email notifications
 * POST /api/cron/send-emails
 *
 * 매일 오전 9시 (KST) 실행 권장
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Verify authorization
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      return ApiResponse.internalError('Server configuration error')
    }

    const expectedAuth = `Bearer ${cronSecret}`

    if (authHeader !== expectedAuth) {
      return ApiResponse.unauthorized()
    }

    // 2. Send deadline notification emails
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return ApiResponse.internalError('이메일 발송 처리 중 오류가 발생했습니다.')
  }
}

/**
 * Health check endpoint
 * GET /api/cron/send-emails
 */
export async function GET() {
  return ApiResponse.ok({
    status: 'ready',
    timestamp: new Date().toISOString(),
  })
}
