'use client'

import Link from 'next/link'
import { User, ArrowRight, Sparkles } from 'lucide-react'
import { useProfile } from '@/src/hooks/useProfile'
import { useProfileCompletion } from '@/src/hooks/useProfileCompletion'

/**
 * 프로필 완성도 카드 — 대시보드에 표시.
 * pct < 100 일 때만 노출. 비어있는 핵심 필드 최대 3개 CTA 로 노출.
 */
export function ProfileCompletionCard() {
  const { data: profile } = useProfile()
  const { fields, completedCount, pct } = useProfileCompletion(profile ?? null)

  if (pct >= 100) return null
  if (!profile) return null

  const missing = fields.filter(f => !f.done).slice(0, 3)

  return (
    <Link
      href="/profile"
      className="block bg-surface-card border border-border rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
          <User size={18} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[14px] font-bold text-txt-primary">
              프로필 완성도 <span className="tabular-nums text-brand">{pct}%</span>
            </p>
            {pct < 50 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-indicator-trending bg-status-warning-bg px-1.5 py-0.5 rounded-full">
                <Sparkles size={9} />
                매칭 감소
              </span>
            )}
          </div>
          <p className="text-[12px] text-txt-tertiary">
            {completedCount}/{fields.length} 완료 · 채울수록 AI 매칭 정확도가 올라갑니다
          </p>
        </div>
        <ArrowRight size={14} className="text-txt-disabled group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
      </div>

      <div className="h-1 bg-surface-sunken rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-brand transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {missing.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-txt-tertiary">남은 항목:</span>
          {missing.map(f => (
            <span
              key={f.label}
              className="text-[11px] font-medium text-txt-secondary bg-surface-sunken px-2 py-0.5 rounded-full"
            >
              {f.label}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}
