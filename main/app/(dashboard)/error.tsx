'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, Home, RotateCw, ArrowLeft } from 'lucide-react'
import { captureClientError } from '@/src/lib/posthog/client-capture'

/**
 * Dashboard 라우트 그룹 전용 에러 바운더리.
 * 루트 `app/error.tsx` 와 다른 점:
 *   - TopNavbar·BottomTabBar 유지 (layout은 보존됨, error 내부만 재렌더)
 *   - "홈으로" 외에 "뒤로가기" 옵션 제공 — 대시보드 유저는 보통 depth가 있음
 *   - 더 간결한 inline 카드 (전체 화면 장악 X, nav 안에 수납)
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[dashboard] Unhandled error:', error)
    captureClientError(error, {
      source: 'dashboard-route-boundary',
      digest: error.digest,
    })
  }, [error])

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-surface-card border border-border rounded-2xl p-8 sm:p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-status-danger-bg flex items-center justify-center mx-auto mb-5">
          <AlertCircle size={24} className="text-status-danger-text" strokeWidth={1.5} />
        </div>

        <h2 className="text-[18px] font-bold text-txt-primary mb-1.5">
          이 페이지를 불러오지 못했습니다
        </h2>
        <p className="text-[13px] text-txt-secondary leading-relaxed max-w-md mx-auto">
          일시적인 오류일 가능성이 높습니다. 다시 시도하거나 잠시 후 새로고침해 주세요.
        </p>
        {error.digest && (
          <p className="text-[11px] text-txt-disabled mt-3">
            문의 시:{' '}
            <code className="px-1.5 py-0.5 bg-surface-sunken rounded text-txt-tertiary font-mono">
              {error.digest}
            </code>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center mt-6">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-[14px] font-bold hover:bg-brand-hover active:scale-[0.97] transition-all shadow-sm"
          >
            <RotateCw size={14} />
            다시 시도
          </button>
          <button
            onClick={() => history.back()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-surface-card text-txt-secondary text-[14px] font-bold hover:bg-surface-sunken hover:text-txt-primary transition-colors"
          >
            <ArrowLeft size={14} />
            뒤로
          </button>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-txt-tertiary text-[14px] font-semibold hover:text-txt-primary transition-colors"
          >
            <Home size={14} />
            홈
          </Link>
        </div>
      </div>
    </div>
  )
}
