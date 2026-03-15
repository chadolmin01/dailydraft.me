import { NextRequest, NextResponse } from 'next/server';
import { sendWeeklyDigestEmails } from '@/src/lib/email/send-weekly-digest';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/cron/weekly-digest
 * Send weekly digest emails to opted-in users
 *
 * Should be called by a cron job once per week (e.g., Sunday 10:00 KST)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const expectedAuth = `Bearer ${cronSecret}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await sendWeeklyDigestEmails();

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: result.success,
      timestamp: new Date().toISOString(),
      result: {
        emailsSent: result.emailsSent,
        skipped: result.skipped,
        errors: result.errors.slice(0, 10), // Limit errors in response
      },
      duration_ms: duration,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/weekly-digest
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
}
