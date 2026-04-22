'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Building2, RotateCw, Home } from 'lucide-react'
import { captureClientError } from '@/src/lib/posthog/client-capture'

/**
 * Institution 영역 전용 에러 바운더리.
 * 기관 관리자가 사용하는 페이지 — 보고서·멤버 집계 실패 가능성 높음.
 * 기관 대시보드 홈으로 복귀 경로 제공.
 */
export default function InstitutionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[institution] Unhandled error:', error)
    captureClientError(error, {
      source: 'institution-route-boundary',
      digest: error.digest,
    })
  }, [error])

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-surface-card border border-border rounded-2xl p-8 sm:p-10">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-status-danger-bg flex items-center justify-center shrink-0">
            <Building2 size={22} className="text-status-danger-text" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-txt-primary mb-1">
              기관 페이지에서 오류가 발생했습니다
            </h2>
            <p className="text-[13px] text-txt-secondary leading-relaxed">
              보고서 집계·멤버 조회 중 문제가 생긴 것으로 보입니다.
              다시 시도하거나 잠시 후 접속해 주세요.
            </p>
          </div>
        </div>

        {error.digest && (
          <div className="mb-5 p-3 bg-surface-sunken rounded-xl">
            <p className="text-[11px] text-txt-tertiary mb-1">오류 번호 (문의 시 참고)</p>
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
            href="/institution"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-surface-card text-txt-secondary text-[14px] font-bold hover:bg-surface-sunken hover:text-txt-primary transition-colors"
          >
            <Home size={14} />
            기관 대시보드
          </Link>
        </div>
      </div>
    </div>
  )
}
