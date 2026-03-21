import { NextRequest } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { ApiResponse } from '@/src/lib/api-utils';
import type {
  UpdateEventApplicationRequest,
  ChecklistItem,
} from '@/src/types/event-application';

interface EventApplicationUpdate {
  status?: string;
  applied_at?: string | null;
  applied_url?: string | null;
  result_notes?: string | null;
  personal_notes?: string | null;
  preparation_checklist?: Json | null;
  reminder_date?: string | null;
  reminder_sent?: boolean | null;
}

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/event-applications/[id]
 * Get a specific event application
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return ApiResponse.unauthorized();
    }

    const { data: application, error } = await supabase
      .from('event_applications')
      .select(`
        *,
        event:startup_events (
          id,
          title,
          organizer,
          event_type,
          description,
          registration_end_date,
          registration_url,
          interest_tags
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !application) {
      return ApiResponse.notFound('지원 현황을 찾을 수 없습니다');
    }

    // Get status history
    const { data: history } = await supabase
      .from('event_application_history')
      .select('*')
      .eq('application_id', id)
      .order('changed_at', { ascending: false });

    return ApiResponse.ok({
      ...(application as Record<string, unknown>),
      history: history || [],
    });

  } catch (_error) {
    return ApiResponse.internalError();
  }
}

/**
 * PATCH /api/event-applications/[id]
 * Update an event application
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return ApiResponse.unauthorized();
    }

    const body: UpdateEventApplicationRequest = await request.json();

    // Check if application exists and belongs to user
    const { data: existing, error: findError } = await supabase
      .from('event_applications')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (findError || !existing) {
      return ApiResponse.notFound('지원 현황을 찾을 수 없습니다');
    }

    // Build update object
    const updateData: EventApplicationUpdate = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    if (body.applied_at !== undefined) {
      updateData.applied_at = body.applied_at;
    }

    if (body.applied_url !== undefined) {
      updateData.applied_url = body.applied_url;
    }

    if (body.result_notes !== undefined) {
      updateData.result_notes = body.result_notes;
    }

    if (body.personal_notes !== undefined) {
      updateData.personal_notes = body.personal_notes;
    }

    if (body.preparation_checklist !== undefined) {
      updateData.preparation_checklist = body.preparation_checklist as unknown as Json;
    }

    if (body.reminder_date !== undefined) {
      updateData.reminder_date = body.reminder_date;
      updateData.reminder_sent = false; // Reset reminder status when date changes
    }

    // If status is changing to 'applied', set applied_at
    if (body.status === 'applied' && !body.applied_at) {
      updateData.applied_at = new Date().toISOString();
    }

    // Update application
    const { data: application, error } = await supabase
      .from('event_applications')
      .update(updateData)
      .eq('id', id)
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
      return ApiResponse.internalError('지원 현황을 업데이트하는데 실패했습니다', error.message);
    }

    return ApiResponse.ok(application);

  } catch (_error) {
    return ApiResponse.internalError();
  }
}

/**
 * DELETE /api/event-applications/[id]
 * Delete an event application
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return ApiResponse.unauthorized();
    }

    // Check if application exists and belongs to user
    const { data: existing } = await supabase
      .from('event_applications')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return ApiResponse.notFound('지원 현황을 찾을 수 없습니다');
    }

    // Delete application
    const { error } = await supabase
      .from('event_applications')
      .delete()
      .eq('id', id);

    if (error) {
      return ApiResponse.internalError('지원 현황을 삭제하는데 실패했습니다', error.message);
    }

    return ApiResponse.noContent();

  } catch (_error) {
    return ApiResponse.internalError();
  }
}
