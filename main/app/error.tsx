'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, Home, RotateCw } from 'lucide-react'
import { captureClientError } from '@/src/lib/posthog/client-capture'

// Next.js App Router 의 글로벌 에러 바운더리.
// 이전: 브루탈리즘 잔재(검은 사각형 + ! 기호 + font-mono 영문 라벨)를 Toss 스타일로 리프레시.
// 사용자 관점 — "오류"보다 "잠깐 문제가 생겼어요" 느낌으로 이탈 감소.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled error:', error)
    captureClientError(error, { source: 'route-boundary', digest: error.digest })
  }, [error])

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <div className="bg-surface-card border border-border rounded-2xl p-8 sm:p-10 text-center shadow-sm">
          {/* 소프트 경고 아이콘 */}
          <div className="w-16 h-16 rounded-2xl bg-status-danger-bg flex items-center justify-center mx-auto mb-5">
            <AlertCircle size={28} className="text-status-danger-text" strokeWidth={1.5} />
          </div>

          <h2 className="text-[20px] font-bold text-txt-primary mb-2">
            잠깐 문제가 생겼어요
          </h2>
          <p className="text-[14px] text-txt-secondary leading-relaxed mb-1">
            일시적인 오류입니다. 다시 시도하면 대부분 해결됩니다.
          </p>
          {error.digest && (
            <p className="text-[11px] text-txt-disabled mt-3">
              문제가 계속되면 이 번호를 알려주세요:{' '}
              <code className="px-1.5 py-0.5 bg-surface-sunken rounded text-txt-tertiary font-mono">
                {error.digest}
              </code>
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 justify-center mt-7">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-[14px] font-bold hover:bg-brand-hover active:scale-[0.97] transition-all shadow-sm"
            >
              <RotateCw size={14} />
              다시 시도
            </button>
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-surface-card text-txt-secondary text-[14px] font-bold hover:bg-surface-sunken hover:text-txt-primary transition-colors"
            >
              <Home size={14} />
              홈으로
            </Link>
          </div>

          <div className="mt-6 pt-5 border-t border-border text-[11px] text-txt-tertiary space-y-1">
            <p>
              전역 장애가 의심되면{' '}
              <Link href="/status" className="text-brand underline">
                시스템 상태
              </Link>{' '}
              페이지를 확인해 주세요.
            </p>
            <p>
              계속 발생하면 문제 신고:{' '}
              <a href="mailto:team@dailydraft.me?subject=%5BBug%5D" className="text-brand underline">
                team@dailydraft.me
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
