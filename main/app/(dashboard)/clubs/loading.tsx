// 클럽 목록: 검색 + 카테고리 칩 + 3컬럼 카드 그리드. 공용 loading.tsx는 2컬럼이라 레이아웃 shift 발생.
export default function ClubsLoading() {
  return (
    <div className="bg-surface-bg min-h-full">
      <div className="max-w-[1200px] mx-auto px-5 pt-6 pb-16">
        <div className="animate-pulse space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="h-7 w-20 bg-surface-sunken rounded-full" />
            <div className="h-9 w-28 bg-surface-sunken rounded-full" />
          </div>
          {/* 검색바 */}
          <div className="h-12 bg-surface-sunken rounded-full" />
          {/* 카테고리 칩 */}
          <div className="flex gap-2 overflow-hidden">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="h-8 w-20 bg-surface-sunken rounded-full shrink-0" />
            ))}
          </div>
          {/* 카드 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-3.5 p-4 bg-surface-card border border-border rounded-xl">
                <div className="w-[52px] h-[52px] bg-surface-sunken rounded-md shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3.5 bg-surface-sunken rounded-full w-24" />
                  <div className="h-3 bg-surface-sunken rounded-full w-full" />
                  <div className="h-3 bg-surface-sunken rounded-full w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
