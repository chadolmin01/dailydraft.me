'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  FileText,
  CheckCircle2,
  Target,
  Sparkles,
  X,
} from 'lucide-react'
import { Card } from './ui/Card'
import { StepWizardCompact } from './StepWizard'
import { SectionEditor, BasicInfoEditor } from './SectionEditor'
import PreviewModal from './PreviewModal'
import {
  FormTemplateType,
  BusinessPlanData,
  BusinessPlanBasicInfo,
  WIZARD_STEPS,
  PsstSectionType,
} from '@/lib/types'
import { getTemplateById } from '@/lib/templates'

interface BusinessPlanEditorProps {
  templateType: FormTemplateType
  initialData?: BusinessPlanData
  initialSectionData?: Record<string, Record<string, string>>
  onClose?: () => void
}

// Check if data was imported
function hasImportedData(
  initialData?: BusinessPlanData,
  initialSectionData?: Record<string, Record<string, string>>
): boolean {
  if (!initialData && !initialSectionData) return false
  if (initialData?.basicInfo.itemName) return true
  if (initialSectionData && Object.keys(initialSectionData).length > 0) {
    return Object.values(initialSectionData).some(section =>
      Object.values(section).some(value => value.length > 0)
    )
  }
  return false
}

// 초기 빈 사업계획서 데이터 생성
function createEmptyBusinessPlan(templateType: FormTemplateType): BusinessPlanData {
  return {
    templateType,
    basicInfo: {
      itemName: '',
      oneLiner: '',
      targetCustomer: '',
      industry: 'other',
    },
  }
}

