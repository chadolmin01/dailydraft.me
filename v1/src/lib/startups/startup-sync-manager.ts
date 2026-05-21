/**
 * Startup Ideas Sync Manager
 * Handles DB synchronization for collected startup ideas
 */

import { createClient } from '@supabase/supabase-js';
import { geminiRateLimiter } from '@/src/lib/ai/rate-limiter';
import { classifyStartupTags } from './startup-tag-classifier';
import type {
  CollectedStartup,
  TransformedStartup,
  SyncResult,
  SyncOptions,
  StartupSource,
} from './types';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Transform collected startup to DB format
 */
function transformStartup(collected: CollectedStartup): TransformedStartup {
  return {
    external_id: collected.externalId,
    source: collected.source,
    source_url: collected.sourceUrl,
    name: collected.name,
    tagline: collected.tagline || null,
    description: collected.description || null,
    category: collected.category || [],
    logo_url: collected.logoUrl || null,
    website_url: collected.websiteUrl || null,
    funding_stage: collected.fundingStage || null,
    total_funding: collected.totalFunding || null,
    investors: collected.investors || [],
    upvotes: collected.upvotes || 0,
    comments_count: collected.commentsCount || 0,
    tier: getTierForSource(collected.source),
    raw_data: collected.rawData || null,
  };
}

function getTierForSource(source: StartupSource): 1 | 2 | 3 | 4 {
  switch (source) {
    case 'producthunt':
    case 'ycombinator':
      return 1;
    case 'betalist':
    case 'crunchbase':
      return 2;
    case 'theresanai':
    case 'indiehackers':
      return 3;
    case 'manual':
      return 4;
    default:
      return 4;
  }
}

/**
 * Sync collected startups to database
 */
export async function syncStartupsToDatabase(
  startups: CollectedStartup[],
  options?: SyncOptions
): Promise<SyncResult> {
  const source = startups[0]?.source || 'manual';
  const startTime = Date.now();

  const result: SyncResult = {
    source,
    new_startups: 0,
    updated_startups: 0,
    skipped_startups: 0,
    errors: [],
    duration_ms: 0,
  };

  if (startups.length === 0) {
    result.duration_ms = Date.now() - startTime;
    return result;
  }

  const supabase = getSupabaseClient();

  // 1. Check existing startups
  const externalIds = startups.map(s => s.externalId);
  const { data: existingStartups } = await supabase
    .from('startup_ideas')
    .select('external_id')
    .in('external_id', externalIds);

  const existingIds = new Set(existingStartups?.map(s => s.external_id) || []);

  // 2. Separate new vs existing
  const newStartups = startups.filter(s => !existingIds.has(s.externalId));
  result.skipped_startups = startups.length - newStartups.length;

  if (options?.skipExisting && newStartups.length === 0) {
    result.duration_ms = Date.now() - startTime;
    return result;
  }

  // 3. Process new startups
  for (const startup of newStartups) {
    try {
      const transformed = transformStartup(startup);

      // AI tag classification (rate-limited)
      let interestTags: string[] = [];
      try {
        interestTags = await geminiRateLimiter.schedule(() =>
          classifyStartupTags({
            name: transformed.name,
            tagline: transformed.tagline,
            description: transformed.description,
            category: transformed.category,
          })
        );
      } catch (tagError) {
        console.warn(`Tag classification failed for ${startup.name}:`, tagError);
        // Continue without tags
      }

      // Calculate initial priority score
      const priorityScore = calculatePriorityScore(
        transformed.upvotes,
        transformed.total_funding,
        null, // No korea_fit_score yet
        transformed.tier
      );

      if (options?.dryRun) {
        console.log(`[DRY RUN] Would insert: ${startup.name}`);
        result.new_startups++;
        continue;
      }

      // Insert to database
      const { error } = await supabase
        .from('startup_ideas')
        .insert([{
          ...transformed,
          interest_tags: interestTags,
          priority_score: priorityScore,
          collected_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      result.new_startups++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push({
        external_id: startup.externalId,
        error: errorMessage,
      });
    }
  }

  result.duration_ms = Date.now() - startTime;
  return result;
}

/**
 * Calculate priority score (0-100)
 * Based on: upvotes, funding, korea fit, tier
 */
function calculatePriorityScore(
  upvotes: number,
  totalFunding: number | null,
  koreaFitScore: number | null,
  tier: 1 | 2 | 3 | 4
): number {
  // Upvote score (max 25, log scale)
  const upvoteScore = Math.min(25, Math.log10(Math.max(upvotes, 1) + 1) * 10);

  // Funding score (max 25, log scale)
  const fundingScore = totalFunding
    ? Math.min(25, Math.log10(totalFunding + 1) * 2)
    : 0;

  // Korea fit score (max 40)
  const fitScore = (koreaFitScore ?? 50) * 0.4;

  // Tier bonus
  const tierBonus = tier === 1 ? 10 : tier === 2 ? 5 : tier === 3 ? 2 : 0;

  const total = upvoteScore + fundingScore + fitScore + tierBonus;
  return Math.min(100, Math.max(0, Math.round(total)));
}

/**
 * Mark duplicate startups
 */
export async function markDuplicateStartups(
  startupIds: string[],
  reason?: string
): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase
    .from('startup_ideas')
    .update({
      status: 'duplicate',
      raw_data: reason ? { duplicate_reason: reason } : undefined,
    })
    .in('id', startupIds);
}

/**
 * Update korea fit analysis for a startup
 */
export async function updateKoreaFitAnalysis(
  startupId: string,
  score: number,
  analysis: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabaseClient();

  // Recalculate priority with new korea fit score
  const { data: startup } = await supabase
    .from('startup_ideas')
    .select('upvotes, total_funding, tier')
    .eq('id', startupId)
    .single();

  if (!startup) return;

  const newPriority = calculatePriorityScore(
    startup.upvotes,
    startup.total_funding,
    score,
    startup.tier
  );

  await supabase
    .from('startup_ideas')
    .update({
      korea_fit_score: score,
      korea_fit_analysis: analysis,
      priority_score: newPriority,
    })
    .eq('id', startupId);
}

/**
 * Get startups pending korea fit analysis
 */
export async function getStartupsPendingAnalysis(
  limit: number = 10
): Promise<Array<{ id: string; name: string; description: string | null }>> {
  const supabase = getSupabaseClient();

  const { data } = await supabase
    .from('startup_ideas')
    .select('id, name, description')
    .is('korea_fit_score', null)
    .eq('status', 'active')
    .order('priority_score', { ascending: false })
    .limit(limit);

  return data || [];
}
