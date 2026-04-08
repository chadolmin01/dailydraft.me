import { NextRequest } from 'next/server';
import { collectDevpostHackathons } from '@/src/lib/events/collectors';
import { ApiResponse } from '@/src/lib/api-utils';
import { syncEventsToDatabase } from '@/src/lib/events/event-sync-manager';
import { createClient } from '@supabase/supabase-js';
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Cron endpoint for syncing external events (Devpost)
 */
export const POST = withCronCapture('sync-external-events', async (request: NextRequest) => {
  const startTime = Date.now();

  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return ApiResponse.internalError('Server configuration error');
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized();
  }

  const devpostEvents = await collectDevpostHackathons({
    maxPages: 5,
    status: 'open',
    includeOnline: true,
  });

  if (devpostEvents.length === 0) {
    return ApiResponse.ok({
      success: true,
      timestamp: new Date().toISOString(),
      result: {
        devpost: { collected: 0, synced: 0 },
      },
      duration_ms: Date.now() - startTime,
    });
  }

  const syncResult = await syncEventsToDatabase(devpostEvents);

  let notificationsCreated = 0;
  if (syncResult.new_events > 0) {
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: notifResult } = await supabaseAdmin.rpc('generate_deadline_notifications');
      notificationsCreated = notifResult || 0;
    } catch {
      // Notification generation failed, continue
    }
  }

  const duration = Date.now() - startTime;

  return ApiResponse.ok({
    success: true,
    timestamp: new Date().toISOString(),
    result: {
      devpost: {
        collected: devpostEvents.length,
        new_events: syncResult.new_events,
        updated_events: syncResult.updated_events,
        skipped_events: syncResult.skipped_events,
        errors: syncResult.errors.length,
      },
      notifications_created: notificationsCreated,
    },
    duration_ms: duration,
  });
});

export async function GET() {
  return ApiResponse.ok({
    status: 'ready',
    sources: ['devpost'],
    timestamp: new Date().toISOString(),
  });
}