export const BusinessPlanEditor: React.FC<BusinessPlanEditorProps> = ({
  templateType,
  initialData,
  initialSectionData,
  onClose,
}) => {
  const template = getTemplateById(templateType)
  const [data, setData] = useState<BusinessPlanData>(
    initialData || createEmptyBusinessPlan(templateType)
  )
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [sectionData, setSectionData] = useState<Record<string, Record<string, string>>>(
    initialSectionData || {}
  )
  const [showPreview, setShowPreview] = useState(false)
  const [showImportBanner, setShowImportBanner] = useState(
    hasImportedData(initialData, initialSectionData)
  )

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (!template) return 0

    let filledFields = 0
    let totalFields = 4 // basic info fields

    // Check basic info
    if (data.basicInfo.itemName) filledFields++
    if (data.basicInfo.oneLiner) filledFields++
    if (data.basicInfo.targetCustomer) filledFields++
    if (data.basicInfo.industry !== 'other') filledFields++

    // Check section fields
    template.sections.forEach((section) => {
      section.fields.forEach((field) => {
        totalFields++
        if (sectionData[section.type]?.[field.id]) filledFields++
      })
    })

    if (template.extraSections) {
      template.extraSections.forEach((section) => {
        section.fields.forEach((field) => {
          totalFields++
          if (sectionData[section.type]?.[field.id]) filledFields++
        })
      })
    }

    return Math.round((filledFields / totalFields) * 100)
  }, [data.basicInfo, sectionData, template])

  // Initialize section data from template (only if no initial data provided)
  useEffect(() => {
    if (template && !initialSectionData) {
      const newSectionData: Record<string, Record<string, string>> = {}
      template.sections.forEach((section) => {
        newSectionData[section.type] = {}
        section.fields.forEach((field) => {
          newSectionData[section.type][field.id] = ''
        })
      })
      if (template.extraSections) {
        template.extraSections.forEach((section) => {
          newSectionData[section.type] = {}
          section.fields.forEach((field) => {
            newSectionData[section.type][field.id] = ''
          })
        })
      }
      setSectionData(newSectionData)
    }
  }, [template, initialSectionData])

  const handleBasicInfoChange = useCallback((basicInfo: BusinessPlanBasicInfo) => {
    setData((prev) => ({ ...prev, basicInfo }))
  }, [])

  const handleSectionChange = useCallback((sectionType: string, fieldId: string, value: string) => {
    setSectionData((prev) => ({
      ...prev,
      [sectionType]: {
        ...prev[sectionType],
        [fieldId]: value,
      },
    }))
  }, [])

  const handleNextStep = useCallback(() => {
    if (currentStep < WIZARD_STEPS.length) {
      // Mark current step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps((prev) => [...prev, currentStep])
      }
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep, completedSteps])

  const handlePrevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const getCurrentSection = () => {
    const step = WIZARD_STEPS[currentStep - 1]
    if (step.sections.includes('basic')) {
      return 'basic'
    }
    const sectionType = step.sections[0] as PsstSectionType
    return template?.sections.find((s) => s.type === sectionType)
  }

  const renderCurrentStepContent = () => {
    const section = getCurrentSection()

    if (section === 'basic') {
      return (
        <BasicInfoEditor
          data={data.basicInfo}
          onChange={handleBasicInfoChange}
        />
      )
    }

    if (section && typeof section !== 'string') {
      return (
        <SectionEditor
          section={section}
          data={sectionData[section.type] || {}}
          onChange={(fieldId, value) => handleSectionChange(section.type, fieldId, value)}
          basicInfo={data.basicInfo}
        />
      )
    }

    return null
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#6B7280]">템플릿을 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white bg-grid">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-[#E5E7EB] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E5E7EB]">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111827] mb-3"
          >
            <ArrowLeft size={16} />
            돌아가기
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EFF6FF] rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-[#3B82F6]" />
            </div>
            <div>
              <h1 className="font-bold text-[#111827] text-sm">{template.shortName}</h1>
              <p className="text-[10px] text-[#6B7280] font-mono">{template.pages}p</p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-[10px] font-bold font-mono text-[#6B7280] mb-3 uppercase">
            Progress
          </h3>
          <StepWizardCompact
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={setCurrentStep}
          />
        </div>

        {/* Score Summary */}
        <div className="p-4 border-t border-[#E5E7EB] space-y-3">
          {/* Completion indicator */}
          <div className={`p-3 rounded-lg ${
            completionPercentage >= 80
              ? 'bg-[#F0FDF4] border border-[#BBF7D0]'
              : completionPercentage >= 40
                ? 'bg-[#FFFBEB] border border-[#FDE68A]'
                : 'bg-[#F9FAFB] border border-[#E5E7EB]'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                {completionPercentage >= 80 ? (
                  <CheckCircle2 size={14} className="text-[#10B981]" />
                ) : (
                  <Target size={14} className="text-[#F59E0B]" />
                )}
                <span className="text-xs font-medium text-[#374151]">
                  작성 진행률
                </span>
              </div>
              <span className={`text-lg font-bold ${
                completionPercentage >= 80
                  ? 'text-[#10B981]'
                  : 'text-[#F59E0B]'
              }`}>
                {completionPercentage}%
              </span>
            </div>
            <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  completionPercentage >= 80 ? 'bg-[#10B981]' :
                  completionPercentage >= 40 ? 'bg-[#F59E0B]' :
                  'bg-[#9CA3AF]'
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px]">
              <span className="text-[#6B7280]">
                {completedSteps.length}/{WIZARD_STEPS.length} 섹션 완료
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#111827]">
              {WIZARD_STEPS[currentStep - 1].title}
            </h2>
            <p className="text-sm text-[#6B7280]">
              {WIZARD_STEPS[currentStep - 1].description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-xl hover:bg-[#F9FAFB] transition-colors"
            >
              <Eye size={16} />
              미리보기
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* Import Success Banner */}
            {showImportBanner && (
              <div className="mb-4 bg-[#111827] text-white rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#F59E0B]/20 rounded-lg flex items-center justify-center shrink-0">
                      <Sparkles size={20} className="text-[#F59E0B]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">
                        AI 검증 아이디어에서 자동 완성됨
                      </h4>
                      <p className="text-sm text-white/70">
                        검증된 아이디어 데이터로 {completionPercentage}%가 자동으로 채워졌습니다.
                        내용을 검토하고 필요한 부분을 수정하세요.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowImportBanner(false)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={16} className="text-white/50" />
                  </button>
                </div>
              </div>
            )}

            <Card padding="p-6">
              {renderCurrentStepContent()}
            </Card>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="bg-white border-t border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors
              ${currentStep === 1
                ? 'text-[#D1D5DB] cursor-not-allowed'
                : 'text-[#374151] hover:bg-[#F3F4F6]'
              }
            `}
          >
            <ArrowLeft size={16} />
            이전
          </button>

          <div className="flex items-center gap-1">
            {WIZARD_STEPS.map((step) => (
              <div
                key={step.id}
                className={`
                  w-2 h-2 rounded-full transition-colors
                  ${step.id === currentStep
                    ? 'bg-[#3B82F6]'
                    : completedSteps.includes(step.id)
                      ? 'bg-[#111827]'
                      : 'bg-[#E5E7EB]'
                  }
                `}
              />
            ))}
          </div>

          {currentStep < WIZARD_STEPS.length ? (
            <button
              onClick={handleNextStep}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#111827] text-white rounded-xl hover:bg-[#374151] transition-colors"
            >
              다음
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-colors"
            >
              <Eye size={16} />
              완료 및 미리보기
            </button>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          data={data}
          sectionData={sectionData}
          template={template}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}

export default BusinessPlanEditor
