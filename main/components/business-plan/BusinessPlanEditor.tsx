'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Eye,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  X,
  TrendingUp,
  Target,
  Menu,
} from 'lucide-react'
import { Card } from '../ui/Card'
import { StepWizard, StepWizardCompact } from './StepWizard'
import { SectionEditor, BasicInfoEditor } from './SectionEditor'
import { ValidationPanel } from './ValidationPanel'
import { AiGenerateButton } from './AiGenerateButton'
import { PreviewModal } from './PreviewModal'
import { RealtimeScorePanel } from './RealtimeScorePanel'
import { RejectionWarnings } from './RejectionWarnings'
import { ValidationSourceSection } from './ValidationSourceBadge'
import { useRealtimeValidation } from '../../src/hooks/useRealtimeValidation'
import { checkAllSections, countWarningsBySeverity } from '../../src/lib/rejectionPatterns'
import {
  FormTemplateType,
  BusinessPlanData,
  BusinessPlanBasicInfo,
  WIZARD_STEPS,
  getTemplateById,
  createEmptyBusinessPlan,
  PsstSectionType,
} from '../../src/types/business-plan'

interface BusinessPlanEditorProps {
  templateType?: FormTemplateType
  initialData?: BusinessPlanData
  initialSectionData?: Record<string, Record<string, string>>
  validationSource?: {
    validationId: string
    personaScores?: { developer: number; designer: number; vc: number }
    reflectedAdvice?: string[]
  }
  /** 워크플로우에서 전달되는 검증된 아이디어 ID */
  validatedIdeaId?: string
  onSave?: (data: BusinessPlanData) => Promise<void>
  onClose?: () => void
  /** 워크플로우 완료 콜백 */
  onComplete?: () => void
}

