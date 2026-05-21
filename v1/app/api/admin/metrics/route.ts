import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { isPlatformAdmin } from '@/src/lib/auth/platform-admin'

export const runtime = 'nodejs'

/**
 * GET /api/admin/metrics
 *
 * Platform admin 전용 KPI 대시보드 API.
 *
 * 반환:
 *   - current: 현 시점 집계 (clubs_public, active_opportunities, profiles_public,
 *              weekly_updates_90d, public_universities, total_users, new_users_7d,
 *              total_applications, total_coffee_chats, total_views)
 *   - snapshots: 최근 30일 daily_metrics_snapshots (trend/sparkline 용)
 *   - deltas: 7d·30d 증감 (스냅샷 존재 시에만)
 *
 * 반드시 platform admin — 내부 숫자 (total_users 등) 는 공개 /api/metrics/public 과 달리 전수 공개.
 */
export const GET = withErrorCapture(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()
  if (!(await isPlatformAdmin(supabase, user))) {
    return ApiResponse.forbidden('플랫폼 관리자만 접근할 수 있습니다')
  }

  const admin = createAdminClient()

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    clubsRes,
    oppsActiveRes,
    oppsTotalRes,
    profilesRes,
    updatesRes,
    universitiesRes,
    usersRes,
    newUsersRes,
    applicationsRes,
    coffeeRes,
    viewsRes,
  ] = await Promise.all([
    admin.from('clubs').select('*', { count: 'exact', head: true }).eq('visibility', 'public'),
    admin.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('opportunities').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('profile_visibility', 'public'),
    admin.from('project_updates').select('*', { count: 'exact', head: true }).gte('created_at', ninetyDaysAgo),
    admin.from('profiles').select('university').eq('profile_visibility', 'public').not('university', 'is', null).limit(2000),
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    admin.from('applications').select('*', { count: 'exact', head: true }),
    admin.from('coffee_chats').select('*', { count: 'exact', head: true }),
    admin.from('opportunities').select('views_count'),
  ])

  const uniqueUniversities = new Set(
    (universitiesRes.data ?? [])
      .map((p) => (p as { university?: string }).university)
      .filter((u): u is string => typeof u === 'string' && u.length > 0),
  ).size

  const totalViews = (viewsRes.data ?? []).reduce(
    (sum: number, o: { views_count?: number | null }) => sum + (o.views_count ?? 0),
    0,
  )

  const current = {
    clubs_public: clubsRes.count ?? 0,
    opportunities_active: oppsActiveRes.count ?? 0,
    opportunities_total: oppsTotalRes.count ?? 0,
    profiles_public: profilesRes.count ?? 0,
    weekly_updates_90d: updatesRes.count ?? 0,
    public_universities: uniqueUniversities,
    total_users: usersRes.count ?? 0,
    new_users_7d: newUsersRes.count ?? 0,
    total_applications: applicationsRes.count ?? 0,
    total_coffee_chats: coffeeRes.count ?? 0,
    total_views: totalViews,
  }

  // 스냅샷 — 최근 30일
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const snapRes = await (admin as any)
    .from('daily_metrics_snapshots')
    .select('snapshot_date, clubs_public, active_opportunities, profiles_public, weekly_updates_90d, public_universities')
    .gte('snapshot_date', thirtyDaysAgo)
    .order('snapshot_date', { ascending: true })

  const snapshots = (snapRes.data ?? []) as Array<{
    snapshot_date: string
    clubs_public: number
    active_opportunities: number
    profiles_public: number
    weekly_updates_90d: number
    public_universities: number
  }>

  function deltaFrom(daysAgo: number) {
    if (snapshots.length === 0) return null
    const target = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    // snapshot_date <= target 인 가장 최근 스냅
    const older = [...snapshots].reverse().find((s) => s.snapshot_date <= target)
    if (!older) return null
    return {
      clubs_public: current.clubs_public - older.clubs_public,
      opportunities_active: current.opportunities_active - older.active_opportunities,
      profiles_public: current.profiles_public - older.profiles_public,
      weekly_updates_90d: current.weekly_updates_90d - older.weekly_updates_90d,
      public_universities: current.public_universities - older.public_universities,
      since: older.snapshot_date,
    }
  }

  return ApiResponse.ok({
    current,
    snapshots,
    deltas: {
      d7: deltaFrom(7),
      d30: deltaFrom(30),
    },
    fetched_at: new Date().toISOString(),
  })
})
