/**
 * 운영자 대시보드 skeleton — KPI 카드 + 팀 리스트 레이아웃.
 */
export default function OperatorLoading() {
  return (
    <div className="skeleton-delayed max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-24 skeleton-shimmer rounded" />
        <div className="h-7 w-56 skeleton-shimmer rounded" />
      </div>

      {/* KPI 4개 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-surface-card border border-border rounded-2xl p-4 space-y-2">
            <div className="h-3 w-16 skeleton-shimmer rounded" />
            <div className="h-7 w-12 skeleton-shimmer rounded" />
          </div>
        ))}
      </div>

      {/* 팀 리스트 */}
      <div className="space-y-2">
        <div className="h-4 w-24 skeleton-shimmer rounded" />
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-surface-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 skeleton-shimmer rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 skeleton-shimmer rounded" style={{ width: `${60 + (i % 3) * 10}%` }} />
              <div className="h-3 w-40 skeleton-shimmer rounded" />
            </div>
            <div className="h-6 w-16 skeleton-shimmer rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
