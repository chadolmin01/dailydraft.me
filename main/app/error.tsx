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
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-black text-2xl font-mono">D</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          문제가 발생했습니다
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          일시적인 오류가 발생했습니다. 다시 시도해주세요.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}
