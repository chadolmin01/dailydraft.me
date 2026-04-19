// 클럽 상세: 헤더(로고+메타) → 탭바 → 섹션 3개 레이아웃에 맞춘 전용 스켈레톤.
// 공용 loading.tsx보다 레이아웃이 훨씬 달라서 전환 시 깜빡임이 큼.
export default function ClubDetailLoading() {
  return (
    <div className="bg-surface-bg min-h-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-5">
          {/* 뒤로가기 + 공유 */}
          <div className="flex justify-between">
            <div className="h-5 w-24 skeleton-shimmer rounded-full" />
            <div className="h-5 w-16 skeleton-shimmer rounded-full" />
          </div>
          {/* 헤더: 로고 + 이름 + 설명 */}
          <div className="flex gap-5 pt-2">
            <div className="w-[72px] h-[72px] skeleton-shimmer rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2.5 pt-1">
              <div className="h-6 skeleton-shimmer rounded-full w-48" />
              <div className="h-4 skeleton-shimmer rounded-full w-full max-w-md" />
              <div className="h-3.5 skeleton-shimmer rounded-full w-64" />
            </div>
          </div>
          {/* 탭바 */}
          <div className="flex gap-1 border-b border-border pb-0">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 w-20 skeleton-shimmer rounded-t-xl" />
            ))}
          </div>
          {/* 섹션 */}
          <div className="grid grid-cols-3 gap-3 pt-4">
            {[0, 1, 2].map(i => <div key={i} className="h-24 skeleton-shimmer rounded-xl" />)}
          </div>
        </div>
      </div>
    </div>
  )
}
