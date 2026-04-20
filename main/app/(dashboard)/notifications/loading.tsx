/**
 * 알림 리스트 전용 스켈레톤.
 * 카드 그리드 대신 세로 리스트 레이아웃이라 공용 loading.tsx 와 mismatch.
 */
export default function NotificationsLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-4">
      <div className="flex items-baseline justify-between mb-4">
        <div className="h-6 w-24 skeleton-shimmer rounded" />
        <div className="h-4 w-16 skeleton-shimmer rounded" />
      </div>

      <div className="bg-surface-card border border-border rounded-2xl divide-y divide-border-subtle overflow-hidden">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-start gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-full skeleton-shimmer shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 skeleton-shimmer rounded" style={{ width: `${60 + (i % 3) * 15}%` }} />
              <div className="h-3 w-32 skeleton-shimmer rounded" />
            </div>
            <div className="h-3 w-10 skeleton-shimmer rounded shrink-0 mt-1" />
          </div>
        ))}
      </div>
    </div>
  )
}
