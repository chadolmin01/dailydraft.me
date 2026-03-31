'use client'

import React from 'react'
import { ArrowRight, MessageCircle } from 'lucide-react'

// ── Deep Chat Offer ──

interface DeepChatOfferStepProps {
  onAccept: () => void
  onSkip: () => void
}

export const DeepChatOfferStep: React.FC<DeepChatOfferStepProps> = ({ onAccept, onSkip }) => {
  return (
    <div className="mt-3 space-y-2">
      <button onClick={onAccept} className="ob-chip ob-hover w-full text-left px-4 py-3.5 bg-brand text-white rounded-xl border border-brand hover:opacity-90 active:scale-[0.97] transition-all" style={{ animationDelay: '0ms' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
            <MessageCircle size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold">AI와 대화하기</div>
            <div className="text-[11px] text-white/70 mt-0.5 font-mono">2~3분 · 매칭 정확도 +40%</div>
          </div>
          <ArrowRight size={14} className="text-white/50 shrink-0" />
        </div>
      </button>
      <button onClick={onSkip} className="ob-chip ob-hover w-full text-left px-4 py-3 bg-surface-card rounded-xl border border-border hover:border-border transition-all" style={{ animationDelay: '80ms' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-surface-sunken rounded-lg flex items-center justify-center shrink-0">
            <ArrowRight size={14} className="text-txt-disabled" />
          </div>
          <div>
            <div className="text-[13px] font-bold text-txt-primary">건너뛰고 시작하기</div>
            <div className="text-[11px] text-txt-tertiary mt-0.5 font-mono">나중에 프로필에서 가능</div>
          </div>
        </div>
      </button>
    </div>
  )
}

// ── Early Finish Prompt (shown during deep-chat when user has < 3 messages) ──

interface DeepChatOfferFinishStepProps {
  onContinue: () => void
  onFinish: () => void
}

export const DeepChatOfferFinishStep: React.FC<DeepChatOfferFinishStepProps> = ({ onContinue, onFinish }) => {
  return (
    <div className="mt-3 space-y-2">
      <button onClick={onContinue} className="ob-chip ob-hover w-full text-left px-4 py-2.5 bg-brand text-white rounded-xl border border-brand hover:opacity-90 active:scale-[0.97] transition-all text-[13px] font-bold" style={{ animationDelay: '0ms' }}>
        조금 더 대화하기
      </button>
      <button onClick={onFinish} className="ob-chip ob-hover w-full text-left px-4 py-2.5 bg-surface-card rounded-xl border border-border hover:border-border transition-all text-[13px] font-bold text-txt-primary" style={{ animationDelay: '60ms' }}>
        지금 마무리하기
      </button>
    </div>
  )
}
