'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'

interface GreetingStepProps {
  onCtaClick: () => void
}

export const GreetingStep: React.FC<GreetingStepProps> = ({ onCtaClick }) => {
  return (
    <div className="mt-3">
      <button onClick={onCtaClick} className="ob-cta ob-hover inline-flex items-center gap-2.5 px-6 py-3 bg-brand text-white text-[13px] font-bold hover:opacity-90 active:scale-[0.97] border border-brand">
        프로필 입력하기 <ArrowRight size={15} />
      </button>
      <p className="text-[11px] text-txt-tertiary mt-2.5 ml-1 font-mono">기본 정보만 입력하면 바로 시작할 수 있어요</p>
    </div>
  )
}
