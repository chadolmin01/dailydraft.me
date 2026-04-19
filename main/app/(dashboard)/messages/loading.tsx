// 메시지: 리스트 패널 + 상세 영역의 2컬럼 스플릿. 공용 스켈레톤은 카드 그리드라 안 맞음.
export default function MessagesLoading() {
  return (
    <div className="bg-surface-bg min-h-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex gap-6">
          {/* 왼쪽 리스트 */}
          <div className="w-80 shrink-0 space-y-2">
            <div className="h-6 w-20 skeleton-shimmer rounded-full mb-4" />
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-3 p-3 bg-surface-card border border-border rounded-xl">
                <div className="w-10 h-10 rounded-full skeleton-shimmer shrink-0" />
                <div className="flex-1 space-y-1.5 pt-0.5">
                  <div className="h-3.5 skeleton-shimmer rounded-full w-24" />
                  <div className="h-3 skeleton-shimmer rounded-full w-full" />
                </div>
              </div>
            ))}
          </div>
          {/* 오른쪽 상세 */}
          <div className="flex-1 hidden md:flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 skeleton-shimmer rounded-full mx-auto" />
              <div className="h-4 w-48 skeleton-shimmer rounded-full mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
