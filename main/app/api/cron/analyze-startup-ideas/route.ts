import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  analyzeStartupKoreaFit,
  calculateFinalScore,
} from '@/src/lib/ai/startup-korea-analyzer';
import { logCronError } from '@/src/lib/error-logging';
import type { StartupIdea } from '@/src/lib/startups/types';

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
export const maxDuration = 300; // 5 minutes

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
 * POST /api/cron/analyze-startup-ideas
 *
 * Query params:
 * - limit: max items to analyze (optional, defaults to 10)
 * - force: re-analyze even if already analyzed (optional, defaults to false)
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 20);
    const force = searchParams.get('force') === 'true';

    // 3. Get unanalyzed startups from database
    const supabase = createStartupIdeasAdminClient();

    let query = supabase
      .from('startup_ideas')
      .select('*')
      .eq('status', 'active')
      .order('upvotes', { ascending: false })
      .limit(limit);

    // Only get unanalyzed startups unless force=true
    if (!force) {
      query = query.is('korea_deep_analysis', null);
    }

    const { data: startups, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch startups: ${fetchError.message}`);
    }

    if (!startups || startups.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No startups to analyze',
        results: [],
        duration_ms: Date.now() - startTime,
      });
    }

    console.log(`[analyze-startup-ideas] Found ${startups.length} startups to analyze`);

    // 4. Analyze each startup
    const results: AnalysisResult[] = [];

    for (let i = 0; i < startups.length; i++) {
      const startup = startups[i] as StartupIdea;

      try {
        console.log(`[analyze-startup-ideas] Analyzing ${i + 1}/${startups.length}: ${startup.name}`);

        // Call Gemini AI
        const analysis = await analyzeStartupKoreaFit(startup);
        const finalScore = calculateFinalScore(startup, analysis);

        // Update database
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

    // 5. Summary
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const duration = Date.now() - startTime;

    return NextResponse.json({
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

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logCronError(err, 'analyze-startup-ideas');

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
 * GET /api/cron/analyze-startup-ideas
 */
export async function GET() {
  const supabase = createStartupIdeasAdminClient();

  // Get counts
  const { count: totalCount } = await supabase
    .from('startup_ideas')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: analyzedCount } = await supabase
    .from('startup_ideas')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('korea_deep_analysis', 'is', null);

  return NextResponse.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    stats: {
      total_active: totalCount || 0,
      analyzed: analyzedCount || 0,
      pending: (totalCount || 0) - (analyzedCount || 0),
    },
  });
}
