import { NextRequest, NextResponse } from 'next/server';
import {
  getAutomatedCollectors,
  syncStartupsToDatabase,
  type SyncResult,
  type StartupSource,
} from '@/src/lib/startups';
import { logCronError } from '@/src/lib/error-logging';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

/**
 * Cron endpoint for syncing startup ideas
 * POST /api/cron/sync-startup-ideas
 *
 * Query params:
 * - source: specific source to sync (optional, defaults to all automated)
 * - limit: max items per source (optional, defaults to 50)
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

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const sourceParam = searchParams.get('source') as StartupSource | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // 3. Get collectors to run
    const collectors = getAutomatedCollectors();
    const collectorsToRun = sourceParam
      ? collectors.filter(c => c.source === sourceParam)
      : collectors;

    if (collectorsToRun.length === 0) {
      return NextResponse.json({
        success: true,
        message: sourceParam ? `No collector found for source: ${sourceParam}` : 'No automated collectors available',
        results: [],
        duration_ms: Date.now() - startTime,
      });
    }

    // 4. Run collectors and sync
    const results: SyncResult[] = [];

    for (const collector of collectorsToRun) {
      try {
        console.log(`[sync-startup-ideas] Collecting from ${collector.source}...`);

        const startups = await collector.collect({ limit });
        console.log(`[sync-startup-ideas] Collected ${startups.length} from ${collector.source}`);

        if (startups.length > 0) {
          const syncResult = await syncStartupsToDatabase(startups, {
            skipExisting: true,
          });
          results.push(syncResult);
        } else {
          results.push({
            source: collector.source,
            new_startups: 0,
            updated_startups: 0,
            skipped_startups: 0,
            errors: [],
            duration_ms: 0,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[sync-startup-ideas] Error from ${collector.source}:`, errorMessage);

        results.push({
          source: collector.source,
          new_startups: 0,
          updated_startups: 0,
          skipped_startups: 0,
          errors: [{ error: errorMessage }],
          duration_ms: 0,
        });
      }
    }

    // 5. Aggregate results
    const totalNew = results.reduce((sum, r) => sum + r.new_startups, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped_startups, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        sources_processed: results.length,
        total_new: totalNew,
        total_skipped: totalSkipped,
        total_errors: totalErrors,
      },
      results,
      duration_ms: duration,
    });

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logCronError(err, 'sync-startup-ideas');

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: err.message,
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 * GET /api/cron/sync-startup-ideas
 */
export async function GET() {
  const collectors = getAutomatedCollectors();

  return NextResponse.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    available_collectors: collectors.map(c => ({
      source: c.source,
      tier: c.tier,
    })),
  });
}
