'use client'

import { Check } from 'lucide-react'
import { SOURCE_OPTIONS } from '@/src/lib/onboarding/constants'
import type { ProfileDraft } from '@/src/lib/onboarding/types'
import { OnboardingShell } from '../shell/OnboardingShell'

// 2026-04-23 도입. Draft 는 개인 매칭이 주력이 아니라 클럽 운영 중심 인프라이므로
// "어떻게 오셨어요?" 를 첫 질문으로 두고 이후 단계를 분기한다.
// invite → info 만 묻고 클럽 가입으로
// matching → 기존 4단계 (info → situation → position → interests)
// operator → info 만 묻고 /clubs/new 유도
// exploring → info 만 받고 /explore 로
//
// 2026-04-23 Shell 흡수 — 이전엔 fixed bottom CTA · custom 레이아웃 이었으나
// Shell step 과 나란히 보면 CTA 가 붕 뜨는 문제. stepCount=0 으로 progress 는 숨기되
// 나머지(배경·title 크기·primary 버튼 톤) 는 Shell 표준에 맞춤.

interface SourceStepProps {
  selected: ProfileDraft['source']
  onSelect: (source: ProfileDraft['source']) => void
  onBack: () => void
  onNext: () => void
  errorMsg: string | null
}

export function SourceStep({ selected, onSelect, onBack, onNext, errorMsg }: SourceStepProps) {
  // 방향키로 옵션 이동, 숫자 1~4 로 바로 선택, Enter 로 진행
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIdx = SOURCE_OPTIONS.findIndex(o => o.value === selected)
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      const next = currentIdx < 0 ? 0 : (currentIdx + 1) % SOURCE_OPTIONS.length
      onSelect(SOURCE_OPTIONS[next].value)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const next = currentIdx < 0 ? SOURCE_OPTIONS.length - 1 : (currentIdx - 1 + SOURCE_OPTIONS.length) % SOURCE_OPTIONS.length
      onSelect(SOURCE_OPTIONS[next].value)
    } else if (/^[1-4]$/.test(e.key)) {
      const idx = parseInt(e.key, 10) - 1
      if (SOURCE_OPTIONS[idx]) {
        onSelect(SOURCE_OPTIONS[idx].value)
      }
    } else if (e.key === 'Enter' && selected) {
      e.preventDefault()
      onNext()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onBack()
    }
  }
  return (
    <OnboardingShell
      title="Draft 에 어떻게 오셨습니까?"
      hint="여기에 맞춰 이후 질문 개수와 랜딩 화면이 달라집니다. 나중에도 언제든 프로필에서 바꾸실 수 있습니다."
      stepIndex={0}
      stepCount={0}
      onBack={onBack}
      saveStatus="idle"
      primaryCTA={{ label: '다음', onClick: onNext, disabled: !selected }}
      errorMsg={errorMsg}
      slideKey={0}
      slideDir="forward"
      onKeyDown={handleKeyDown}
      ariaLabel="Draft 에 오신 경로"
    >
      <details className="mb-4 group">
        <summary className="text-[11px] text-txt-tertiary cursor-pointer hover:text-txt-secondary transition-colors inline-flex items-center gap-1 list-none">
          <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
          왜 이걸 먼저 여쭙는지 안내드립니다
        </summary>
        <p className="text-[11px] text-txt-tertiary mt-2 pl-3.5 leading-relaxed break-keep">
          Draft 는 개인 프로필 플랫폼이 아니라 동아리·프로젝트의 운영 기록을 쌓는 도구입니다. 어떤 목적으로 오셨는지에 따라 필요한 정보가 많이 달라서, 불필요한 질문을 건너뛰기 위해 먼저 여쭙습니다.
        </p>
      </details>

      <div role="radiogroup" aria-label="경로 선택" className="space-y-2.5">
        {SOURCE_OPTIONS.map((opt, i) => {
          const active = selected === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${i + 1}번: ${opt.label}. ${opt.desc}`}
              onClick={() => onSelect(opt.value)}
              style={{ ['--stagger' as string]: `${i * 60}ms` }}
              className={`ob-stagger-item ob-press-spring ob-ring-glow w-full text-left rounded-2xl border p-4 ${
                active
                  ? 'bg-brand text-white border-brand'
                  : 'bg-surface-card text-txt-primary border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-[22px] leading-none mt-0.5" aria-hidden="true">
                  {opt.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] font-bold ${active ? 'text-white' : 'text-txt-primary'}`}>
                    {opt.label}
                  </p>
                  <p
                    className={`text-[12px] mt-1 leading-relaxed ${
                      active ? 'text-white/85' : 'text-txt-tertiary'
                    }`}
                  >
                    {opt.desc}
                  </p>
                </div>
                {active && (
                  <Check size={16} className="text-white shrink-0 mt-1" strokeWidth={2.5} />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* 데스크톱 키보드 힌트 — 모바일에선 안 보임 */}
      <p className="hidden md:block text-[11px] text-txt-tertiary mt-6 leading-relaxed">
        <kbd className="px-1.5 py-0.5 bg-surface-sunken rounded border border-border font-mono text-[10px]">1~4</kbd>{' '}
        숫자로 빠르게 선택,{' '}
        <kbd className="px-1.5 py-0.5 bg-surface-sunken rounded border border-border font-mono text-[10px]">↑↓</kbd>{' '}
        이동,{' '}
        <kbd className="px-1.5 py-0.5 bg-surface-sunken rounded border border-border font-mono text-[10px]">Enter</kbd>{' '}
        진행
      </p>
    </OnboardingShell>
  )
}
