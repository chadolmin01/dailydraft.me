// 워크스페이스 로딩 셸 — 좌측 dark / 우측 cream 의 2분할 구조를 미리 보여줘서
// 실제 콘텐츠 로드 시 레이아웃 쉬프트가 없게.

export default function WorkspaceLoading() {
  return (
    <div className="h-screen grid grid-cols-[var(--layout-chat-width)_1fr] bg-canvas">
      {/* 좌측 — 챗봇 패널 (다크) */}
      <aside className="bg-surface-dark border-r border-hairline-dark flex flex-col">
        <header className="px-5 py-5 border-b border-hairline-dark">
          <div className="h-5 w-16 bg-surface-dark-elevated rounded animate-pulse" />
          <div className="h-3 w-32 bg-surface-dark-elevated rounded animate-pulse mt-2 opacity-60" />
        </header>
        <div className="flex-1 px-5 py-4">
          <div className="h-3 w-40 bg-surface-dark-elevated rounded animate-pulse opacity-60" />
        </div>
        <form className="px-5 py-4 border-t border-hairline-dark">
          <div className="h-10 bg-surface-dark-elevated rounded-md animate-pulse opacity-60" />
        </form>
      </aside>

      {/* 우측 — 콘텐츠 */}
      <main className="overflow-y-auto p-6">
        <div className="max-w-layout-content mx-auto space-y-7">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="h-7 w-24 bg-surface-card rounded animate-pulse" />
              <div className="h-4 w-32 bg-surface-card rounded animate-pulse opacity-60" />
            </div>
            <div className="h-10 w-24 bg-surface-card rounded-md animate-pulse opacity-60" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-24 bg-surface-card rounded-xl animate-pulse opacity-60" />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
