import { NextRequest } from 'next/server';
import { sendWeeklyDigestEmails } from '@/src/lib/email/send-weekly-digest';
import { ApiResponse } from '@/src/lib/api-utils';
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/cron/weekly-digest
 * Send weekly digest emails to opted-in users
 */
export const POST = withCronCapture('weekly-digest', async (request: NextRequest) => {
  const startTime = Date.now();

  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return ApiResponse.internalError('Server configuration error');
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized();
  }

  const result = await sendWeeklyDigestEmails();

  const duration = Date.now() - startTime;

  return ApiResponse.ok({
    success: result.success,
    timestamp: new Date().toISOString(),
    result: {
      emailsSent: result.emailsSent,
      skipped: result.skipped,
      errors: result.errors.slice(0, 10),
    },
    duration_ms: duration,
  });
});

/**
 * GET /api/cron/weekly-digest
 * Health check endpoint
 */
export async function GET() {
  return ApiResponse.ok({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
}
