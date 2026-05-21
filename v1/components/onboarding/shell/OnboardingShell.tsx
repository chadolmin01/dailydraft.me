'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { SaveIndicator } from '../parts/SaveIndicator'

// 온보딩 step 화면의 공통 레이아웃 — progress bar + title/hint + content + next button.
// info/situation/position/interests 등 표준 step 4개가 이 Shell 을 사용.
// milestone 성 화면 (intro/source/recovery/transition/post-basic) 은 별도 레이아웃을 가짐.
//
// 이 Shell 의 책임:
//   - 최상위 fixed inset-0 + ob-atmos 배경
//   - 상단 progress bar 영역 (뒤로가기 + 저장상태 + 카운트 + 건너뛰기 + 세그먼트 bar)
//   - 중앙 스크롤 영역 (title + hint + children + slide 애니메이션)
//   - 하단 next button 영역 (error 메시지 + 다음 버튼)
//
// Shell 이 통제 안 하는 것: 스텝 내부 입력 UI, 라우팅, validation, analytics.

export interface OnboardingShellProps {
  // 헤더
  title: string
  hint?: string

  // Progress — stepCount=0 이면 progress bar/카운트 숨김 (source 처럼 "분기 결정" 단계 용).
  stepIndex: number   // 0-based
  stepCount: number

  // 네비게이션
  onBack: () => void
  onSkip?: () => void
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'

  // 기본 CTA (다음 버튼)
  primaryCTA: {
    label: string
    onClick: () => void
    disabled?: boolean
  }
  errorMsg?: string | null

  // Slide 애니메이션 — step 전환 시 forward/back 방향으로 재트리거
  slideKey: number
  slideDir: 'forward' | 'back'

  // 키보드 처리 (Enter 로 진행 등) — 호출자가 canProceed 등 판단 필요
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void

  ariaLabel?: string

  children: React.ReactNode
}

export function OnboardingShell({
  title,
  hint,
  stepIndex,
  stepCount,
  onBack,
  onSkip,
  saveStatus,
  primaryCTA,
  errorMsg,
  slideKey,
  slideDir,
  onKeyDown,
  ariaLabel,
  children,
}: OnboardingShellProps) {
  return (
    <div
      role="form"
      aria-label={ariaLabel ?? `온보딩 — ${title}`}
      onKeyDown={onKeyDown}
      className="fixed inset-0 ob-atmos flex flex-col"
    >
      {/* 단계 변경 시 스크린리더 공지 */}
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {stepCount > 0
          ? `${stepIndex + 1}단계 중 ${stepCount}단계: ${title}`
          : title}
      </span>

      {/* ── Progress bar ── */}
      {/* stepCount=0 일 때도 "뒤로가기" 한 줄만은 유지. source 단계처럼 아직 분기 전인 화면 용. */}
      <div className="px-6 sm:px-10 pt-8 pb-4 shrink-0">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-txt-secondary hover:text-txt-primary hover:bg-surface-sunken transition-colors shrink-0"
              aria-label="이전"
            >
              <ArrowLeft size={15} />
            </button>
            {stepCount > 0 && (
              <div className="flex items-center gap-3">
                <SaveIndicator status={saveStatus} />
                <span className="text-[12px] font-mono text-txt-secondary tabular-nums">
                  {stepIndex + 1} <span className="text-txt-tertiary">/ {stepCount}</span>
                </span>
                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="text-[12px] text-txt-tertiary hover:text-txt-secondary transition-colors"
                  >
                    건너뛰기
                  </button>
                )}
              </div>
            )}
          </div>
          {stepCount > 0 && (
            <div
              className="ob-progress-container flex gap-1.5"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={stepCount}
              aria-valuenow={stepIndex + 1}
            >
              {Array.from({ length: stepCount }).map((_, i) => {
                const isDone = i < stepIndex
                const isCurrent = i === stepIndex
                return (
                  <div key={i} className="flex-1 h-[5px] rounded-full overflow-hidden bg-surface-sunken">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        isDone ? 'bg-surface-inverse w-full' : isCurrent ? 'bg-brand ob-progress-active' : 'w-0'
                      }`}
                      style={isCurrent ? { width: '100%', animation: 'segment-fill 0.6s cubic-bezier(0.16, 1, 0.3, 1) both' } : undefined}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Content (slide) ── */}
      <div
        key={slideKey}
        className={`flex-1 flex flex-col min-h-0 overflow-y-auto ${
          slideDir === 'back' ? 'ob-slide-back' : 'ob-slide-forward'
        }`}
      >
        <div className="max-w-2xl mx-auto w-full px-6 pt-2 pb-8 flex flex-col flex-1">
          <h2 className="text-2xl sm:text-[28px] font-black text-txt-primary leading-snug shrink-0 ob-title-rise">
            {title}
          </h2>
          {hint && (
            <p
              className="text-[12px] font-medium text-txt-secondary mt-2 shrink-0 ob-stagger-item"
              style={{ ['--stagger' as string]: '80ms' }}
            >
              {hint}
            </p>
          )}
          <div
            className="flex-1 mt-6 ob-stagger-item"
            style={{ ['--stagger' as string]: '140ms' }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* ── Next button ── */}
      <div className="px-6 pb-8 pt-2 shrink-0">
        <div className="max-w-2xl mx-auto">
          {errorMsg && (
            <p className="text-[12px] text-status-danger-text text-center mb-2 font-medium animate-in fade-in slide-in-from-bottom-1 duration-200">
              {errorMsg}
            </p>
          )}
          <button
            onClick={primaryCTA.onClick}
            disabled={primaryCTA.disabled}
            className={`ob-press-spring w-full flex items-center justify-center gap-2 py-4 rounded-full text-[14px] font-black ${
              !primaryCTA.disabled
                ? 'bg-surface-inverse text-white hover:opacity-90 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.3)]'
                : 'bg-surface-sunken text-txt-disabled cursor-not-allowed'
            }`}
          >
            {primaryCTA.label}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
