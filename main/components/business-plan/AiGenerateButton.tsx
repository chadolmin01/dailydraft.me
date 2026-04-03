'use client'

import React, { useState } from 'react'
import { Sparkles, Loader2, Wand2, ChevronDown } from 'lucide-react'
import {
  FormTemplateType,
  BusinessPlanBasicInfo,
  PsstSectionType,
} from '../../src/types/business-plan'

interface AiGenerateButtonProps {
  sectionType: PsstSectionType
  templateType: FormTemplateType
  basicInfo: BusinessPlanBasicInfo
  existingData: Record<string, Record<string, string>>
  onGenerated: (data: Record<string, string>) => void
  disabled?: boolean
}

export const AiGenerateButton: React.FC<AiGenerateButtonProps> = ({
  sectionType,
  templateType,
  basicInfo,
  existingData,
  onGenerated,
  disabled,
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [generationType, setGenerationType] = useState<'draft' | 'improve' | 'expand'>('draft')

  const handleGenerate = async (type: 'draft' | 'improve' | 'expand') => {
    setIsGenerating(true)
    setShowOptions(false)

    try {
      const response = await fetch('/api/business-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: sectionType,
          templateType,
          generationType: type,
          context: {
            basicInfo,
            existingData,
          },
        }),
      })

      if (response.ok) {
        const result = await response.json()
        onGenerated(result.data)
      }
    } catch (error) {
      console.error('AI generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const options = [
    {
      type: 'draft' as const,
      label: '초안 생성',
      description: '기본 정보를 바탕으로 새로운 초안을 작성합니다',
      icon: Wand2,
    },
    {
      type: 'improve' as const,
      label: '개선하기',
      description: '기존 내용을 더 설득력 있게 개선합니다',
      icon: Sparkles,
    },
    {
      type: 'expand' as const,
      label: '상세화',
      description: '기존 내용에 더 많은 세부 정보를 추가합니다',
      icon: ChevronDown,
    },
  ]

  return (
    <div className="mt-4 relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleGenerate('draft')}
          disabled={disabled || isGenerating}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3
            text-sm font-medium transition-all
            ${disabled
              ? 'bg-surface-sunken text-txt-tertiary cursor-not-allowed'
              : isGenerating
                ? 'bg-status-info-bg text-status-info-text cursor-wait'
                : 'bg-surface-inverse text-txt-inverse hover:bg-surface-inverse/90 hover:opacity-90 active:scale-[0.97]'
            }
          `}
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>AI가 작성 중입니다...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>전체 섹션 AI로 작성</span>
            </>
          )}
        </button>

        <button
          onClick={() => setShowOptions(!showOptions)}
          disabled={disabled || isGenerating}
          className={`
            p-3 border transition-all
            ${disabled || isGenerating
              ? 'border-border text-txt-disabled cursor-not-allowed'
              : 'border-border text-txt-secondary hover:bg-black hover:text-white'
            }
          `}
        >
          <ChevronDown size={16} className={`transition-transform ${showOptions ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Options dropdown */}
      {showOptions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface-card rounded-xl border border-border shadow-md z-10">
          {options.map((option) => (
            <button
              key={option.type}
              onClick={() => handleGenerate(option.type)}
              className="w-full flex items-start gap-3 p-3 hover:bg-surface-sunken transition-colors text-left"
            >
              <div className="w-8 h-8 bg-surface-sunken flex items-center justify-center shrink-0">
                <option.icon size={16} className="text-txt-secondary" />
              </div>
              <div>
                <div className="text-sm font-medium text-txt-primary">{option.label}</div>
                <div className="text-xs text-txt-tertiary">{option.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {disabled && (
        <p className="text-xs text-txt-tertiary mt-2 text-center">
          기본 정보(아이템명, 타겟 고객)를 먼저 입력해주세요
        </p>
      )}
    </div>
  )
}

// Inline AI Generate Button for individual fields
interface AiFieldButtonProps {
  onClick: () => Promise<void>
  isGenerating: boolean
  disabled?: boolean
  compact?: boolean
}

export const AiFieldButton: React.FC<AiFieldButtonProps> = ({
  onClick,
  isGenerating,
  disabled,
  compact = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isGenerating}
      className={`
        flex items-center gap-1.5 font-medium transition-all
        ${compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'}
        ${isGenerating
          ? 'bg-surface-sunken text-txt-tertiary cursor-wait'
          : disabled
            ? 'bg-surface-sunken text-txt-tertiary cursor-not-allowed'
            : 'bg-status-info-bg text-status-info-text hover:bg-status-info-bg border border-status-info-text/20'
        }
      `}
      title={disabled ? '기본 정보를 먼저 입력하세요' : 'AI로 작성'}
    >
      {isGenerating ? (
        <>
          <Loader2 size={compact ? 10 : 12} className="animate-spin" />
          <span>생성 중...</span>
        </>
      ) : (
        <>
          <Sparkles size={compact ? 10 : 12} />
          <span>AI로 작성</span>
        </>
      )}
    </button>
  )
}

// Floating AI Assistant Button
interface AiAssistantFloatingProps {
  onGenerateSection: () => void
  onValidate: () => void
  onSuggest: () => void
  isGenerating: boolean
}

export const AiAssistantFloating: React.FC<AiAssistantFloatingProps> = ({
  onGenerateSection,
  onValidate,
  onSuggest,
  isGenerating,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isExpanded && (
        <div className="mb-3 bg-surface-card rounded-xl border border-border shadow-md overflow-hidden w-48">
          <button
            onClick={() => { onGenerateSection(); setIsExpanded(false); }}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 p-3 hover:bg-surface-sunken transition-colors text-left text-sm"
          >
            <Wand2 size={14} className="text-status-info-text" />
            <span>섹션 생성</span>
          </button>
          <button
            onClick={() => { onValidate(); setIsExpanded(false); }}
            className="w-full flex items-center gap-2 p-3 hover:bg-surface-sunken transition-colors text-left text-sm border-t border-border-subtle"
          >
            <Sparkles size={14} className="text-purple-600" />
            <span>검증하기</span>
          </button>
          <button
            onClick={() => { onSuggest(); setIsExpanded(false); }}
            className="w-full flex items-center gap-2 p-3 hover:bg-surface-sunken transition-colors text-left text-sm border-t border-border-subtle"
          >
            <Sparkles size={14} className="text-status-success-text" />
            <span>개선 제안</span>
          </button>
        </div>
      )}

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-14 h-14 shadow-lg flex items-center justify-center
          transition-all duration-200
          ${isExpanded
            ? 'bg-surface-inverse text-white'
            : 'bg-surface-inverse text-txt-inverse hover:shadow-md hover:scale-105'
          }
          ${isGenerating ? 'animate-pulse' : ''}
        `}
      >
        {isGenerating ? (
          <Loader2 size={24} className="animate-spin" />
        ) : (
          <Sparkles size={24} />
        )}
      </button>
    </div>
  )
}

export default AiGenerateButton
