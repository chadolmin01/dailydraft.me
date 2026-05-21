'use client'

// Next.js App Router 전역 에러 바운더리.
// app/* 모든 페이지에서 throw 되는 에러를 캐치. 화이트 스크린 대신 친절한 안내.
// 시스템 용어 (stack, error code 등) 노출 금지 — 매니저는 비개발자.

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 개발 중에는 콘솔로, production 에서는 추후 Sentry 등으로
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-display-md text-ink">잠시 문제가 생겼습니다.</h1>
        <p className="text-body-md text-muted">
          예상치 못한 오류가 발생했습니다. 다시 시도하거나, 계속 같은 오류가 보이면
          잠시 후 새로고침해 주세요.
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
        {error.digest ? (
          <p className="text-caption text-muted-soft font-mono">참조번호: {error.digest}</p>
        ) : null}
      </div>
    </main>
  )
}
