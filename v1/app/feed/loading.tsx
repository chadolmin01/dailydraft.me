// 공개 피드: 780px narrow + stats strip + 시간 그룹 리스트. 루트 loading.tsx의
// 1400px 그리드와 어긋나므로 전용 스켈레톤.
export default function FeedLoading() {
  return (
    <div className="skeleton-delayed min-h-screen bg-surface-bg">
      <div className="max-w-[780px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        {/* Header */}
        <div className="mb-6 space-y-2">
          <div className="h-4 w-24 skeleton-shimmer rounded-full" />
          <div className="h-8 w-48 skeleton-shimmer rounded-2xl" />
          <div className="h-4 w-64 skeleton-shimmer rounded-full" />
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-4 mb-6 px-4 py-3 bg-surface-card border border-border rounded-2xl">
          {[0, 1, 2].map(i => <div key={i} className="h-4 w-20 skeleton-shimmer rounded-full" />)}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 mb-6">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-7 w-16 skeleton-shimmer rounded-full" />)}
        </div>

        {/* Time groups */}
        <div className="space-y-8">
          {[0, 1].map(g => (
            <section key={g}>
              <div className="h-3 w-16 skeleton-shimmer rounded-full mb-3" />
              <div className="space-y-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-40 skeleton-shimmer rounded-2xl" />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
