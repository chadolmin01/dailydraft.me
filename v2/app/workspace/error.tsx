'use client'

// 워크스페이스 라우트 한정 에러 바운더리.
// /workspace 안에서 발생한 클라이언트 에러를 캐치. 좌측 챗 패널은 살리고 우측만 안내로 대체.
// (Next.js error.tsx 는 segment 단위라 자동으로 해당 트리만 영향.)

import { useEffect } from 'react'

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[WorkspaceError]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-display-md text-ink">워크스페이스를 불러오지 못했습니다.</h1>
        <p className="text-body-md text-muted">
          잠시 후 다시 시도하거나, 계속 같은 오류가 보이면 로그아웃 후 재로그인해 주세요.
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="h-10 px-4 rounded-md bg-ink text-canvas text-button font-medium hover:bg-body-strong transition-colors"
          >
            다시 시도
          </button>
          <a
            href="/"
            className="h-10 px-4 rounded-md border border-hairline text-ink text-button font-medium hover:bg-surface-soft transition-colors inline-flex items-center"
          >
            처음으로
          </a>
        </div>
      </div>
    </div>
  )
}