export const BusinessPlanEditor: React.FC<BusinessPlanEditorProps> = ({
  templateType = 'psst' as FormTemplateType,
  initialData,
  initialSectionData,
  validationSource,
  validatedIdeaId,
  onSave,
  onClose,
  onComplete,
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
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [showRealtimeScore, setShowRealtimeScore] = useState(true)

  // Real-time validation hook
  const {
    validationResult,
    isValidating,
    getSectionScore,
    passingScore,
  } = useRealtimeValidation(sectionData, data.basicInfo, 300)

  // Rejection pattern warnings
  const allWarnings = useMemo(() => {
    return checkAllSections(sectionData)
  }, [sectionData])

  // Current section warnings
  const currentSectionWarnings = useMemo(() => {
    const step = WIZARD_STEPS[currentStep - 1]
    if (step.sections.includes('basic')) return []
    const sectionType = step.sections[0] as PsstSectionType
    return allWarnings[sectionType] || []
  }, [allWarnings, currentStep])

  const totalWarningCounts = useMemo(() => {
    const allWarningsList = Object.values(allWarnings).flat()
    return countWarningsBySeverity(allWarningsList)
  }, [allWarnings])

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

  const handleAiGenerate = useCallback(async (sectionType: string, fieldId: string) => {
    const key = `${sectionType}-${fieldId}`
    setIsGenerating((prev) => ({ ...prev, [key]: true }))

    try {
      // TODO: Call AI generate API
      const response = await fetch('/api/business-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: sectionType,
          fieldId,
          templateType,
          context: {
            basicInfo: data.basicInfo,
            existingData: sectionData,
          },
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setSectionData((prev) => ({
          ...prev,
          [sectionType]: {
            ...prev[sectionType],
            [fieldId]: result.content,
          },
        }))
      }
    } catch (error) {
      console.error('AI generation failed:', error)
    } finally {
      setIsGenerating((prev) => ({ ...prev, [key]: false }))
    }
  }, [data.basicInfo, sectionData, templateType])

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

  const handleSave = useCallback(async () => {
    if (!onSave) return

    setIsSaving(true)
    try {
      await onSave({
        ...data,
        validatedIdeaId,
        status: 'in_progress',
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }, [data, onSave, validatedIdeaId])

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
          onAiGenerate={(fieldId) => handleAiGenerate(section.type, fieldId)}
          isGenerating={Object.fromEntries(
            Object.entries(isGenerating)
              .filter(([key]) => key.startsWith(section.type))
              .map(([key, value]) => [key.split('-')[1], value])
          )}
          basicInfo={data.basicInfo}
        />
      )
    }

    return null
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-txt-tertiary">템플릿을 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-surface-bg">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 lg:w-72 bg-surface-card border-r border-border flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <button
            onClick={onClose}
            className="hidden sm:flex items-center gap-2 text-sm text-txt-secondary hover:text-txt-primary transition-colors mb-3"
          >
            <ArrowLeft size={16} />
            돌아가기
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-status-info-bg flex items-center justify-center">
              <FileText size={20} className="text-status-info-text" />
            </div>
            <div>
              <h1 className="font-bold text-txt-primary text-sm">{template.shortName}</h1>
              <p className="text-[10px] text-txt-tertiary font-mono">{template.pages}p</p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-[10px] font-medium text-txt-tertiary mb-3">
            Progress
          </h3>
          <StepWizardCompact
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={setCurrentStep}
          />
        </div>

        {/* Real-time Score Summary */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Score indicator */}
          {validationResult && (
            <div className={`p-3 ${
              validationResult.percentage >= passingScore
                ? 'bg-status-success-bg border border-status-success-text/20'
                : validationResult.percentage >= 50
                  ? 'bg-status-warning-bg border border-status-warning-text/20'
                  : 'bg-status-danger-bg border border-status-danger-text/20'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {validationResult.percentage >= passingScore ? (
                    <CheckCircle2 size={14} className="text-status-success-text" />
                  ) : (
                    <Target size={14} className="text-status-warning-text" />
                  )}
                  <span className="text-xs font-medium text-txt-secondary">
                    {isValidating ? '분석 중...' : '실시간 점수'}
                  </span>
                </div>
                <span className={`text-lg font-bold ${
                  validationResult.percentage >= passingScore
                    ? 'text-status-success-text'
                    : 'text-status-warning-text'
                }`}>
                  {validationResult.totalScore}/{validationResult.maxScore}
                </span>
              </div>
              <div className="h-1.5 bg-surface-sunken overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    validationResult.percentage >= passingScore ? 'bg-status-success-text' :
                    validationResult.percentage >= 50 ? 'bg-status-warning-text' :
                    'bg-indicator-alert'
                  }`}
                  style={{ width: `${validationResult.percentage}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px]">
                <span className="text-txt-tertiary">
                  {validationResult.percentage >= passingScore
                    ? '합격 기준 충족'
                    : `합격까지 ${passingScore - validationResult.percentage}점`}
                </span>
                <span className="text-txt-tertiary">{validationResult.percentage}%</span>
              </div>
            </div>
          )}

          {/* Warning indicator */}
          {totalWarningCounts.total > 0 && (
            <div className={`p-2 flex items-center justify-between ${
              totalWarningCounts.high > 0 ? 'bg-status-danger-bg' : 'bg-status-warning-bg'
            }`}>
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={12} className={
                  totalWarningCounts.high > 0 ? 'text-status-danger-text' : 'text-status-warning-text'
                } />
                <span className="text-xs text-txt-secondary">탈락 위험 요소</span>
              </div>
              <span className={`text-xs font-bold ${
                totalWarningCounts.high > 0 ? 'text-status-danger-text' : 'text-status-warning-text'
              }`}>
                {totalWarningCounts.total}개
              </span>
            </div>
          )}

          <button
            onClick={() => setShowValidation(true)}
            className="w-full flex items-center justify-between p-3 bg-surface-sunken hover:bg-surface-card border border-transparent hover:border-border transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-txt-tertiary" />
              <span className="text-sm font-medium text-txt-secondary">상세 분석</span>
            </div>
            <span className="text-[10px] font-mono text-txt-tertiary">
              {completedSteps.length}/{WIZARD_STEPS.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-surface-card border-b border-border px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="md:hidden p-1.5 text-txt-secondary hover:text-txt-primary hover:bg-surface-sunken transition-colors"
            >
              <Menu size={18} />
            </button>
            <div>
              <h2 className="font-bold text-txt-primary text-sm md:text-base">
                {WIZARD_STEPS[currentStep - 1].title}
              </h2>
              <p className="text-xs md:text-sm text-txt-tertiary">
                {WIZARD_STEPS[currentStep - 1].description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-txt-secondary bg-surface-card rounded-lg border border-border hover:bg-black hover:text-white transition-colors"
            >
              <Save size={16} />
              {isSaving ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-txt-secondary bg-surface-card rounded-lg border border-border hover:bg-black hover:text-white transition-colors"
            >
              <Eye size={16} />
              미리보기
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {/* Validation Source Badge (if from Idea Validator) */}
            {validationSource && currentStep === 1 && (
              <div className="mb-4">
                <ValidationSourceSection
                  validationId={validationSource.validationId}
                  personaScores={validationSource.personaScores}
                  reflectedAdvice={validationSource.reflectedAdvice}
                />
              </div>
            )}

            <Card padding="p-6">
              {renderCurrentStepContent()}
            </Card>

            {/* Rejection Warnings for current section */}
            {currentStep > 1 && currentSectionWarnings.length > 0 && (
              <div className="mt-4">
                <RejectionWarnings
                  text={Object.values(sectionData[WIZARD_STEPS[currentStep - 1].sections[0] as string] || {}).join('\n')}
                  section={WIZARD_STEPS[currentStep - 1].sections[0] as string}
                  onAutoFix={() => {
                    // TODO: Implement auto-fix integration
                  }}
                />
              </div>
            )}

            {/* AI Generate All Button */}
            {currentStep > 1 && (
              <AiGenerateButton
                sectionType={WIZARD_STEPS[currentStep - 1].sections[0] as PsstSectionType}
                templateType={templateType}
                basicInfo={data.basicInfo}
                existingData={sectionData}
                onGenerated={(generatedData) => {
                  const sectionType = WIZARD_STEPS[currentStep - 1].sections[0]
                  setSectionData((prev) => ({
                    ...prev,
                    [sectionType]: {
                      ...prev[sectionType],
                      ...generatedData,
                    },
                  }))
                }}
                disabled={!data.basicInfo.itemName}
              />
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="bg-surface-card border-t border-border px-6 py-4 flex items-center justify-between">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors
              ${currentStep === 1
                ? 'text-txt-disabled cursor-not-allowed'
                : 'text-txt-secondary hover:bg-surface-sunken transition-colors'
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
                  w-2 h-2 transition-colors
                  ${step.id === currentStep
                    ? 'bg-brand'
                    : completedSteps.includes(step.id)
                      ? 'bg-black'
                      : 'bg-surface-sunken'
                  }
                `}
              />
            ))}
          </div>

          {currentStep < WIZARD_STEPS.length ? (
            <button
              onClick={handleNextStep}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-surface-inverse text-txt-inverse hover:bg-surface-inverse/90 transition-colors hover:opacity-90 active:scale-[0.97]"
            >
              다음
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand text-white hover:bg-brand-hover transition-colors hover:opacity-90 active:scale-[0.97]"
            >
              <Eye size={16} />
              완료 및 미리보기
            </button>
          )}
        </div>
      </div>

      {/* Validation Panel Modal */}
      {showValidation && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowValidation(false)}
          />
          <div className="relative bg-surface-card w-105 h-full shadow-lg overflow-y-auto">
            <div className="sticky top-0 bg-surface-card border-b border-border px-4 py-3 flex items-center justify-between z-10">
              <h3 className="font-bold text-txt-primary">실시간 점수 분석</h3>
              <button
                onClick={() => setShowValidation(false)}
                className="p-1 hover:bg-surface-sunken transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Real-time Score Panel */}
              <RealtimeScorePanel
                validationResult={validationResult}
                isValidating={isValidating}
                onSectionClick={(section) => {
                  const stepIndex = WIZARD_STEPS.findIndex(s => s.sections.includes(section))
                  if (stepIndex >= 0) {
                    setCurrentStep(stepIndex + 1)
                    setShowValidation(false)
                  }
                }}
                onImprovementClick={(improvement) => {
                  const stepIndex = WIZARD_STEPS.findIndex(s => s.sections.includes(improvement.section))
                  if (stepIndex >= 0) {
                    setCurrentStep(stepIndex + 1)
                    setShowValidation(false)
                  }
                }}
              />

              {/* Rejection Warnings Summary */}
              {totalWarningCounts.total > 0 && (
                <div className="border-t border-border-subtle pt-4">
                  <h4 className="text-[10px] font-medium text-txt-tertiary mb-3">
                    탈락 위험 요소
                  </h4>
                  {Object.entries(allWarnings).map(([section, warnings]) => {
                    if (warnings.length === 0) return null
                    return (
                      <div key={section} className="mb-3">
                        <div className="text-xs font-medium text-txt-secondary mb-1 capitalize">
                          {section}
                        </div>
                        <RejectionWarnings
                          text={Object.values(sectionData[section] || {}).join('\n')}
                          section={section}
                          compact={false}
                        />
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Legacy Validation Panel */}
              <div className="border-t border-border-subtle pt-4">
                <h4 className="text-[10px] font-medium text-txt-tertiary mb-3">
                  상세 체크리스트
                </h4>
                <ValidationPanel
                  templateType={templateType}
                  data={data}
                  sectionData={sectionData}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          data={data}
          sectionData={sectionData}
          template={template}
          onClose={() => setShowPreview(false)}
          onComplete={onComplete}
        />
      )}

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileSidebar(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-surface-card border-r border-border flex flex-col animate-fade-in-up">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-status-info-bg flex items-center justify-center">
                  <FileText size={20} className="text-status-info-text" />
                </div>
                <div>
                  <h1 className="font-bold text-txt-primary text-sm">{template.shortName}</h1>
                  <p className="text-[10px] text-txt-tertiary font-mono">{template.pages}p</p>
                </div>
              </div>
              <button onClick={() => setShowMobileSidebar(false)} className="p-1.5 text-txt-disabled hover:text-txt-primary transition-colors" aria-label="사이드바 닫기">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <StepWizardCompact
                currentStep={currentStep}
                completedSteps={completedSteps}
                onStepClick={(step) => { setCurrentStep(step); setShowMobileSidebar(false) }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BusinessPlanEditor
