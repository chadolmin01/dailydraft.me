'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-card px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-black text-2xl font-mono">D</span>
        </div>
        <h2 className="text-xl font-bold text-txt-primary mb-2">
          문제가 발생했습니다
        </h2>
        <p className="text-sm text-txt-tertiary mb-6">
          일시적인 오류가 발생했습니다. 다시 시도해주세요.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-black text-white text-sm font-semibold border border-black hover:bg-[#333] transition-colors shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}
