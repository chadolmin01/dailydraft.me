'use client'

import React, { useState } from 'react'
import { Sparkles, HelpCircle, Check, AlertCircle, Loader2 } from 'lucide-react'
import {
  FormSection,
  ExtraSection,
  SectionField,
  PsstSectionType,
  ExtraSectionType,
  BusinessPlanData,
  BusinessPlanBasicInfo,
  type IndustryType,
} from '../../src/types/business-plan'

interface SectionEditorProps {
  section: FormSection | ExtraSection
  data: Record<string, string>
  onChange: (fieldId: string, value: string) => void
  onAiGenerate?: (fieldId: string) => Promise<void>
  isGenerating?: Record<string, boolean>
  validationErrors?: Record<string, string>
  basicInfo?: BusinessPlanBasicInfo
}

export const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  data,
  onChange,
  onAiGenerate,
  isGenerating = {},
  validationErrors = {},
  basicInfo,
}) => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-txt-primary">{section.title}</h2>
          <p className="text-sm text-txt-tertiary mt-1">
            배점: {section.weight}점
          </p>
        </div>
        <div className="text-[10px] font-medium text-txt-tertiary bg-surface-sunken px-2 py-1 border border-border-subtle">
          {section.type.toUpperCase()}
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-6">
        {section.fields.map((field) => (
          <FieldEditor
            key={field.id}
            field={field}
            value={data[field.id] || ''}
            onChange={(value) => onChange(field.id, value)}
            onAiGenerate={field.aiGeneratable && onAiGenerate ? () => onAiGenerate(field.id) : undefined}
            isGenerating={isGenerating[field.id]}
            error={validationErrors[field.id]}
            basicInfo={basicInfo}
          />
        ))}
      </div>
    </div>
  )
}

interface FieldEditorProps {
  field: SectionField
  value: string
  onChange: (value: string) => void
  onAiGenerate?: () => Promise<void>
  isGenerating?: boolean
  error?: string
  basicInfo?: BusinessPlanBasicInfo
}

