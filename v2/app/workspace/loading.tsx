// 워크스페이스 로딩 셸 — 라이트 톤 + 정적 (애니메이션 없음) 으로 점멸 인상 제거.
// 의도: 페이지가 100ms 이내 그려질 때 깜빡 보이는 스켈레톤이 더 거슬리는 문제.
//       opacity 만으로 차분히 표시, pulse 안 함.

export default function WorkspaceLoading() {
  return (
    <div className="min-h-screen md:h-screen flex flex-col md:grid md:grid-cols-[var(--layout-chat-width)_1fr] bg-canvas">
      {/* 좌측 (모바일 상단) — 챗 패널 (라이트, 우측과 동일 톤) */}
      <aside className="bg-canvas border-b md:border-b-0 md:border-r border-hairline flex flex-col max-h-[60vh] md:max-h-none md:h-screen">
        <header className="px-4 py-3 border-b border-hairline">
          <div className="h-5 w-24 bg-surface-card rounded opacity-50" />
        </header>
        <div className="flex-1 px-4 py-5 space-y-3">
          <div className="h-3 w-40 bg-surface-card rounded opacity-40" />
          <div className="h-3 w-32 bg-surface-card rounded opacity-40" />
        </div>
        <div className="px-4 pb-4 pt-3 border-t border-hairline">
          <div className="h-11 rounded-3xl bg-surface-card opacity-40" />
        </div>
      </aside>

      {/* 우측 — 콘텐츠 */}
      <main className="overflow-y-auto p-4 md:p-6 md:h-screen">
        <div className="max-w-layout-content mx-auto space-y-7">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="h-7 w-24 bg-surface-card rounded opacity-50" />
              <div className="h-4 w-32 bg-surface-card rounded opacity-40" />
            </div>
            <div className="h-9 w-20 bg-surface-card rounded-full opacity-40" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="rounded-xl overflow-hidden border border-hairline bg-canvas"
              >
                <div className="aspect-[5/3] bg-surface-card opacity-50" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-24 bg-surface-card rounded opacity-50" />
                  <div className="h-3 w-32 bg-surface-card rounded opacity-30" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
