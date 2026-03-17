import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  syncStartupsToDatabase,
  type ManualUploadRequest,
  type CollectedStartup,
  type StartupSource,
} from '@/src/lib/startups';

export const runtime = 'nodejs';
export const maxDuration = 120;

const VALID_SOURCES: StartupSource[] = [
  'ycombinator',
  'betalist',
  'theresanai',
  'indiehackers',
  'manual',
];

/**
 * Manual upload endpoint for startup ideas
 * POST /api/startup-ideas/upload
 *
 * Request body:
 * {
 *   source: "theresanai" | "indiehackers" | "manual",
 *   ideas: [
 *     {
 *       name: "Startup Name",
 *       tagline: "One-liner",
 *       description: "Full description",
 *       category: ["AI", "SaaS"],
 *       sourceUrl: "https://...",
 *       websiteUrl: "https://...",
 *       fundingStage: "seed",
 *       totalFunding: 2000000,
 *       investors: ["Y Combinator"]
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Verify admin access (using service role or admin check)
    const authHeader = request.headers.get('authorization');

    // Allow CRON_SECRET for automated uploads
    const cronSecret = process.env.CRON_SECRET;
    const isAuthorizedCron = authHeader === `Bearer ${cronSecret}`;

    // Or check for authenticated admin user
    let isAdmin = false;
    if (!isAuthorizedCron) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: authHeader || '',
            },
          },
        });

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check if user is admin (from app_metadata)
          isAdmin = user.app_metadata?.is_admin === true;
        }
      }
    }

    if (!isAuthorizedCron && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json() as ManualUploadRequest;

    if (!body.source || !body.ideas || !Array.isArray(body.ideas)) {
      return NextResponse.json(
        { error: 'Invalid request body. Required: source (string), ideas (array)' },
        { status: 400 }
      );
    }

    if (!VALID_SOURCES.includes(body.source)) {
      return NextResponse.json(
        { error: `Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}` },
        { status: 400 }
      );
    }

    if (body.ideas.length === 0) {
      return NextResponse.json(
        { error: 'ideas array cannot be empty' },
        { status: 400 }
      );
    }

    if (body.ideas.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 ideas per request' },
        { status: 400 }
      );
    }

    // 3. Validate and transform ideas
    const validationErrors: Array<{ index: number; error: string }> = [];
    const collectedStartups: CollectedStartup[] = [];

    body.ideas.forEach((idea, index) => {
      // Validate required fields
      if (!idea.name || typeof idea.name !== 'string') {
        validationErrors.push({ index, error: 'name is required' });
        return;
      }

      if (!idea.sourceUrl || typeof idea.sourceUrl !== 'string') {
        validationErrors.push({ index, error: 'sourceUrl is required' });
        return;
      }

      // Generate external_id from source and slug
      const slug = idea.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const externalId = `${body.source}:${slug}`;

      collectedStartups.push({
        externalId,
        source: body.source,
        sourceUrl: idea.sourceUrl,
        name: idea.name,
        tagline: idea.tagline,
        description: idea.description,
        category: idea.category,
        websiteUrl: idea.websiteUrl,
        fundingStage: idea.fundingStage,
        totalFunding: idea.totalFunding,
        investors: idea.investors,
        rawData: {
          uploaded_at: new Date().toISOString(),
          upload_source: 'manual_api',
        },
      });
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation errors in ideas',
          validation_errors: validationErrors,
        },
        { status: 400 }
      );
    }

    // 4. Sync to database
    const result = await syncStartupsToDatabase(collectedStartups, {
      skipExisting: true,
    });

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      source: body.source,
      submitted: body.ideas.length,
      result: {
        new_startups: result.new_startups,
        skipped_existing: result.skipped_startups,
        errors: result.errors,
      },
      duration_ms: duration,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/startup-ideas/upload
 * Returns upload format documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/startup-ideas/upload',
    description: 'Manual upload endpoint for startup ideas (Admin only)',
    valid_sources: VALID_SOURCES,
    request_format: {
      source: 'string (one of valid_sources)',
      ideas: [
        {
          name: 'string (required)',
          tagline: 'string (optional)',
          description: 'string (optional)',
          category: ['string array (optional)'],
          sourceUrl: 'string (required)',
          websiteUrl: 'string (optional)',
          fundingStage: 'pre_seed | seed | series_a | series_b | series_c | series_d_plus | ipo | acquired | bootstrapped (optional)',
          totalFunding: 'number in USD (optional)',
          investors: ['string array (optional)'],
        },
      ],
    },
    example: {
      source: 'theresanai',
      ideas: [
        {
          name: 'AI Writing Assistant',
          tagline: 'Write better content 10x faster',
          description: 'An AI-powered writing assistant that helps you create compelling content.',
          category: ['AI/ML', 'SaaS', 'B2B'],
          sourceUrl: 'https://theresanai.com/ai-writing-assistant',
          websiteUrl: 'https://ai-writer.example.com',
          fundingStage: 'seed',
          totalFunding: 1500000,
        },
      ],
    },
  });
}
