'use client'

import React, { useState } from 'react'
import { Sparkles, Check, X } from 'lucide-react'
import { SpectrumPick } from '@/components/onboarding/interactive/SpectrumPick'
import { EmojiGrid } from '@/components/onboarding/interactive/EmojiGrid'
import { INTERACTIVE_QUESTIONS } from '@/src/lib/onboarding/interactive-questions'
import { pickPromptForSlot, type MicroPromptEntry } from '@/src/lib/onboarding/micro-prompt-pool'
import { useMicroPrompt } from '@/src/hooks/useMicroPrompt'
import { trackOnboardingEvent } from '@/src/lib/onboarding/analytics'
import type {
  SpectrumPickQuestion,
  EmojiGridQuestion,
  EmojiGridOption,
} from '@/src/lib/onboarding/types'

type Slot = 'sidebar' | 'popup' | 'inline'

interface Props {
  slot: Slot
  /** 닫기 버튼 노출 여부 */
  dismissible?: boolean
  /** 응답 저장 후 호출 */
  onComplete?: () => void
  /** 사용자가 닫기 눌렀을 때 호출 */
  onDismiss?: () => void
  className?: string
}

/**
 * `<MicroPromptCard>` — Ambient 지점에 끼워 넣는 1문항 위젯.
 *
 * 특징:
 *   - 아직 답하지 않은 질문만 자동 선별 (`useMicroPrompt.shouldShow`)
 *   - spectrum-pick 또는 emoji-grid 위젯만 지원 (컴팩트)
 *   - 저장 성공 시 "저장되었습니다" 배지로 잠깐 바뀐 뒤 onComplete 호출
 *   - 실패는 조용히 무시 (UX 영향 0)
 *   - PostHog 이벤트 전송 (확장된 funnel 추적)
 */
export function MicroPromptCard({
  slot,
  dismissible = true,
  onComplete,
  onDismiss,
  className = '',
}: Props) {
  const { shouldShow, submit, state } = useMicroPrompt()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [dismissedLocal, setDismissedLocal] = useState(false)

  if (!state.loaded || dismissedLocal) return null

  // 적합한 질문 고르기
  const entry: MicroPromptEntry | null = pickPromptForSlot(slot, state.answered)
  if (!entry) return null
  if (!shouldShow(entry.interactiveId)) return null

  const question = INTERACTIVE_QUESTIONS[entry.interactiveId]
  if (!question) return null

  const handleSubmit = async (response: unknown) => {
    if (submitted || submitting) return
    setSubmitting(true)
    trackOnboardingEvent('onboarding_step_completed', {
      step: `micro_prompt:${entry.interactiveId}`,
      value: typeof response === 'number' || typeof response === 'string' ? response : null,
    })
    await submit(entry.interactiveId, response, slot)
    setSubmitting(false)
    setSubmitted(true)
    // 1.2초 뒤 자동 페이드 아웃 → parent 에 complete 전달
    setTimeout(() => {
      onComplete?.()
    }, 1200)
  }

  const handleDismiss = () => {
    trackOnboardingEvent('onboarding_step_skipped', {
      step: `micro_prompt:${entry.interactiveId}`,
    })
    setDismissedLocal(true)
    onDismiss?.()
  }

  // 컴팩트 래핑
  return (
    <div
      className={`relative bg-surface-card border border-border rounded-2xl p-5 transition-all duration-300 ${
        submitted ? 'opacity-60' : ''
      } ${className}`}
      role="region"
      aria-label="매칭 정확도 향상 질문"
    >
      {/* 상단 헤더 */}
      <div className="flex items-start gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg bg-brand-bg flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={13} className="text-brand" strokeWidth={2.2} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-semibold text-brand uppercase tracking-wider">
              매칭 정확도 +1
            </p>
            {dismissible && !submitted && (
              <button
                type="button"
                onClick={handleDismiss}
                className="w-6 h-6 -mt-1 -mr-1 flex items-center justify-center text-txt-tertiary hover:text-txt-secondary hover:bg-surface-sunken rounded-lg transition-colors"
                aria-label="이 질문 닫기"
                title="지금 답하지 않으시려면 닫기"
              >
                <X size={13} aria-hidden="true" />
              </button>
            )}
          </div>
          <p className="text-[14px] font-bold text-txt-primary mt-0.5 leading-snug break-keep">
            {entry.prompt}
          </p>
        </div>
      </div>

      {/* 위젯 */}
      {!submitted ? (
        <div aria-live="polite">
          {question.type === 'spectrum-pick' && (
            <SpectrumPick
              leftLabel={(question as SpectrumPickQuestion).leftLabel}
              leftDescription={(question as SpectrumPickQuestion).leftDescription}
              rightLabel={(question as SpectrumPickQuestion).rightLabel}
              rightDescription={(question as SpectrumPickQuestion).rightDescription}
              points={(question as SpectrumPickQuestion).points}
              comments={(question as SpectrumPickQuestion).comments}
              onChange={(value: number, ready: boolean) => {
                if (ready) handleSubmit(value)
              }}
            />
          )}
          {question.type === 'emoji-grid' && (
            <EmojiGrid
              options={(question as EmojiGridQuestion).options as EmojiGridOption[]}
              minSelect={(question as EmojiGridQuestion).minSelect}
              maxSelect={(question as EmojiGridQuestion).maxSelect}
              onChange={(selected: EmojiGridOption[], ready: boolean) => {
                if (ready) handleSubmit(selected.map(o => o.id))
              }}
            />
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 py-4 justify-center text-brand">
          <Check size={16} strokeWidth={2.4} aria-hidden="true" />
          <span className="text-[13px] font-semibold">저장되었습니다. 감사합니다.</span>
        </div>
      )}

      {/* 왜 이 질문을? */}
      <details className="mt-3 group">
        <summary className="text-[11px] text-txt-tertiary cursor-pointer hover:text-txt-secondary list-none inline-flex items-center gap-1">
          <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
          왜 이 질문을 드리나요?
        </summary>
        <p className="text-[11px] text-txt-tertiary mt-2 pl-3.5 leading-relaxed break-keep">
          {entry.why} 건너뛰시거나 나중에 답하셔도 됩니다.
        </p>
      </details>
    </div>
  )
}
