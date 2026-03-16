import { NextRequest, NextResponse } from 'next/server';
import { collectDevpostHackathons } from '@/src/lib/events/collectors';
import { syncEventsToDatabase } from '@/src/lib/events/event-sync-manager';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for processing

/**
 * Cron endpoint for syncing external events (Devpost)
 * POST /api/cron/sync-external-events
 *
 * Devpost API에서 해커톤 정보를 수집하여 데이터베이스에 저장합니다.
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

    // 2. Collect from Devpost
    const devpostEvents = await collectDevpostHackathons({
      maxPages: 5,
      status: 'open',
      includeOnline: true,
    });

    if (devpostEvents.length === 0) {
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        result: {
          devpost: { collected: 0, synced: 0 },
        },
        duration_ms: Date.now() - startTime,
      });
    }

    // 3. Sync to database with AI processing
    const syncResult = await syncEventsToDatabase(devpostEvents);

    // 4. Generate deadline notifications
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

    return NextResponse.json({
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
 * GET /api/cron/sync-external-events
 */
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    sources: ['devpost'],
    timestamp: new Date().toISOString(),
  });
}
