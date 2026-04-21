import { createClient as createAnonClient } from '@supabase/supabase-js'

/**
 * PublicMetricsStrip — /trust 상단 데이터 기반 신뢰 신호.
 *
 * 서버 컴포넌트. 빌드/revalidate 시점에 5개 공개 지표를 집계.
 * 값이 N < 10 이면 "— " 로 숨깁니다 (baseline 미달, 과장 방지).
 *
 * 출처: /api/metrics/public 과 동일한 쿼리. 동일 ISR 주기 (10분).
 */

export const revalidate = 600

async function fetchCounts() {
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

  return {
    clubs: clubsRes.count ?? 0,
    opportunities: oppsRes.count ?? 0,
    profiles: profilesRes.count ?? 0,
    updates: updatesRes.count ?? 0,
    universities: uniqueUniversities,
  }
}

export async function PublicMetricsStrip() {
  let data: Awaited<ReturnType<typeof fetchCounts>> | null = null
  try {
    data = await fetchCounts()
  } catch {
    return null
  }

  const items: Array<{ label: string; value: number; suffix?: string }> = [
    { label: '공개 클럽', value: data.clubs },
    { label: '활성 프로젝트', value: data.opportunities },
    { label: '공개 프로필', value: data.profiles },
    { label: '최근 90일 업데이트', value: data.updates },
    { label: '연결된 대학', value: data.universities },
  ]

  const visible = items.filter((i) => i.value >= 10)
  if (visible.length === 0) return null

  return (
    <div className="mt-6 mb-10 bg-surface-card border border-border rounded-2xl p-5">
      <p className="text-[10px] font-medium text-txt-tertiary mb-3">현재 플랫폼 현황 · 공개 수치</p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {visible.map((item) => (
          <div key={item.label}>
            <div className="text-[22px] font-bold font-mono text-txt-primary tabular-nums">
              {item.value.toLocaleString()}
              {item.suffix ?? ''}
            </div>
            <div className="text-[11px] text-txt-tertiary mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-txt-tertiary mt-3 leading-relaxed">
        10분 주기 ISR 로 갱신. 10 미만 지표는 baseline 미달로 숨겨집니다. 개별 유저 식별 데이터는 포함되지 않습니다.
      </p>
    </div>
  )
}
