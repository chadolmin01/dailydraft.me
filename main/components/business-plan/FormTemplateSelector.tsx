'use client'

import React from 'react'
import { X, FileText, Users, Sparkles, Building2, MapPin, ChevronRight } from 'lucide-react'
import { FormTemplateType, FORM_TEMPLATES, FormTemplate } from '../../src/types/business-plan'

interface FormTemplateSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (templateType: FormTemplateType) => void
}

const TEMPLATE_ICONS: Record<FormTemplateType, React.ReactNode> = {
  'yebi-chogi': <FileText size={24} />,
  'student-300': <Users size={24} />,
  'saengae-chungnyeon': <Sparkles size={24} />,
  'oneul-jeongtong': <Building2 size={24} />,
  'gyeonggi-g-star': <MapPin size={24} />,
}

const TEMPLATE_COLORS: Record<FormTemplateType, { bg: string; border: string; icon: string }> = {
  'yebi-chogi': { bg: 'bg-surface-sunken', border: 'border-border hover:border-surface-inverse', icon: 'text-txt-primary' },
  'student-300': { bg: 'bg-surface-sunken', border: 'border-border hover:border-surface-inverse', icon: 'text-txt-primary' },
  'saengae-chungnyeon': { bg: 'bg-surface-sunken', border: 'border-border hover:border-surface-inverse', icon: 'text-txt-primary' },
  'oneul-jeongtong': { bg: 'bg-surface-sunken', border: 'border-border hover:border-surface-inverse', icon: 'text-txt-primary' },
  'gyeonggi-g-star': { bg: 'bg-surface-sunken', border: 'border-border hover:border-surface-inverse', icon: 'text-txt-primary' },
}

export const FormTemplateSelector: React.FC<FormTemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  if (!isOpen) return null

  const handleSelect = (template: FormTemplate) => {
    onSelect(template.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface-card shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-txt-primary">양식 선택</h2>
            <p className="text-sm text-txt-tertiary mt-0.5">작성하려는 정부지원사업 양식을 선택하세요</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-sunken transition-colors"
            aria-label="닫기"
          >
            <X size={20} className="text-txt-tertiary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Recommended */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold font-mono text-status-info-text bg-status-info-bg px-2 py-0.5 border border-status-info-text/20">
                RECOMMENDED
              </span>
              <span className="text-xs text-txt-tertiary">가장 범용적인 PSST 표준 양식</span>
            </div>

            <TemplateCard
              template={FORM_TEMPLATES[0]}
              onSelect={handleSelect}
              featured
            />
          </div>

          {/* Other templates */}
          <div>
            <h3 className="text-[10px] font-medium text-txt-secondary mb-3">
              Other Templates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FORM_TEMPLATES.slice(1).map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-surface-sunken rounded-xl border border-border">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-surface-inverse text-txt-inverse flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-txt-primary mb-1">AI 자동완성 지원</h4>
                <p className="text-xs text-txt-secondary leading-relaxed">
                  모든 양식에서 PSST 프레임워크 기반 AI 자동완성을 지원합니다.
                  기본 정보만 입력하면 각 섹션을 AI가 초안을 작성해드립니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface TemplateCardProps {
  template: FormTemplate
  onSelect: (template: FormTemplate) => void
  featured?: boolean
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect, featured }) => {
  const colors = TEMPLATE_COLORS[template.id]
  const icon = TEMPLATE_ICONS[template.id]

  return (
    <button
      onClick={() => onSelect(template)}
      className={`
        w-full text-left p-4 border transition-all group
        ${featured ? 'border-status-info-text/30 hover:border-status-info-text bg-status-info-bg/30' : `${colors.border} bg-surface-card hover:shadow-md hover-spring`}
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`
          w-12 h-12 flex items-center justify-center shrink-0
          ${featured ? 'bg-status-info-bg text-status-info-text' : `${colors.bg} ${colors.icon}`}
        `}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-txt-primary">{template.name}</h4>
            <ChevronRight
              size={16}
              className="text-txt-disabled group-hover:text-txt-secondary group-hover:translate-x-1 transition-all"
            />
          </div>

          <p className="text-sm text-txt-secondary mb-2">{template.description}</p>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-txt-tertiary">
              {template.pages}p
            </span>
            <div className="flex flex-wrap gap-1">
              {template.features.slice(0, 3).map((feature, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-1.5 py-0.5 bg-surface-sunken text-txt-secondary"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

export default FormTemplateSelector
