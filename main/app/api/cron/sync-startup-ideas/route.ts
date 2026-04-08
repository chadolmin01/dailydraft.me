import { NextRequest } from 'next/server';
import {
  getAutomatedCollectors,
  syncStartupsToDatabase,
  type SyncResult,
  type StartupSource,
} from '@/src/lib/startups';
import { ApiResponse } from '@/src/lib/api-utils';
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Cron endpoint for syncing startup ideas
 */
export const POST = withCronCapture('sync-startup-ideas', async (request: NextRequest) => {
  const startTime = Date.now();

  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return ApiResponse.internalError('Server configuration error');
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const sourceParam = searchParams.get('source') as StartupSource | null;
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const collectors = getAutomatedCollectors();
  const collectorsToRun = sourceParam
    ? collectors.filter(c => c.source === sourceParam)
    : collectors;

  if (collectorsToRun.length === 0) {
    return ApiResponse.ok({
      success: true,
      message: sourceParam ? `No collector found for source: ${sourceParam}` : 'No automated collectors available',
      results: [],
      duration_ms: Date.now() - startTime,
    });
  }

  const results: SyncResult[] = [];

  for (const collector of collectorsToRun) {
    // Inner try/catch: per-source failure shouldn't halt batch
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

  const totalNew = results.reduce((sum, r) => sum + r.new_startups, 0);
  const totalSkipped = results.reduce((sum, r) => sum + r.skipped_startups, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

  const duration = Date.now() - startTime;

  return ApiResponse.ok({
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
});

/**
 * Health check endpoint
 */
export async function GET() {
  const collectors = getAutomatedCollectors();

  return ApiResponse.ok({
    status: 'ready',
    timestamp: new Date().toISOString(),
    available_collectors: collectors.map(c => ({
      source: c.source,
      tier: c.tier,
    })),
  });
}
