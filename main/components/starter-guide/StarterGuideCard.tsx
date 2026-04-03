'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import type { StarterStep } from '@/src/hooks/useStarterGuide'

interface StarterGuideCardProps {
  steps: StarterStep[]
  completedCount: number
  total: number
  showLinkHint: boolean
  onSoftDismiss: () => void
  onPermanentDismiss: () => void
}

export function StarterGuideCard({
  steps,
  completedCount,
  total,
  showLinkHint,
  onSoftDismiss,
  onPermanentDismiss,
}: StarterGuideCardProps) {
  const [confirmDismiss, setConfirmDismiss] = useState(false)
  const pct = Math.round((completedCount / total) * 100)

  // ── Confirm dismiss view ──
  if (confirmDismiss) {
    return (
      <div className="border border-border bg-surface-card rounded-2xl shadow-xl overflow-hidden">
        <div className="px-4 py-4 sm:px-5 sm:py-5 space-y-3">
          <p className="text-[12px] sm:text-[13px] text-txt-secondary leading-relaxed">
            프로필을 완성하면 팀 매칭 정확도가 높아져요.
            <br />
            시작 가이드는 <span className="font-semibold text-txt-primary">도움말(?)</span>에서 다시 볼 수 있어요.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmDismiss(false)}
              className="px-3 py-1.5 text-xs font-bold text-txt-secondary bg-surface-sunken border border-border rounded-xl hover:bg-surface-card transition-colors"
            >
              돌아가기
            </button>
            <button
              onClick={() => {
                onPermanentDismiss()
                toast.success('시작 가이드를 닫았습니다')
              }}
              className="px-3 py-1.5 text-xs font-bold text-txt-disabled hover:text-txt-secondary transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main card ──
  return (
    <div className="border border-border bg-surface-card rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-brand flex items-center justify-center shrink-0">
              <span className="text-white text-[0.5rem] font-bold font-mono">G</span>
            </div>
            <span className="text-[10px] font-mono font-medium text-txt-tertiary uppercase tracking-wider">
              Start Guide
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-txt-tertiary">
            {completedCount}/{total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 sm:h-1.5 bg-surface-sunken rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="px-3 sm:px-4 pb-2 sm:pb-3 space-y-0 sm:space-y-1">
        {steps.map((step, i) => {
          const isNext = !step.done && steps.slice(0, i).every(s => s.done)
          return (
            <React.Fragment key={step.id}>
              <StepRow step={step} index={i} isNext={isNext} />
              {/* Bonus hint: link nudge after profile step (desktop only) */}
              {step.id === 'profile' && step.done && showLinkHint && (
                <Link
                  href="/profile"
                  className="hidden sm:flex items-center gap-1.5 ml-8 py-1 group/hint"
                >
                  <span className="text-[11px] text-txt-tertiary group-hover/hint:text-txt-secondary transition-colors">
                    💡 포트폴리오·GitHub 링크를 추가하면 신뢰도가 올라가요
                  </span>
                  <ArrowRight size={10} className="text-txt-disabled group-hover/hint:text-txt-tertiary transition-colors" />
                </Link>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Footer: dismiss actions */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0.5 flex items-center justify-center gap-3">
        <button
          onClick={onSoftDismiss}
          className="text-[11px] sm:text-xs text-txt-disabled hover:text-txt-secondary transition-colors"
        >
          나중에 하기
        </button>
        <span className="text-txt-disabled text-[10px]">·</span>
        <button
          onClick={() => setConfirmDismiss(true)}
          className="text-[11px] sm:text-xs text-txt-disabled hover:text-txt-secondary transition-colors"
        >
          다시 안 보기
        </button>
      </div>
    </div>
  )
}

// ── Step row ──
function StepRow({ step, index, isNext }: { step: StarterStep; index: number; isNext: boolean }) {
  const num = String(index + 1).padStart(2, '0')

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 py-1.5 sm:py-2">
      {/* Circle / Check */}
      {step.done ? (
        <div className="w-5 h-5 bg-brand rounded-full flex items-center justify-center shrink-0">
          <Check size={12} className="text-white" strokeWidth={3} />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center shrink-0">
          <span className="text-[9px] font-mono font-bold text-txt-disabled">{num}</span>
        </div>
      )}

      {/* Label + desc */}
      <div className="flex-1 min-w-0">
        <p className={`text-[12px] sm:text-[13px] font-medium leading-tight ${step.done ? 'text-txt-tertiary' : 'text-txt-primary'}`}>
          {step.label}
        </p>
        {!step.done && (
          <p className="text-[10px] sm:text-[11px] text-txt-disabled mt-0.5 hidden sm:block">{step.desc}</p>
        )}
      </div>

      {/* CTA or status */}
      {step.done ? (
        <span className="text-[10px] sm:text-[11px] font-medium text-brand shrink-0">완료</span>
      ) : isNext ? (
        step.href ? (
          <Link
            href={step.href}
            className="shrink-0 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-txt-secondary hover:text-txt-primary transition-colors"
          >
            시작하기 <ArrowRight size={12} />
          </Link>
        ) : (
          <span className="text-[10px] sm:text-[11px] text-txt-tertiary shrink-0">아래에서 클릭 ↓</span>
        )
      ) : null}
    </div>
  )
}
