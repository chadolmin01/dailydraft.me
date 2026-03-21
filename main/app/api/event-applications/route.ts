import { NextRequest } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { ApiResponse, validateRequired } from '@/src/lib/api-utils';
import type {
  EventApplication,
  CreateEventApplicationRequest,
  EventApplicationStatus,
} from '@/src/types/event-application';

/**
 * GET /api/event-applications
 * Get user's event applications with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return ApiResponse.unauthorized();
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as EventApplicationStatus | null;
    const eventType = searchParams.get('event_type');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    let query = supabase
      .from('event_applications')
      .select(`
        *,
        event:startup_events (
          id,
          title,
          organizer,
          event_type,
          registration_end_date,
          registration_url,
          interest_tags
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    const { data: applications, error, count } = await query;

    if (error) {
      return ApiResponse.internalError('지원 현황을 불러오는데 실패했습니다', error.message);
    }

    // Filter by event_type or search in memory (nested filter)
    let filteredApplications = applications || [];

    if (eventType) {
      filteredApplications = filteredApplications.filter(
        (app) => app.event?.event_type === eventType
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredApplications = filteredApplications.filter((app) =>
        app.event?.title?.toLowerCase().includes(searchLower) ||
        app.event?.organizer?.toLowerCase().includes(searchLower)
      );
    }

    return ApiResponse.ok({
      applications: filteredApplications,
      total: count || filteredApplications.length,
      limit,
      offset,
    });

  } catch (_error) {
    return ApiResponse.internalError();
  }
}

/**
 * POST /api/event-applications
 * Create a new event application tracking
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return ApiResponse.unauthorized();
    }

    const body: CreateEventApplicationRequest = await request.json();

    // Validate required fields
    const { valid, missing } = validateRequired(body as unknown as Record<string, unknown>, ['event_id']);
    if (!valid) {
      return ApiResponse.badRequest(`필수 필드가 누락되었습니다: ${missing.join(', ')}`);
    }

    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from('startup_events')
      .select('id, title')
      .eq('id', body.event_id)
      .single();

    if (eventError || !event) {
      return ApiResponse.notFound('행사를 찾을 수 없습니다');
    }

    // Check if application already exists
    const { data: existing } = await supabase
      .from('event_applications')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', body.event_id)
      .single();

    if (existing) {
      return ApiResponse.badRequest('이미 이 행사에 대한 지원 추적이 존재합니다');
    }

    // Create application
    const { data: application, error } = await supabase
      .from('event_applications')
      .insert({
        user_id: user.id,
        event_id: body.event_id,
        status: body.status || 'interested',
        personal_notes: body.personal_notes || null,
        reminder_date: body.reminder_date || null,
        preparation_checklist: [],
      })
      .select(`
        *,
        event:startup_events (
          id,
          title,
          organizer,
          event_type,
          registration_end_date,
          registration_url,
          interest_tags
        )
      `)
      .single();

    if (error) {
      return ApiResponse.internalError('지원 추적을 생성하는데 실패했습니다', error.message);
    }

    return ApiResponse.created(application);

  } catch (_error) {
    return ApiResponse.internalError();
  }
}
