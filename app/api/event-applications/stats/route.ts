import { createClient } from '@/src/lib/supabase/server';
import { ApiResponse } from '@/src/lib/api-utils';
import type { EventApplicationStats, EventApplicationStatus } from '@/src/types/event-application';

/**
 * GET /api/event-applications/stats
 * Get user's event application statistics
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return ApiResponse.unauthorized();
    }

    // Get all applications for the user
    const { data: applications, error } = await supabase
      .from('event_applications')
      .select('status, created_at')
      .eq('user_id', user.id) as { data: { status: string; created_at: string }[] | null; error: Error | null };

    if (error) {
      return ApiResponse.internalError('통계를 불러오는데 실패했습니다', error.message);
    }

    // Calculate statistics
    const byStatus: Record<EventApplicationStatus, number> = {
      interested: 0,
      preparing: 0,
      applied: 0,
      accepted: 0,
      rejected: 0,
      pending: 0,
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let recentApplications = 0;

    for (const app of applications || []) {
      // Count by status
      if (app.status && byStatus[app.status as EventApplicationStatus] !== undefined) {
        byStatus[app.status as EventApplicationStatus]++;
      }

      // Count recent applications
      if (new Date(app.created_at) >= thirtyDaysAgo) {
        recentApplications++;
      }
    }

    // Calculate acceptance rate
    const totalDecided = byStatus.accepted + byStatus.rejected;
    const acceptanceRate = totalDecided > 0
      ? Math.round((byStatus.accepted / totalDecided) * 100)
      : 0;

    const stats: EventApplicationStats = {
      total: applications?.length || 0,
      by_status: byStatus,
      acceptance_rate: acceptanceRate,
      recent_applications: recentApplications,
    };

    return ApiResponse.ok(stats);

  } catch (_error) {
    return ApiResponse.internalError();
  }
}
