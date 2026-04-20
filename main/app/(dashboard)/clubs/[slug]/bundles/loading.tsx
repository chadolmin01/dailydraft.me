/**
 * 번들 목록 skeleton — 뒤로가기 + CTA + 카드 리스트.
 */
export default function BundlesLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3 w-16 skeleton-shimmer rounded" />
          <div className="h-6 w-32 skeleton-shimmer rounded" />
        </div>
        <div className="h-9 w-28 skeleton-shimmer rounded-xl" />
      </div>

      <div className="flex items-center gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-7 w-20 skeleton-shimmer rounded-full" />
        ))}
      </div>

      <div className="space-y-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-surface-card border border-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-32 skeleton-shimmer rounded" />
                <div className="h-5 w-14 skeleton-shimmer rounded-full" />
              </div>
              <div className="h-3 w-20 skeleton-shimmer rounded" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3].map(j => (
                <div key={j} className="h-6 w-16 skeleton-shimmer rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
