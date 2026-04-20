/**
 * 외부 사이트 임베드용 미니멀 스켈레톤.
 * 대시보드 그리드 대신 iframe 에 어울리는 컴팩트 카드.
 */
export default function EmbedClubLoading() {
  return (
    <div className="bg-surface-bg min-h-screen p-4">
      <div className="bg-surface-card border border-border rounded-xl p-4 space-y-3 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg skeleton-shimmer shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-28 skeleton-shimmer rounded" />
            <div className="h-3 w-20 skeleton-shimmer rounded" />
          </div>
        </div>
        <div className="h-2 w-full skeleton-shimmer rounded" />
        <div className="h-2 w-4/5 skeleton-shimmer rounded" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-14 skeleton-shimmer rounded-full" />
          <div className="h-5 w-10 skeleton-shimmer rounded-full" />
        </div>
      </div>
    </div>
  )
}
