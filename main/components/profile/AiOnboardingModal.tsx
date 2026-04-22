'use client'

import { Sparkles, X } from 'lucide-react'

interface AiOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function AiOnboardingModal({ isOpen, onClose, onConfirm }: AiOnboardingModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[401] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-surface-card rounded-xl border border-border shadow-xl max-w-sm w-full animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-surface-inverse rounded-xl flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-txt-primary">AI 매칭 분석 시작</p>
              <p className="text-[11px] text-txt-tertiary">온보딩 화면으로 이동합니다</p>
            </div>
            <button onClick={onClose} className="ml-auto p-1.5 text-txt-disabled hover:text-txt-secondary transition-colors rounded-lg hover:bg-surface-sunken" aria-label="닫기">
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-txt-secondary leading-relaxed">
            AI 와 짧게 대화하시면 작업 스타일과 성향을 분석해 더 정확한 팀 매칭이 가능합니다. 약 2분 정도 소요되며, 기존 프로필 정보는 유지됩니다.
          </p>
        </div>
        <div className="flex items-center gap-2 px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-xs font-bold text-txt-secondary border border-border rounded-xl hover:bg-surface-sunken transition-colors"
          >
            다음에 할게요
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-surface-inverse rounded-xl hover:bg-brand transition-colors"
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  )
}
