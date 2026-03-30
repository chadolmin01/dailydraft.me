'use client'

import React, { useState } from 'react'
import {
  CheckCircle2,
  MessageSquare,
  User,
  X,
  ExternalLink,
  Sparkles,
  ChevronRight,
} from 'lucide-react'

// Badge to show that content came from Idea Validator
interface ValidationSourceBadgeProps {
  source: 'idea-validator' | 'vc-feedback' | 'developer-feedback' | 'designer-feedback'
  score?: number
  timestamp?: string
  compact?: boolean
  onClick?: () => void
}

export const ValidationSourceBadge: React.FC<ValidationSourceBadgeProps> = ({
  source,
  score,
  timestamp,
  compact = false,
  onClick,
}) => {
  const sourceConfig = {
    'idea-validator': {
      label: 'Idea Validator',
      icon: <Sparkles size={compact ? 10 : 12} />,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    'vc-feedback': {
      label: 'VC 피드백',
      icon: <User size={compact ? 10 : 12} />,
      color: 'bg-status-success-bg text-status-success-text border-status-success-text/20',
    },
    'developer-feedback': {
      label: '개발자 피드백',
      icon: <User size={compact ? 10 : 12} />,
      color: 'bg-status-info-bg text-status-info-text border-status-info-text/20',
    },
    'designer-feedback': {
      label: '디자이너 피드백',
      icon: <User size={compact ? 10 : 12} />,
      color: 'bg-pink-50 text-pink-700 border-pink-200',
    },
  }

  const config = sourceConfig[source]

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 border text-[0.625rem] font-medium transition-colors hover:opacity-80 ${config.color}`}
      >
        {config.icon}
        {config.label}
        {score !== undefined && (
          <span className="ml-1 font-bold">{score}</span>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 border text-xs font-medium transition-all hover:shadow-md ${config.color}`}
    >
      {config.icon}
      <span>{config.label}</span>
      {score !== undefined && (
        <>
          <span className="text-txt-disabled">|</span>
          <span className="font-bold">{score}점</span>
        </>
      )}
      {timestamp && (
        <>
          <span className="text-txt-disabled">|</span>
          <span className="opacity-70 text-[0.625rem]">{timestamp}</span>
        </>
      )}
      <ChevronRight size={12} className="opacity-50" />
    </button>
  )
}

// Modal to show original validation feedback
interface ValidationFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  source: 'idea-validator' | 'vc-feedback' | 'developer-feedback' | 'designer-feedback'
  feedback: string[]
  score?: number
  conversationSnippet?: string
}

export const ValidationFeedbackModal: React.FC<ValidationFeedbackModalProps> = ({
  isOpen,
  onClose,
  source,
  feedback,
  score,
  conversationSnippet,
}) => {
  if (!isOpen) return null

  const sourceConfig = {
    'idea-validator': {
      title: 'Idea Validator 검증 결과',
      description: '멀티 페르소나 검증 시스템의 피드백입니다.',
      headerBg: 'bg-purple-500',
    },
    'vc-feedback': {
      title: 'VC 페르소나 피드백',
      description: '투자자 관점에서의 피드백입니다.',
      headerBg: 'bg-status-success-text',
    },
    'developer-feedback': {
      title: '개발자 페르소나 피드백',
      description: '기술 실현 가능성 관점의 피드백입니다.',
      headerBg: 'bg-status-info-text',
    },
    'designer-feedback': {
      title: '디자이너 페르소나 피드백',
      description: 'UX/UI 관점에서의 피드백입니다.',
      headerBg: 'bg-pink-500',
    },
  }

  const config = sourceConfig[source]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative bg-surface-card shadow-lg w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`${config.headerBg} text-white p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">{config.title}</h3>
              <p className="text-sm opacity-80">{config.description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {score !== undefined && (
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-bold">{score}</span>
              <span className="text-lg opacity-80">/100</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 max-h-[25rem] overflow-y-auto">
          <h4 className="text-[0.625rem] font-medium text-txt-tertiary mb-3">
            주요 피드백
          </h4>

          <div className="space-y-3">
            {feedback.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-surface-sunken"
              >
                <CheckCircle2 size={16} className="text-txt-tertiary mt-0.5 shrink-0" />
                <p className="text-sm text-txt-secondary leading-relaxed">{item}</p>
              </div>
            ))}
          </div>

          {conversationSnippet && (
            <div className="mt-6">
              <h4 className="text-[0.625rem] font-medium text-txt-tertiary mb-3">
                대화 발췌
              </h4>
              <div className="p-3 bg-surface-sunken">
                <p className="text-sm text-txt-secondary italic whitespace-pre-wrap">
                  {conversationSnippet}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle bg-surface-sunken">
          <button
            onClick={onClose}
            className="w-full py-2 bg-surface-inverse text-white text-sm font-medium hover:bg-surface-inverse/90 transition-colors hover:opacity-90 active:scale-[0.97]"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}

// Section that shows validation source and allows viewing original feedback
interface ValidationSourceSectionProps {
  validationId: string
  personaScores?: {
    developer: number
    designer: number
    vc: number
  }
  reflectedAdvice?: string[]
  onViewFullValidation?: () => void
}

export const ValidationSourceSection: React.FC<ValidationSourceSectionProps> = ({
  validationId,
  personaScores,
  reflectedAdvice = [],
  onViewFullValidation,
}) => {
  const [showModal, setShowModal] = useState(false)
  const [selectedSource, setSelectedSource] = useState<'vc-feedback' | 'developer-feedback' | 'designer-feedback'>('vc-feedback')

  const handleShowFeedback = (source: typeof selectedSource) => {
    setSelectedSource(source)
    setShowModal(true)
  }

  return (
    <div className="p-4 bg-purple-50 border border-purple-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-600" />
          <span className="text-sm font-semibold text-purple-800">
            Idea Validator 검증 데이터 연동됨
          </span>
        </div>
        {onViewFullValidation && (
          <button
            onClick={onViewFullValidation}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            전체 보기
            <ExternalLink size={12} />
          </button>
        )}
      </div>

      {personaScores && (
        <div className="flex flex-wrap gap-2">
          <ValidationSourceBadge
            source="developer-feedback"
            score={personaScores.developer}
            compact
            onClick={() => handleShowFeedback('developer-feedback')}
          />
          <ValidationSourceBadge
            source="designer-feedback"
            score={personaScores.designer}
            compact
            onClick={() => handleShowFeedback('designer-feedback')}
          />
          <ValidationSourceBadge
            source="vc-feedback"
            score={personaScores.vc}
            compact
            onClick={() => handleShowFeedback('vc-feedback')}
          />
        </div>
      )}

      <ValidationFeedbackModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        source={selectedSource}
        feedback={reflectedAdvice}
        score={personaScores?.[selectedSource.replace('-feedback', '') as keyof typeof personaScores]}
      />
    </div>
  )
}

export default ValidationSourceBadge
