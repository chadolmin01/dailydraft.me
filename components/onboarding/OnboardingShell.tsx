'use client'

import React from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import type { Step } from '@/src/lib/onboarding/types'
import { DEEP_CHAT_TOPICS, ONBOARDING_TIPS, STEP_ORDER } from '@/src/lib/onboarding/constants'

// ── Progress Bar ──

function ProgressBar({ step }: { step: Step }) {
  const idx = STEP_ORDER.indexOf(step)
  const pct = Math.round((idx / (STEP_ORDER.length - 1)) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-[5px] bg-surface-sunken border border-border overflow-hidden">
        <div className="h-full bg-brand transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-txt-disabled tabular-nums w-7 text-right">{pct}%</span>
    </div>
  )
}

// ── Deep Chat Transition Overlay ──

function DeepChatTransitionOverlay() {
  return (
    <div className="fixed inset-0 z-50 bg-surface-bg flex flex-col items-center justify-center px-6" style={{ animation: 'ob-bubble-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
      <div className="w-14 h-14 bg-black flex items-center justify-center ob-avatar mb-5">
        <span className="text-white text-lg font-black">D</span>
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <Loader2 size={16} className="animate-spin text-txt-disabled" />
        <span className="text-[14px] font-bold text-txt-primary">AI 분석 세션 준비 중...</span>
      </div>
      <p className="text-[12px] text-txt-tertiary font-mono mb-6">프로필 기반으로 맞춤 질문을 만들고 있어요</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-md w-full">
        {DEEP_CHAT_TOPICS.slice(0, 4).map((topic, i) => {
          const Icon = topic.icon
          return (
            <div key={topic.id} className="ob-chip flex flex-col items-center gap-1.5 px-3 py-2.5 bg-surface-card border border-border text-center" style={{ animationDelay: `${i * 100 + 300}ms` }}>
              <Icon size={14} className="text-txt-disabled" />
              <span className="text-[10px] font-mono text-txt-tertiary">{topic.label}</span>
            </div>
          )
        })}
      </div>
      <p className="text-[10px] text-txt-disabled font-mono mt-4">자유롭게 답하면 돼요 · 2~3분 소요</p>
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
      {/* Logout button */}
      <button
        onClick={onSignOut}
        className="fixed top-4 right-4 z-[60] flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken border border-border transition-colors"
      >
        <LogOut size={12} />
        로그아웃
      </button>

      {/* Deep chat transition overlay */}
      {deepChatTransition && <DeepChatTransitionOverlay />}

      {/* Chat */}
      <div className={`flex-1 flex flex-col min-w-0 transition-opacity duration-500 ${deepChatTransition ? 'opacity-0' : 'opacity-100'}`}>
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-border flex items-center gap-3 bg-surface-card/80 backdrop-blur-md shrink-0">
          <div className="w-9 h-9 bg-black flex items-center justify-center ob-avatar shrink-0">
            <span className="text-white text-sm font-black">D</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[13px] font-bold text-txt-primary leading-none">
              {step === 'deep-chat' ? `Draft AI · 프로필 분석${userMsgCount > 0 ? ` (${userMsgCount}회)` : ''}` : 'Draft AI'}
            </h1>
            <p className="text-[11px] text-status-success-text font-medium mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-status-success-text inline-block" />
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
