/**
 * 초안 목록 전용 스켈레톤.
 * 주간 업데이트 초안 카드 레이아웃.
 */
export default function DraftsLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-5">
      <div className="space-y-2 mb-4">
        <div className="h-7 w-32 skeleton-shimmer rounded" />
        <div className="h-4 w-56 skeleton-shimmer rounded" />
      </div>

      <div className="space-y-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-surface-card border border-border rounded-2xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="h-4 skeleton-shimmer rounded" style={{ width: `${55 + (i % 3) * 15}%` }} />
                <div className="h-3 w-32 skeleton-shimmer rounded" />
              </div>
              <div className="h-6 w-16 skeleton-shimmer rounded-full shrink-0" />
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="h-3 w-full skeleton-shimmer rounded" />
              <div className="h-3 w-5/6 skeleton-shimmer rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
