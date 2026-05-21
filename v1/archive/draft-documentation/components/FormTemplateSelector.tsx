'use client'

import React from 'react'
import { X, FileText, Users, Sparkles, Building2, MapPin, ChevronRight } from 'lucide-react'
import { FormTemplateType, FormTemplate } from '@/lib/types'
import { FORM_TEMPLATES } from '@/lib/templates'

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
  'yebi-chogi': { bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE] hover:border-[#3B82F6]', icon: 'text-[#3B82F6]' },
  'student-300': { bg: 'bg-[#F5F3FF]', border: 'border-[#DDD6FE] hover:border-[#8B5CF6]', icon: 'text-[#8B5CF6]' },
  'saengae-chungnyeon': { bg: 'bg-[#F0FDF4]', border: 'border-[#BBF7D0] hover:border-[#10B981]', icon: 'text-[#10B981]' },
  'oneul-jeongtong': { bg: 'bg-[#FFFBEB]', border: 'border-[#FDE68A] hover:border-[#F59E0B]', icon: 'text-[#F59E0B]' },
  'gyeonggi-g-star': { bg: 'bg-[#FFF1F2]', border: 'border-[#FECDD3] hover:border-[#F43F5E]', icon: 'text-[#F43F5E]' },
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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4 border border-[#E5E7EB]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">양식 선택</h2>
            <p className="text-sm text-[#6B7280] mt-0.5">작성하려는 정부지원사업 양식을 선택하세요</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
          >
            <X size={20} className="text-[#6B7280]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Recommended */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold font-mono text-[#3B82F6] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                RECOMMENDED
              </span>
              <span className="text-xs text-[#6B7280]">가장 범용적인 PSST 표준 양식</span>
            </div>

            <TemplateCard
              template={FORM_TEMPLATES[0]}
              onSelect={handleSelect}
              featured
            />
          </div>

          {/* Other templates */}
          <div>
            <h3 className="text-sm font-bold text-[#374151] mb-3 font-mono uppercase">
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
          <div className="mt-6 p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#111827] text-white rounded-lg flex items-center justify-center shrink-0">
                <FileText size={16} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#111827] mb-1">정부양식 PDF 생성</h4>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  모든 양식에서 A4 규격의 정부 제출용 PDF를 생성할 수 있습니다.
                  각 섹션을 입력하면 자동으로 양식에 맞게 구성됩니다.
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
        w-full text-left p-4 rounded-lg border-2 transition-all group
        ${featured ? 'border-[#BFDBFE] hover:border-[#3B82F6] bg-[#EFF6FF]/30' : `${colors.border} bg-white hover:shadow-md`}
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`
          w-12 h-12 rounded-lg flex items-center justify-center shrink-0
          ${featured ? 'bg-[#EFF6FF] text-[#3B82F6]' : `${colors.bg} ${colors.icon}`}
        `}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-[#111827]">{template.name}</h4>
            <ChevronRight
              size={16}
              className="text-[#D1D5DB] group-hover:text-[#6B7280] group-hover:translate-x-1 transition-all"
            />
          </div>

          <p className="text-sm text-[#6B7280] mb-2">{template.description}</p>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-[#9CA3AF]">
              {template.pages}p
            </span>
            <div className="flex flex-wrap gap-1">
              {template.features.slice(0, 3).map((feature, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-1.5 py-0.5 bg-[#F3F4F6] text-[#6B7280] rounded"
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
