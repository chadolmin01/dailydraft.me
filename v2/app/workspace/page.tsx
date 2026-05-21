import { createServerSupabaseClient } from '@/src/lib/supabase/server'

// 메인 워크스페이스 — 좌측 챗봇 패널 (dark), 우측 콘텐츠 (cream).
// V1 단계의 셸 (실데이터 연결은 Day 2~3 에서 추가).

export default async function WorkspacePage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="h-screen grid grid-cols-[var(--layout-chat-width)_1fr] bg-canvas">
      {/* 좌측 — 챗봇 패널 (다크) */}
      <aside className="bg-surface-dark text-on-dark border-r border-hairline-dark flex flex-col">
        <header className="px-5 py-5 border-b border-hairline-dark">
          <h2 className="text-title-md text-on-dark">Draft</h2>
          <p className="text-caption text-on-dark-soft mt-1">
            {user?.email}
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 text-body-sm text-on-dark-soft">
          {/* TODO: 챗봇 메시지 렌더링 (Day 3) */}
          무엇을 도와드릴까요?
        </div>

        <form className="px-5 py-4 border-t border-hairline-dark">
          <input
            type="text"
            placeholder="메시지를 입력하세요"
            className="w-full h-10 px-4 bg-surface-dark-elevated border border-hairline-dark rounded-md font-body text-body-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-on-dark"
            disabled
          />
        </form>
      </aside>

      {/* 우측 — 콘텐츠 (cream) */}
      <main className="overflow-y-auto p-6 max-w-layout-content mx-auto w-full">
        <div className="space-y-section">
          <header className="space-y-2">
            <h1 className="text-display-lg text-ink">진행도</h1>
            <p className="text-body-md text-muted">
              폴더를 연결하면 팀별 주차별 제출 상황이 여기에 표시됩니다.
            </p>
          </header>

          <section>
            <div className="rounded-lg border border-hairline bg-surface-soft p-7 text-center">
              <p className="text-body-md text-muted mb-4">
                아직 연결된 폴더가 없습니다.
              </p>
              <button
                type="button"
                className="inline-flex items-center h-10 px-4 rounded-md bg-ink text-canvas text-button font-medium hover:bg-body-strong transition-colors"
                disabled
              >
                폴더 연결하기
              </button>
              <p className="text-caption text-muted-soft mt-3">
                Day 1 작업: 폴더 생성 + Drive 연결 UI
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
