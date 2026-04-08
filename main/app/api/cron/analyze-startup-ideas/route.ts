import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  analyzeStartupKoreaFit,
  calculateFinalScore,
} from '@/src/lib/ai/startup-korea-analyzer';
import { ApiResponse } from '@/src/lib/api-utils';
import type { StartupIdea } from '@/src/lib/startups/types';
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture';

// Create untyped admin client for startup_ideas table (not in generated types yet)
function createStartupIdeasAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export const runtime = 'nodejs';
export const maxDuration = 300;

interface AnalysisResult {
  id: string;
  name: string;
  korea_fit_score: number;
  final_score: number;
  success: boolean;
  error?: string;
}

/**
 * Cron endpoint for analyzing startup ideas with Gemini AI
 */
export const POST = withCronCapture('analyze-startup-ideas', async (request: NextRequest) => {
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
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 20);
  const force = searchParams.get('force') === 'true';

  const supabase = createStartupIdeasAdminClient();

  let query = supabase
    .from('startup_ideas')
    .select('*')
    .eq('status', 'active')
    .order('upvotes', { ascending: false })
    .limit(limit);

  if (!force) {
    query = query.is('korea_deep_analysis', null);
  }

  const { data: startups, error: fetchError } = await query;

  if (fetchError) {
    throw new Error(`Failed to fetch startups: ${fetchError.message}`);
  }

  if (!startups || startups.length === 0) {
    return ApiResponse.ok({
      success: true,
      message: 'No startups to analyze',
      results: [],
      duration_ms: Date.now() - startTime,
    });
  }

  console.log(`[analyze-startup-ideas] Found ${startups.length} startups to analyze`);

  const results: AnalysisResult[] = [];

  for (let i = 0; i < startups.length; i++) {
    const startup = startups[i] as StartupIdea;

    // Inner try/catch: per-item failure shouldn't halt batch
    try {
      console.log(`[analyze-startup-ideas] Analyzing ${i + 1}/${startups.length}: ${startup.name}`);

      const analysis = await analyzeStartupKoreaFit(startup);
      const finalScore = calculateFinalScore(startup, analysis);

      const { error: updateError } = await supabase
        .from('startup_ideas')
        .update({
          korea_deep_analysis: analysis as unknown as Record<string, unknown>,
          korea_fit_score: analysis.korea_fit_score,
          final_score: finalScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', startup.id);

      if (updateError) {
        throw new Error(`DB update failed: ${updateError.message}`);
      }

      results.push({
        id: startup.id,
        name: startup.name,
        korea_fit_score: analysis.korea_fit_score,
        final_score: finalScore,
        success: true,
      });

      // Rate limit: 4 seconds between API calls (15 RPM)
      if (i < startups.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 4000));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[analyze-startup-ideas] Error analyzing ${startup.name}:`, errorMessage);

      results.push({
        id: startup.id,
        name: startup.name,
        korea_fit_score: 0,
        final_score: 0,
        success: false,
        error: errorMessage,
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const duration = Date.now() - startTime;

  return ApiResponse.ok({
    success: true,
    timestamp: new Date().toISOString(),
    summary: {
      total_processed: results.length,
      success: successCount,
      failed: failCount,
      avg_korea_fit_score: successCount > 0
        ? Math.round(results.filter(r => r.success).reduce((sum, r) => sum + r.korea_fit_score, 0) / successCount)
        : 0,
    },
    results,
    duration_ms: duration,
  });
});

/**
 * Health check endpoint
 */
export async function GET() {
  const supabase = createStartupIdeasAdminClient();

  const { count: totalCount } = await supabase
    .from('startup_ideas')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: analyzedCount } = await supabase
    .from('startup_ideas')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('korea_deep_analysis', 'is', null);

  return ApiResponse.ok({
    status: 'ready',
    timestamp: new Date().toISOString(),
    stats: {
      total_active: totalCount || 0,
      analyzed: analyzedCount || 0,
      pending: (totalCount || 0) - (analyzedCount || 0),
    },
  });
}
