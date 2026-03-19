'use client'

import React from 'react'
import { ArrowRight, Send, Sparkles, X } from 'lucide-react'
import { POPULAR_SKILLS } from '@/src/lib/onboarding/constants'

// ── Skills Input ──

interface SkillsInputStepProps {
  skillInput: string
  skills: string[]
  onSkillInputChange: (v: string) => void
  onToggleSkill: (skill: string) => void
  onRemoveSkill: (skill: string) => void
  onSubmit: () => void
}

export const SkillsInputStep: React.FC<SkillsInputStepProps> = ({
  skillInput, skills, onSkillInputChange, onToggleSkill, onRemoveSkill, onSubmit,
}) => {
  return (
    <div className="mt-3 bg-surface-card border border-border-strong p-4 shadow-sharp space-y-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Sparkles size={10} className="text-brand" />
        <span className="text-[10px] font-mono font-medium text-brand">AI가 자동으로 정리해드려요</span>
      </div>
      <div className="relative">
        <input
          type="text"
          value={skillInput}
          onChange={(e) => onSkillInputChange(e.target.value)}
          placeholder="예: 리액트, 파이썬, 피그마 등"
          className="w-full pl-3.5 pr-10 py-2.5 bg-surface-card border border-border-strong text-sm font-medium focus:outline-none focus:border-black focus:bg-white transition-all placeholder:text-txt-tertiary"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        />
        <button onClick={onSubmit} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-txt-secondary hover:text-black transition-colors">
          <Send size={15} />
        </button>
      </div>
      <div>
        <p className="text-[10px] font-bold text-txt-tertiary uppercase tracking-wider mb-2 font-mono">빠른 선택</p>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_SKILLS.map((skill, idx) => (
            <button
              key={skill}
              onClick={() => onToggleSkill(skill)}
              className={`ob-chip ob-hover px-3 py-1.5 text-[12px] font-medium border transition-all ${
                skills.includes(skill)
                  ? 'bg-black text-white border-black'
                  : 'bg-surface-card text-txt-primary border-border-strong hover:bg-black hover:text-white'
              }`}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {skills.map(s => (
            <span key={s} className="ob-tag-pop inline-flex items-center gap-1 px-2.5 py-1 bg-brand text-white text-[11px] font-medium">
              {s}
              <button onClick={() => onRemoveSkill(s)} className="hover:text-white/60 transition-colors"><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
      <button onClick={onSubmit} className="w-full py-2.5 bg-brand text-white text-[13px] font-bold hover:bg-brand-hover transition-all flex items-center justify-center gap-2 ob-hover shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] border border-brand">
        {skillInput.trim() || skills.length > 0 ? '다음' : '건너뛰기'} <ArrowRight size={14} />
      </button>
    </div>
  )
}

// ── Skills Confirm ──

interface SkillsConfirmStepProps {
  skills: string[]
  onRemoveSkill: (skill: string) => void
  onConfirm: () => void
}

export const SkillsConfirmStep: React.FC<SkillsConfirmStepProps> = ({
  skills, onRemoveSkill, onConfirm,
}) => {
  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill, idx) => (
          <span key={skill} className="ob-chip inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-[13px] font-medium" style={{ animationDelay: `${idx * 40}ms` }}>
            {skill}
            <button onClick={() => onRemoveSkill(skill)} className="hover:text-white/60 transition-colors"><X size={13} /></button>
          </span>
        ))}
      </div>
      <button onClick={onConfirm} className="ob-hover px-5 py-2 bg-black text-white text-[13px] font-bold flex items-center gap-2 shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
        {skills.length > 0 ? '확인' : '건너뛰기'} <ArrowRight size={14} />
      </button>
    </div>
  )
}
