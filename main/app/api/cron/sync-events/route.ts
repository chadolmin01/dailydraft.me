import { NextRequest, NextResponse } from 'next/server';
import { fetchKStartupEvents } from '@/src/lib/events/k-startup-api';
import { transformKStartupEvent } from '@/src/lib/events/transform-event';
import { syncEventsToDatabase } from '@/src/lib/events/event-sync-manager';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for processing

/**
 * Cron endpoint for syncing startup events
 * POST /api/cron/sync-events
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Verify authorization
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
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 2. Fetch events from K-Startup API
    const rawEvents = await fetchKStartupEvents({ perPage: 100 });

    if (rawEvents.length === 0) {
      return NextResponse.json({
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

    // 3. Transform events
    const transformedEvents = rawEvents.map(transformKStartupEvent);

    // 4. Sync to database with AI processing
    const result = await syncEventsToDatabase(transformedEvents);

    // 5. Generate deadline notifications for bookmarked events
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

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result: {
        ...result,
        notifications_created: notificationsCreated,
      },
      duration_ms: duration,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: errorMessage,
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 * GET /api/cron/sync-events
 */
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
}
