'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { logError } from '@/src/lib/error-logging'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled error:', error)
    logError({
      source: 'client',
      message: error.message,
      stackTrace: error.stack,
      endpoint: typeof window !== 'undefined' ? window.location.pathname : undefined,
      method: 'GET',
    }).catch(() => {})
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg px-4">
      <div className="max-w-md w-full">
        <div className="border-2 border-border-strong bg-surface-card p-10 shadow-brutal text-center">
          <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-black text-2xl font-mono">!</span>
          </div>

          <p className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary mb-2">
            SOMETHING WENT WRONG
          </p>

          <h2 className="text-xl font-bold text-txt-primary mb-3">
            문제가 발생했습니다
          </h2>

          <p className="text-sm text-txt-tertiary mb-2">
            일시적인 오류가 발생했습니다. 다시 시도해주세요.
          </p>

          {error.digest && (
            <p className="text-[0.625rem] font-mono text-txt-disabled mb-6">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={reset}
              className="px-6 py-2.5 bg-black text-white text-sm font-bold border border-black hover:bg-[#333] transition-colors shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              다시 시도
            </button>
            <Link
              href="/explore"
              className="px-6 py-2.5 bg-surface-card text-txt-secondary text-sm font-medium border border-border-strong hover:bg-surface-sunken transition-colors"
            >
              탐색으로
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
