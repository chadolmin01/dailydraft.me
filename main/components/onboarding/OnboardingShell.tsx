'use client'

import React, { useState, useEffect } from 'react'
import { LogOut, CheckCircle2, MessageSquare, Sparkles, ArrowRight } from 'lucide-react'
import type { Step } from '@/src/lib/onboarding/types'
import { ONBOARDING_TIPS, STEP_ORDER } from '@/src/lib/onboarding/constants'

// ── Progress Bar ──

function ProgressBar({ step }: { step: Step }) {
  const idx = STEP_ORDER.indexOf(step)
  const total = STEP_ORDER.length - 1
  const pct = Math.round((idx / total) * 100)
  const stepNum = Math.min(idx + 1, total)
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-txt-tertiary tabular-nums hidden sm:block">{stepNum}/{total}</span>
      <div className="w-16 h-[5px] bg-surface-sunken rounded-xl border border-border overflow-hidden">
        <div className="h-full bg-brand transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-txt-disabled tabular-nums w-7 text-right">{pct}%</span>
    </div>
  )
}

// ── Deep Chat Transition Overlay ──

const TRANSITION_STEPS = [
  { label: '기본 프로필 완료', done: true },
  { label: 'AI 맞춤 질문 생성 중', done: false, active: true },
  { label: '프로필 분석 & 매칭 준비', done: false },
]

const TRANSITION_TIPS = [
  { icon: MessageSquare, text: '2~3분 자유롭게 대화하면 끝나요' },
  { icon: Sparkles, text: 'AI 대화를 완료하면 매칭 정확도가 40% 올라가요' },
  { icon: CheckCircle2, text: '정답은 없어요. 편하게 답하면 돼요' },
]

function DeepChatTransitionOverlay() {
  const [tipIdx, setTipIdx] = useState(0)
  const [progressWidth, setProgressWidth] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setProgressWidth(66), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIdx(prev => (prev + 1) % TRANSITION_TIPS.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-surface-bg flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div
        className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-8"
        style={{ animation: 'dcto-logo 0.6s cubic-bezier(0.16, 1, 0.3, 1) both' }}
      >
        <span className="text-white text-xl font-black">D</span>
      </div>

      {/* Progress Steps */}
      <div className="flex flex-col gap-3 mb-8 w-full max-w-xs">
        {TRANSITION_STEPS.map((step, i) => (
          <div
            key={i}
            className="flex items-center gap-3"
            style={{ animation: 'dcto-step 0.5s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: `${i * 150 + 200}ms` }}
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-500 ${
              step.done ? 'bg-black border-surface-inverse' : step.active ? 'bg-white border-surface-inverse' : 'bg-surface-sunken border-border'
            }`}>
              {step.done ? (
                <CheckCircle2 size={14} className="text-white" />
              ) : step.active ? (
                <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-border" />
              )}
            </div>
            <span className={`text-[13px] font-medium ${
              step.done ? 'text-txt-primary line-through decoration-txt-disabled' : step.active ? 'text-txt-primary font-bold' : 'text-txt-disabled'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div
        className="w-full max-w-xs mb-8"
        style={{ animation: 'dcto-step 0.5s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: '700ms' }}
      >
        <div className="h-1 bg-surface-sunken rounded-xl border border-border overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-[1.5s] ease-out"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] font-mono text-txt-disabled">기본 정보</span>
          <span className="text-[10px] font-mono text-txt-primary font-bold">AI 대화</span>
          <span className="text-[10px] font-mono text-txt-disabled">완료</span>
        </div>
      </div>

      {/* Rotating Tips */}
      <div
        className="w-full max-w-xs bg-surface-card rounded-xl border border-border px-4 py-3 mb-6"
        style={{ animation: 'dcto-step 0.5s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: '900ms' }}
      >
        {TRANSITION_TIPS.map((tip, i) => {
          const Icon = tip.icon
          return (
            <div
              key={i}
              className={`flex items-center gap-2.5 transition-all duration-300 ${i === tipIdx ? 'opacity-100' : 'hidden'}`}
            >
              <Icon size={14} className="text-brand shrink-0" />
              <span className="text-[12px] text-txt-secondary">{tip.text}</span>
            </div>
          )
        })}
        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-2.5">
          {TRANSITION_TIPS.map((_, i) => (
            <div key={i} className={`w-1 h-1 rounded-full transition-all duration-300 ${i === tipIdx ? 'bg-black w-3' : 'bg-border'}`} />
          ))}
        </div>
      </div>

      {/* CTA hint */}
      <div
        className="flex items-center gap-2 text-txt-tertiary"
        style={{ animation: 'dcto-step 0.5s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: '1100ms' }}
      >
        <span className="text-[11px] font-mono">잠시 후 대화가 시작돼요</span>
        <ArrowRight size={12} className="animate-[dcto-arrow_1s_ease-in-out_infinite]" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dcto-logo {
          0% { opacity:0; transform: scale(0.5) rotate(-8deg); }
          100% { opacity:1; transform: scale(1) rotate(0deg); }
        }
        @keyframes dcto-step {
          0% { opacity:0; transform: translateY(12px); }
          100% { opacity:1; transform: translateY(0); }
        }
        @keyframes dcto-arrow {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
      `}} />
    </div>
  )
}

// ── Shell ──

interface OnboardingShellProps {
  step: Step
  userMsgCount: number
  tipIndex: number
  mounted: boolean
  deepChatTransition: boolean
  onSignOut: () => void
  children: React.ReactNode
  footer: React.ReactNode
  sidebar: React.ReactNode
}

export const OnboardingShell: React.FC<OnboardingShellProps> = ({
  step, userMsgCount, tipIndex, mounted, deepChatTransition,
  onSignOut, children, footer, sidebar,
}) => {
  return (
    <div className={`fixed inset-0 bg-surface-bg flex transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Deep chat transition overlay */}
      {deepChatTransition && <DeepChatTransitionOverlay />}

      {/* Chat */}
      <div className={`flex-1 flex flex-col min-w-0 transition-opacity duration-500 ${deepChatTransition ? 'opacity-0' : 'opacity-100'}`}>
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-border flex items-center gap-3 bg-surface-card/80 backdrop-blur-md shrink-0">
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center ob-avatar shrink-0">
            <span className="text-white text-sm font-black">D</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[13px] font-bold text-txt-primary leading-none">
              {step === 'deep-chat' ? `Draft AI · 프로필 분석${userMsgCount > 0 ? ` (${userMsgCount}회)` : ''}` : 'Draft AI'}
            </h1>
            <p className="text-[11px] text-status-success-text font-medium mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-status-success-text rounded-full inline-block" />
              온라인
            </p>
          </div>
          <ProgressBar step={step} />
        </div>

        {/* Rotating Tip */}
        {step !== 'done' && (
          <div className="flex justify-center py-2 shrink-0 border-b border-border bg-surface-sunken/50">
            <p className="text-[10px] font-mono text-txt-tertiary animate-in fade-in slide-in-from-bottom-1 duration-500" key={tipIndex}>
              <span className="font-bold text-brand mr-1">tip:</span>
              <span className="animate-[typing_0.6s_steps(30)_both] inline-block overflow-hidden whitespace-nowrap">{ONBOARDING_TIPS[tipIndex]}</span>
            </p>
          </div>
        )}

        {/* Messages area */}
        {children}

        {/* Footer */}
        {footer}
      </div>

      {/* Preview sidebar */}
      {sidebar}
    </div>
  )
}
