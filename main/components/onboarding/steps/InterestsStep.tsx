'use client'

import React from 'react'
import { ArrowRight, Send, Sparkles, X } from 'lucide-react'
import { INTEREST_OPTIONS } from '@/src/lib/onboarding/constants'

// ── Interests Input ──

interface InterestsInputStepProps {
  interestInput: string
  interests: string[]
  onInterestInputChange: (v: string) => void
  onToggleInterest: (tag: string) => void
  onRemoveInterest: (tag: string) => void
  onSubmit: () => void
}

export const InterestsInputStep: React.FC<InterestsInputStepProps> = ({
  interestInput, interests, onInterestInputChange, onToggleInterest, onRemoveInterest, onSubmit,
}) => {
  return (
    <div className="mt-3 bg-surface-card rounded-xl border border-border p-4 shadow-md space-y-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Sparkles size={10} className="text-brand" />
        <span className="text-[10px] font-mono font-medium text-brand">AI가 자동으로 정리해드려요</span>
      </div>
      <div className="relative">
        <input
          type="text"
          value={interestInput}
          onChange={(e) => onInterestInputChange(e.target.value)}
          placeholder="예: AI, 게임, 교육 등"
          className="w-full pl-3.5 pr-10 py-2.5 bg-surface-card rounded-lg border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-surface-inverse focus:bg-white transition-all placeholder:text-txt-tertiary"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        />
        <button onClick={onSubmit} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-txt-secondary hover:text-black transition-colors">
          <Send size={15} />
        </button>
      </div>
      <div>
        <p className="text-[10px] font-medium text-txt-tertiary mb-2">빠른 선택</p>
        <div className="flex flex-wrap gap-1.5">
          {INTEREST_OPTIONS.map((tag, idx) => (
            <button
              key={tag}
              onClick={() => onToggleInterest(tag)}
              className={`ob-chip ob-hover px-3 py-1.5 text-[12px] font-medium border rounded-full transition-all ${
                interests.includes(tag)
                  ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                  : 'bg-surface-card text-txt-primary border-border hover:bg-black hover:text-white'
              }`}
              style={{ animationDelay: `${idx * 25}ms` }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      {interests.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {interests.map(t => (
            <span key={t} className="ob-tag-pop inline-flex items-center gap-1 px-2.5 py-1 bg-brand text-white text-[11px] font-medium rounded-full">
              {t}
              <button onClick={() => onRemoveInterest(t)} className="hover:text-white/60 transition-colors p-2 sm:p-0 -m-1 sm:m-0"><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
      <button onClick={onSubmit} className="w-full py-2.5 bg-brand text-white text-[13px] font-bold rounded-xl hover:bg-brand-hover transition-all flex items-center justify-center gap-2 ob-hover hover:opacity-90 active:scale-[0.97] border border-brand">
        {interestInput.trim() || interests.length > 0 ? '다음' : '건너뛰기'} <ArrowRight size={14} />
      </button>
    </div>
  )
}

// ── Interests Confirm ──

interface InterestsConfirmStepProps {
  interests: string[]
  onRemoveInterest: (tag: string) => void
  onConfirm: () => void
}

export const InterestsConfirmStep: React.FC<InterestsConfirmStepProps> = ({
  interests, onRemoveInterest, onConfirm,
}) => {
  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {interests.map((tag, idx) => (
          <span key={tag} className="ob-chip inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-[13px] font-medium rounded-full" style={{ animationDelay: `${idx * 40}ms` }}>
            {tag}
            <button onClick={() => onRemoveInterest(tag)} className="hover:text-white/60 transition-colors"><X size={13} /></button>
          </span>
        ))}
      </div>
      <button onClick={onConfirm} className="ob-hover px-5 py-2 bg-surface-inverse text-txt-inverse text-[13px] font-bold rounded-xl flex items-center gap-2 hover:opacity-90 active:scale-[0.97]">
        확인 <ArrowRight size={14} />
      </button>
    </div>
  )
}
