'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Shield, RotateCw, Home } from 'lucide-react'
import { captureClientError } from '@/src/lib/posthog/client-capture'

/**
 * Admin 영역 전용 에러 바운더리.
 * 관리자가 접근하는 페이지라 일반 에러보다 **더 많은 컨텍스트** 제공:
 *   - digest 코드를 더 돋보이게 (문의·티켓 포워딩용)
 *   - 관리자 활동 로그 페이지로 링크 유도 (/admin/error-logs)
 *   - 루트 /admin 으로 돌아가는 경로
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[admin] Unhandled error:', error)
    captureClientError(error, {
      source: 'admin-route-boundary',
      digest: error.digest,
    })
  }, [error])

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-surface-card border border-border rounded-2xl p-8 sm:p-10">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-status-danger-bg flex items-center justify-center shrink-0">
            <Shield size={22} className="text-status-danger-text" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-txt-primary mb-1">
              관리자 페이지에서 오류가 발생했습니다
            </h2>
            <p className="text-[13px] text-txt-secondary leading-relaxed">
              데이터 조회·권한 확인 중 문제가 생긴 것으로 보입니다.
              일시적 오류인지 확인 후, 지속되면 에러 로그를 참고해 주세요.
            </p>
          </div>
        </div>

        {error.digest && (
          <div className="mb-5 p-3 bg-surface-sunken rounded-xl">
            <p className="text-[11px] text-txt-tertiary mb-1">오류 번호 (티켓 참고용)</p>
            <code className="text-[13px] font-mono font-semibold text-txt-primary">
              {error.digest}
            </code>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-[14px] font-bold hover:bg-brand-hover active:scale-[0.97] transition-all shadow-sm"
          >
            <RotateCw size={14} />
            다시 시도
          </button>
          <Link
            href="/admin/error-logs"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-surface-card text-txt-secondary text-[14px] font-bold hover:bg-surface-sunken hover:text-txt-primary transition-colors"
          >
            <Shield size={14} />
            에러 로그 보기
          </Link>
          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-txt-tertiary text-[14px] font-semibold hover:text-txt-primary transition-colors"
          >
            <Home size={14} />
            Admin 홈
          </Link>
        </div>
      </div>
    </div>
  )
}
