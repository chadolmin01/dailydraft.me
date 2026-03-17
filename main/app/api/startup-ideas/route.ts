import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { StartupSource } from '@/src/lib/startups';

export const runtime = 'nodejs';

/**
 * GET /api/startup-ideas
 * List startup ideas with filtering and pagination
 *
 * Query params:
 * - page: page number (default: 1)
 * - limit: items per page (default: 20, max: 100)
 * - source: filter by source (producthunt, ycombinator, etc.)
 * - category: filter by category
 * - tag: filter by interest tag
 * - minScore: minimum korea_fit_score
 * - tier: filter by tier (1, 2, 3, 4)
 * - status: filter by status (active, archived, duplicate)
 * - sort: sort field (priority_score, korea_fit_score, upvotes, created_at, final_score)
 * - order: sort order (asc, desc)
 * - search: search in name, tagline, description
 * - analyzed: filter by analysis status (true = only analyzed, false = only unanalyzed)
 * - founderType: filter by target founder type
 * - difficulty: filter by difficulty (easy, medium, hard)
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Uses service-role key. Currently blocked by middleware hiddenApiRoutes.
    // TODO: Add per-user auth guard before removing from hiddenApiRoutes.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Parse query params
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const source = searchParams.get('source') as StartupSource | null;
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const minScore = searchParams.get('minScore');
    const tier = searchParams.get('tier');
    const status = searchParams.get('status') || 'active';
    const sort = searchParams.get('sort') || 'priority_score';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search');
    const analyzed = searchParams.get('analyzed');
    const founderType = searchParams.get('founderType');
    const difficulty = searchParams.get('difficulty');

    // 3. Build query
    let query = supabase
      .from('startup_ideas')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (source) {
      query = query.eq('source', source);
    }

    if (category) {
      query = query.contains('category', [category]);
    }

    if (tag) {
      query = query.contains('interest_tags', [tag]);
    }

    if (minScore) {
      query = query.gte('korea_fit_score', parseInt(minScore, 10));
    }

    if (tier) {
      query = query.eq('tier', parseInt(tier, 10));
    }

    if (search) {
      const sanitized = search.replace(/[^a-zA-Z0-9가-힣\s@.\-]/g, '')
      if (sanitized) {
        query = query.or(`name.ilike.%${sanitized}%,tagline.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
      }
    }

    // Filter by analysis status
    if (analyzed === 'true') {
      query = query.not('korea_deep_analysis', 'is', null);
    } else if (analyzed === 'false') {
      query = query.is('korea_deep_analysis', null);
    }

    // Filter by founder type (in korea_deep_analysis.target_founder_type)
    if (founderType) {
      query = query.contains('korea_deep_analysis->target_founder_type', [founderType]);
    }

    // Filter by difficulty
    if (difficulty) {
      query = query.eq('korea_deep_analysis->>difficulty', difficulty);
    }

    // Validate sort field
    const validSortFields = ['priority_score', 'korea_fit_score', 'upvotes', 'created_at', 'collected_at', 'total_funding', 'final_score'];
    const sortField = validSortFields.includes(sort) ? sort : 'priority_score';

    // Apply sorting
    query = query.order(sortField, { ascending: order === 'asc', nullsFirst: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // 4. Execute query
    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // 5. Return response
    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        source,
        category,
        tag,
        minScore: minScore ? parseInt(minScore, 10) : null,
        tier: tier ? parseInt(tier, 10) : null,
        status,
        search,
        analyzed: analyzed === 'true' ? true : analyzed === 'false' ? false : null,
        founderType,
        difficulty,
      },
      sort: {
        field: sortField,
        order,
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
