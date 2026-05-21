// 사람 탐색: 헤더 + 검색 + 필터/정렬 + 카드 그리드. 공용 loading의 2컬럼 그리드보다
// 사람 카드 특화 스켈레톤이 실제 그리드 shape 과 더 가까워 layout shift 감소.
export default function NetworkLoading() {
  return (
    <div className="skeleton-delayed bg-surface-bg min-h-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        {/* Header */}
        <div className="mb-5 space-y-2">
          <div className="h-7 w-32 skeleton-shimmer rounded-2xl" />
          <div className="h-4 w-64 skeleton-shimmer rounded-full" />
        </div>

        {/* Search */}
        <div className="h-11 skeleton-shimmer rounded-full mb-4" />

        {/* Filter + Sort row */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            {[0, 1, 2, 3, 4].map(i => <div key={i} className="h-7 w-16 skeleton-shimmer rounded-full shrink-0" />)}
          </div>
          <div className="h-7 w-16 skeleton-shimmer rounded-full shrink-0" />
        </div>

        {/* People grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="bg-surface-card border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 skeleton-shimmer rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-3/4 skeleton-shimmer rounded-full" />
                  <div className="h-3 w-1/2 skeleton-shimmer rounded-full" />
                </div>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(j => <div key={j} className="h-5 w-12 skeleton-shimmer rounded-full" />)}
              </div>
              <div className="h-8 skeleton-shimmer rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
