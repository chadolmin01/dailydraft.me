import { NextRequest } from 'next/server';
import { fetchKStartupEvents } from '@/src/lib/events/k-startup-api';
import { ApiResponse } from '@/src/lib/api-utils';
import { transformKStartupEvent } from '@/src/lib/events/transform-event';
import { syncEventsToDatabase } from '@/src/lib/events/event-sync-manager';
import { createClient } from '@supabase/supabase-js';
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Cron endpoint for syncing startup events
 */
export const POST = withCronCapture('sync-events', async (request: NextRequest) => {
  const startTime = Date.now();

  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return ApiResponse.internalError('Server configuration error');
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized();
  }

  const rawEvents = await fetchKStartupEvents({ perPage: 100 });

  if (rawEvents.length === 0) {
    return ApiResponse.ok({
      success: true,
      timestamp: new Date().toISOString(),
      result: {
        new_events: 0,
        updated_events: 0,
        expired_events: 0,
        errors: [],
      },
      duration_ms: Date.now() - startTime,
    });
  }

  const transformedEvents = rawEvents.map(transformKStartupEvent);
  const result = await syncEventsToDatabase(transformedEvents);

  // Inner try/catch: notification generation is best-effort
  let notificationsCreated = 0;
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: notifResult } = await supabaseAdmin.rpc('generate_deadline_notifications');
    notificationsCreated = notifResult || 0;
  } catch {
    // Notification generation failed, continue without error
  }

  const duration = Date.now() - startTime;

  return ApiResponse.ok({
    success: true,
    timestamp: new Date().toISOString(),
    result: {
      ...result,
      notifications_created: notificationsCreated,
    },
    duration_ms: duration,
  });
});

export async function GET() {
  return ApiResponse.ok({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
}
