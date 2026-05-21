import { createClient as createAnonClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const revalidate = 600 // 10분 ISR

/**
 * GET /api/metrics/public
 *
 * 사회적 증거용 공개 지표. 로그인 불필요. 랜딩·신뢰 센터·기관 영업에서 사용.
 *
 * 반환:
 *   - clubs_public: visibility='public' 클럽 수
 *   - active_opportunities: status='active' 프로젝트 수
 *   - profiles_public: profile_visibility='public' 프로필 수
 *   - weekly_updates: 최근 90일 내 생성된 주간 업데이트 수
 *   - public_universities: 공개 프로필 소속 대학 고유 수 (학내 다양성 지표)
 *
 * 원칙:
 *   - 개별 유저 식별 가능한 데이터는 반환하지 않음
 *   - 숫자가 < 10 이면 "coming soon" 으로 프론트에서 숨기기 권장 (baseline 미달)
 *   - 10분 edge cache + stale-while-revalidate 1시간 → 트래픽 부담 최소
 */
export async function GET() {
  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const [clubsRes, oppsRes, profilesRes, updatesRes, universitiesRes] = await Promise.all([
    supabase.from('clubs').select('*', { count: 'exact', head: true }).eq('visibility', 'public'),
    supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('profile_visibility', 'public'),
    supabase.from('project_updates').select('*', { count: 'exact', head: true }).gte('created_at', ninetyDaysAgo),
    supabase.from('profiles').select('university').eq('profile_visibility', 'public').not('university', 'is', null).limit(1000),
  ])

  const uniqueUniversities = new Set(
    (universitiesRes.data ?? [])
      .map((p) => (p as { university?: string }).university)
      .filter((u): u is string => typeof u === 'string' && u.length > 0),
  ).size

  const current = {
    clubs_public: clubsRes.count ?? 0,
    active_opportunities: oppsRes.count ?? 0,
    profiles_public: profilesRes.count ?? 0,
    weekly_updates_recent: updatesRes.count ?? 0,
    public_universities: uniqueUniversities,
  }

  // 7일 전 스냅샷 → 증감 계산. 데이터 없으면 trend 는 null.
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const snapshotRes = await (supabase as any)
    .from('daily_metrics_snapshots')
    .select('clubs_public, active_opportunities, profiles_public, weekly_updates_90d, public_universities')
    .lte('snapshot_date', weekAgo)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const snap = snapshotRes.data as {
    clubs_public: number
    active_opportunities: number
    profiles_public: number
    weekly_updates_90d: number
    public_universities: number
  } | null

  const trend = snap
    ? {
        clubs_public_delta: current.clubs_public - snap.clubs_public,
        active_opportunities_delta: current.active_opportunities - snap.active_opportunities,
        profiles_public_delta: current.profiles_public - snap.profiles_public,
        weekly_updates_delta: current.weekly_updates_recent - snap.weekly_updates_90d,
        public_universities_delta: current.public_universities - snap.public_universities,
        since: weekAgo,
      }
    : null

  return Response.json(
    {
      ...current,
      trend,
      fetched_at: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
      },
    },
  )
}
