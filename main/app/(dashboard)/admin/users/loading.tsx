/**
 * Admin / Users 전용 skeleton — 검색바 + 테이블 레이아웃.
 * 상위 admin 의 card-grid skeleton 과 mismatch 해소.
 */
export default function AdminUsersLoading() {
  return (
    <div className="skeleton-delayed flex-1 overflow-y-auto h-screen bg-surface-bg">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-6 space-y-2">
          <div className="h-3 w-20 skeleton-shimmer rounded" />
          <div className="h-8 w-32 skeleton-shimmer rounded" />
        </div>

        {/* Search + stats */}
        <div className="flex items-center justify-between gap-4">
          <div className="h-10 w-full max-w-md skeleton-shimmer rounded-xl" />
          <div className="h-4 w-20 skeleton-shimmer rounded shrink-0" />
        </div>

        {/* Table */}
        <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-4 py-3 bg-surface-sunken border-b border-border">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-3 w-16 skeleton-shimmer rounded" />
            ))}
          </div>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-4 py-3.5 border-b border-border last:border-0 items-center">
              <div className="h-3.5 skeleton-shimmer rounded" style={{ width: `${60 + (i % 3) * 10}%` }} />
              <div className="h-3 skeleton-shimmer rounded" style={{ width: `${70 + (i % 2) * 15}%` }} />
              <div className="h-3 skeleton-shimmer rounded" style={{ width: `${50 + (i % 3) * 12}%` }} />
              <div className="h-6 w-8 skeleton-shimmer rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
