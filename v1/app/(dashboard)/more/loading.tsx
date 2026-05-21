/**
 * Mobile /more: 프로필 카드 + 메뉴 그룹 3~4개.
 * 모바일 전용이라 max-w-lg narrow 폭, 공용 (dashboard)/loading.tsx 1400px와 불일치.
 */
export default function MoreLoading() {
  return (
    <div className="skeleton-delayed max-w-lg mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 space-y-4">
      {/* Header */}
      <div className="h-7 w-20 skeleton-shimmer rounded-xl mb-6" />

      {/* Profile card */}
      <div className="flex items-center gap-4 p-4 bg-surface-sunken rounded-2xl">
        <div className="w-12 h-12 skeleton-shimmer rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 skeleton-shimmer rounded-full" />
          <div className="h-3 w-32 skeleton-shimmer rounded-full" />
        </div>
      </div>

      {/* Menu groups — 탐색, 주요, 설정 3~4개 그룹 */}
      {[0, 1, 2].map(g => (
        <div key={g} className="bg-surface-sunken rounded-2xl overflow-hidden">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border/30 last:border-0">
              <div className="w-5 h-5 skeleton-shimmer rounded-md shrink-0" />
              <div className="h-4 flex-1 max-w-[160px] skeleton-shimmer rounded-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
