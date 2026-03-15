import { NextRequest, NextResponse } from 'next/server'
import { sendDeadlineNotificationEmails } from '@/src/lib/email/send-deadline-notifications'

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
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const expectedAuth = `Bearer ${cronSecret}`

    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Send deadline notification emails
    const result = await sendDeadlineNotificationEmails()

    const duration = Date.now() - startTime

    return NextResponse.json({
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

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

/**
 * Health check endpoint
 * GET /api/cron/send-emails
 */
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  })
}
