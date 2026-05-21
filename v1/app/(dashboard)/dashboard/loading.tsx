/**
 * Dashboard 전용 스켈레톤.
 *
 * Dashboard 페이지는 "Triage Home" 레이아웃 — 상단 greeting + triage items + quick actions + recent activity.
 * 공용 (dashboard)/loading.tsx 의 2-col grid 스켈레톤과 모양이 달라 레이아웃 shift 가 발생.
 * 이 파일로 override 해서 실제 페이지와 유사한 구조 유지.
 */
export default function DashboardLoading() {
  return (
    <div className="skeleton-delayed max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-6">
      {/* Greeting — 이름 + 한줄 요약 */}
      <div className="space-y-2">
        <div className="h-7 w-64 skeleton-shimmer rounded" />
        <div className="h-4 w-96 max-w-full skeleton-shimmer rounded" />
      </div>

      {/* Today's triage — 3줄 */}
      <div className="bg-surface-card border border-border rounded-2xl p-5 space-y-3">
        <div className="h-4 w-28 skeleton-shimmer rounded mb-4" />
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-3 pb-3 border-b border-border-subtle last:border-0 last:pb-0">
            <div className="w-8 h-8 rounded-lg skeleton-shimmer shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-40 skeleton-shimmer rounded" />
              <div className="h-3 w-56 skeleton-shimmer rounded" />
            </div>
            <div className="w-16 h-7 skeleton-shimmer rounded-full shrink-0" />
          </div>
        ))}
      </div>

      {/* Quick actions — 가로 스크롤 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-surface-card border border-border rounded-2xl p-4 space-y-2">
            <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
            <div className="h-3.5 w-20 skeleton-shimmer rounded" />
            <div className="h-2.5 w-28 skeleton-shimmer rounded" />
          </div>
        ))}
      </div>

      {/* 최근 활동 */}
      <div className="space-y-3">
        <div className="h-4 w-20 skeleton-shimmer rounded" />
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-surface-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 skeleton-shimmer rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-44 skeleton-shimmer rounded" />
              <div className="h-3 w-28 skeleton-shimmer rounded" />
            </div>
            <div className="h-3 w-12 skeleton-shimmer rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