const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  value,
  onChange,
  onAiGenerate,
  isGenerating,
  error,
  basicInfo,
}) => {
  const [showHelp, setShowHelp] = useState(false)

  const handleAiGenerate = async () => {
    if (onAiGenerate && !isGenerating) {
      await onAiGenerate()
    }
  }

  const charCount = value.length
  const maxLength = field.maxLength || 2000

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="font-medium text-txt-primary text-sm">
            {field.label}
            {field.required && <span className="text-status-danger-text ml-0.5">*</span>}
          </label>
          {field.helpText && (
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="text-txt-tertiary hover:text-txt-secondary"
            >
              <HelpCircle size={14} />
            </button>
          )}
        </div>

        {/* AI Generate Button */}
        {field.aiGeneratable && onAiGenerate && (
          <button
            onClick={handleAiGenerate}
            disabled={isGenerating || !basicInfo?.itemName}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
              transition-all
              ${isGenerating
                ? 'bg-surface-sunken text-txt-tertiary cursor-not-allowed'
                : !basicInfo?.itemName
                  ? 'bg-surface-sunken text-txt-tertiary cursor-not-allowed'
                  : 'bg-surface-sunken text-brand hover:bg-accent-secondary border border-border'
              }
            `}
            title={!basicInfo?.itemName ? '기본 정보를 먼저 입력하세요' : 'AI로 작성'}
          >
            {isGenerating ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>생성 중...</span>
              </>
            ) : (
              <>
                <Sparkles size={12} />
                <span>AI로 작성</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Help text */}
      {showHelp && field.helpText && (
        <div className="p-3 bg-surface-sunken rounded-xl border border-border text-xs text-txt-secondary">
          {field.helpText}
        </div>
      )}

      {/* Input */}
      {field.type === 'textarea' || field.type === 'rich-text' ? (
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            maxLength={maxLength}
            rows={6}
            className={`
              w-full px-4 py-3 border text-base sm:text-sm resize-none
              focus:outline-none focus:border-border
              transition-all
              ${error
                ? 'border-status-danger-text/20 bg-status-danger-bg/50'
                : 'border-border bg-surface-card hover:border-border'
              }
              ${isGenerating ? 'opacity-50' : ''}
            `}
          />
          {/* Character count */}
          <div className="absolute bottom-2 right-2 text-[10px] text-txt-tertiary font-mono">
            {charCount.toLocaleString()}/{maxLength.toLocaleString()}
          </div>
        </div>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          className={`
            w-full px-4 py-2.5 border text-base sm:text-sm
            focus:outline-none focus:border-border
            transition-all
            ${error
              ? 'border-status-danger-text/20 bg-status-danger-bg/50'
              : 'border-border bg-surface-card hover:border-border'
            }
          `}
        />
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-status-danger-text">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      {/* Validation success */}
      {value && !error && field.required && (
        <div className="flex items-center gap-1.5 text-xs text-status-success-text">
          <Check size={12} />
          필수 항목 입력 완료
        </div>
      )}
    </div>
  )
}

// Basic Info Editor Component
interface BasicInfoEditorProps {
  data: BusinessPlanBasicInfo
  onChange: (data: BusinessPlanBasicInfo) => void
  errors?: Record<string, string>
}

export const BasicInfoEditor: React.FC<BasicInfoEditorProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  const industries = [
    { value: 'it_platform', label: 'IT/플랫폼' },
    { value: 'manufacturing', label: '제조/하드웨어' },
    { value: 'bio_healthcare', label: '바이오/헬스케어' },
    { value: 'food_fnb', label: '식품/F&B' },
    { value: 'education', label: '교육/에듀테크' },
    { value: 'fintech', label: '핀테크/금융' },
    { value: 'traditional_culture', label: '전통문화' },
    { value: 'other', label: '기타' },
  ]

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-4 border-b border-border">
        <h2 className="text-xl font-bold text-txt-primary">기본 정보</h2>
        <p className="text-sm text-txt-tertiary mt-1">
          사업 아이템의 기본 정보를 입력하세요. AI 자동완성에 활용됩니다.
        </p>
      </div>

      {/* Item Name */}
      <div className="space-y-2">
        <label className="font-medium text-txt-primary text-sm">
          아이템/서비스명 <span className="text-status-danger-text">*</span>
        </label>
        <input
          type="text"
          value={data.itemName}
          onChange={(e) => onChange({ ...data, itemName: e.target.value })}
          placeholder="예: 헬스체커"
          className={`
            w-full px-4 py-2.5 border text-base sm:text-sm
            focus:outline-none focus:border-border
            ${errors.itemName ? 'border-status-danger-text/20 bg-status-danger-bg/50' : 'border-border'}
          `}
        />
        {errors.itemName && (
          <div className="flex items-center gap-1.5 text-xs text-status-danger-text">
            <AlertCircle size={12} />
            {errors.itemName}
          </div>
        )}
      </div>

      {/* One-liner */}
      <div className="space-y-2">
        <label className="font-medium text-txt-primary text-sm">
          한 줄 설명 <span className="text-status-danger-text">*</span>
        </label>
        <input
          type="text"
          value={data.oneLiner}
          onChange={(e) => onChange({ ...data, oneLiner: e.target.value })}
          placeholder="예: AI 기반 건강검진 결과 분석 서비스"
          maxLength={50}
          className={`
            w-full px-4 py-2.5 border text-base sm:text-sm
            focus:outline-none focus:border-border
            ${errors.oneLiner ? 'border-status-danger-text/20 bg-status-danger-bg/50' : 'border-border'}
          `}
        />
        <div className="flex justify-between text-[10px] text-txt-tertiary">
          <span>{errors.oneLiner || ''}</span>
          <span className="font-mono">{data.oneLiner.length}/50</span>
        </div>
      </div>

      {/* Target Customer */}
      <div className="space-y-2">
        <label className="font-medium text-txt-primary text-sm">
          타겟 고객 <span className="text-status-danger-text">*</span>
        </label>
        <input
          type="text"
          value={data.targetCustomer}
          onChange={(e) => onChange({ ...data, targetCustomer: e.target.value })}
          placeholder="예: 30-50대 직장인, 건강 관리에 관심 있는 소비자"
          className={`
            w-full px-4 py-2.5 border text-base sm:text-sm
            focus:outline-none focus:border-border
            ${errors.targetCustomer ? 'border-status-danger-text/20 bg-status-danger-bg/50' : 'border-border'}
          `}
        />
        <p className="text-[10px] text-txt-tertiary">
          구체적으로 작성할수록 AI가 더 정확한 내용을 생성합니다
        </p>
      </div>

      {/* Industry */}
      <div className="space-y-2">
        <label className="font-medium text-txt-primary text-sm">
          업종 <span className="text-status-danger-text">*</span>
        </label>
        <select
          value={data.industry}
          onChange={(e) => onChange({ ...data, industry: e.target.value as IndustryType })}
          className="w-full px-4 py-2.5 border border-border text-sm focus:outline-none focus:border-border bg-surface-card rounded-lg"
        >
          {industries.map((ind) => (
            <option key={ind.value} value={ind.value}>
              {ind.label}
            </option>
          ))}
        </select>
      </div>

      {/* Funding Amount (Optional) */}
      <div className="space-y-2">
        <label className="font-medium text-txt-primary text-sm">
          희망 지원금액 <span className="text-txt-tertiary text-xs font-normal">(선택)</span>
        </label>
        <div className="relative">
          <input
            type="number"
            value={data.fundingAmount || ''}
            onChange={(e) => onChange({ ...data, fundingAmount: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="예: 5000 (만원 단위)"
            aria-label="희망 지원금액 (만원 단위, 선택)"
            className="w-full px-4 py-2.5 pr-12 border border-border text-base sm:text-sm focus:outline-none focus:border-border"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-txt-tertiary">
            만원
          </span>
        </div>
      </div>
    </div>
  )
}

export default SectionEditor
