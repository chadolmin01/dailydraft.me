/**
 * Admin / Opportunities 전용 skeleton — 필터 + 테이블.
 */
export default function AdminOpportunitiesLoading() {
  return (
    <div className="skeleton-delayed flex-1 overflow-y-auto h-screen bg-surface-bg">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-6">
        <div className="border-b border-border pb-6 space-y-2">
          <div className="h-3 w-24 skeleton-shimmer rounded" />
          <div className="h-8 w-40 skeleton-shimmer rounded" />
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-10 w-full max-w-md skeleton-shimmer rounded-xl" />
            <div className="h-10 w-24 skeleton-shimmer rounded-xl" />
            <div className="h-10 w-24 skeleton-shimmer rounded-xl" />
          </div>
          <div className="h-4 w-16 skeleton-shimmer rounded" />
        </div>

        <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-0">
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 skeleton-shimmer rounded" style={{ width: `${50 + (i % 3) * 15}%` }} />
                <div className="h-3 w-32 skeleton-shimmer rounded" />
              </div>
              <div className="h-6 w-16 skeleton-shimmer rounded-full shrink-0" />
              <div className="h-3 w-20 skeleton-shimmer rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
