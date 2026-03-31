'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BusinessPlanEditor } from '@/components/business-plan/BusinessPlanEditor'
import { mapIdeaToBusinessPlan, IdeaValidatorArtifacts } from '@/src/lib/ideaToBusinessPlan'
import { FormTemplateType, createEmptyBusinessPlan } from '@/src/types/business-plan'
import { ValidationResult } from '@/src/lib/validationResultsStore'
import { ArrowLeft, FileText, Sparkles } from 'lucide-react'

function BusinessPlanPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const fromIdeaValidator = searchParams.get('from') === 'idea-validator'

  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplateType>('yebi-chogi')
  const [showEditor, setShowEditor] = useState(false)
  const [initialSectionData, setInitialSectionData] = useState<Record<string, Record<string, string>> | undefined>()
  const [validationSource, setValidationSource] = useState<{
    validationId: string
    personaScores?: { developer: number; designer: number; vc: number }
    reflectedAdvice?: string[]
  } | undefined>()
  const [mappingSummary, setMappingSummary] = useState<string>('')

  useEffect(() => {
    const loadIdeaValidatorData = () => {
      if (fromIdeaValidator) {
        try {
          const storedData = sessionStorage.getItem('ideaValidatorData')
          if (storedData) {
            const data = JSON.parse(storedData)

            // Create a validation result object
            const validationResult: ValidationResult = {
              id: data.validationId,
              timestamp: Date.now(),
              projectIdea: data.projectIdea,
              conversationHistory: '',
              reflectedAdvice: data.reflectedAdvice || [],
              artifacts: {
                prd: data.artifacts?.prd ? JSON.stringify(data.artifacts.prd) : undefined,
                jd: data.artifacts?.jd ? JSON.stringify(data.artifacts.jd) : undefined,
              },
            }

            // Map to business plan
            const artifacts: IdeaValidatorArtifacts = {
              prd: data.artifacts?.prd,
              jd: data.artifacts?.jd,
              score: data.artifacts?.score,
              ideaSummary: data.artifacts?.ideaSummary,
              personaScores: data.artifacts?.personaScores,
              actionPlan: data.artifacts?.actionPlan,
            }

            const mappingResult = mapIdeaToBusinessPlan(
              validationResult,
              artifacts,
              selectedTemplate
            )

            setInitialSectionData(mappingResult.sectionData)
            setValidationSource({
              validationId: data.validationId,
              personaScores: data.personaScores,
              reflectedAdvice: data.reflectedAdvice,
            })
            setMappingSummary(
              `${mappingResult.mappingSummary.filledFields}개 필드가 자동으로 채워졌습니다.`
            )

            // Clean up session storage
            sessionStorage.removeItem('ideaValidatorData')
          }
        } catch (error) {
          console.error('Failed to load idea validator data:', error)
        }
      }
      setIsLoading(false)
    }

    loadIdeaValidatorData()
  }, [fromIdeaValidator, selectedTemplate])

  const handleTemplateSelect = (template: FormTemplateType) => {
    setSelectedTemplate(template)
    setShowEditor(true)
  }

  const handleSave = async (data: any) => {
    // TODO: Save to database
    console.log('Saving business plan:', data)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-border border-t-black animate-spin mx-auto mb-4"></div>
          <p className="text-txt-secondary">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (showEditor) {
    return (
      <BusinessPlanEditor
        templateType={selectedTemplate}
        initialSectionData={initialSectionData}
        validationSource={validationSource}
        onSave={handleSave}
        onClose={() => setShowEditor(false)}
      />
    )
  }

  // Template selection screen
  return (
    <div className="min-h-screen bg-surface-sunken p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="hidden sm:flex items-center gap-2 text-sm text-txt-secondary hover:text-txt-primary mb-4"
          >
            <ArrowLeft size={16} />
            돌아가기
          </button>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black flex items-center justify-center">
              <FileText className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-txt-primary">사업계획서 작성</h1>
              <p className="text-txt-secondary">정부지원사업 심사를 위한 사업계획서를 작성합니다</p>
            </div>
          </div>

          {/* Idea Validator Badge */}
          {fromIdeaValidator && mappingSummary && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-600 flex items-center gap-3">
              <Sparkles className="text-purple-600" size={20} />
              <div>
                <p className="text-sm font-medium text-purple-800">Idea Validator 연동됨</p>
                <p className="text-xs text-purple-600">{mappingSummary}</p>
              </div>
            </div>
          )}
        </div>

        {/* Template Selection */}
        <div className="mb-6">
          <h2 className="text-[0.625rem] font-medium text-txt-tertiary mb-4">양식 선택</h2>
          <p className="text-sm text-txt-secondary mb-6">
            작성하려는 정부지원사업에 맞는 양식을 선택하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Template Cards */}
          <TemplateCard
            id="yebi-chogi"
            name="예비/초기창업패키지"
            description="PSST 표준 양식, 사업비 집행계획 포함"
            pages={15}
            features={['PSST 표준', '사업비 집행계획', '개발 로드맵']}
            recommended
            onClick={() => handleTemplateSelect('yebi-chogi')}
          />
          <TemplateCard
            id="student-300"
            name="학생창업유망팀300"
            description="비즈니스 모델 캔버스, 팀 시너지 강조"
            pages={15}
            features={['비즈니스 모델 캔버스', '팀 시너지', 'PSST']}
            onClick={() => handleTemplateSelect('student-300')}
          />
          <TemplateCard
            id="saengae-chungnyeon"
            name="생애최초청년창업"
            description="PSST + 협동가능성(Cooperation) 포함"
            pages={9}
            features={['PSST', '협동가능성(C)', '청년 특화']}
            onClick={() => handleTemplateSelect('saengae-chungnyeon')}
          />
          <TemplateCard
            id="oneul-jeongtong"
            name="오늘전통"
            description="전통문화 활용, 사회적 가치 강조"
            pages={10}
            features={['전통문화 활용', '사회적 가치', 'PSST']}
            onClick={() => handleTemplateSelect('oneul-jeongtong')}
          />
          <TemplateCard
            id="gyeonggi-g-star"
            name="경기G스타오디션"
            description="지역 연관성, 조직역량 강조"
            pages={10}
            features={['지역 연관성', '조직역량', 'PSST']}
            onClick={() => handleTemplateSelect('gyeonggi-g-star')}
          />
        </div>
      </div>
    </div>
  )
}

// Template Card Component
interface TemplateCardProps {
  id: string
  name: string
  description: string
  pages: number
  features: string[]
  recommended?: boolean
  onClick: () => void
}

function TemplateCard({ id, name, description, pages, features, recommended, onClick }: TemplateCardProps) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-5 bg-surface-card border hover:shadow-md hover-spring group ${
        recommended ? 'border-brand ring-2 ring-brand-border' : 'border-border hover:border-border'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-txt-disabled group-hover:text-txt-secondary" />
          <h3 className="font-semibold text-txt-primary">{name}</h3>
        </div>
        {recommended && (
          <span className="px-2 py-0.5 border border-brand text-brand text-[0.625rem] font-mono font-bold">
            추천
          </span>
        )}
      </div>

      <p className="text-sm text-txt-secondary mb-3">{description}</p>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {features.slice(0, 2).map((feature, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-surface-sunken text-txt-secondary text-[0.625rem] font-mono border border-border">
              {feature}
            </span>
          ))}
        </div>
        <span className="text-xs text-txt-disabled font-mono">{pages}p</span>
      </div>
    </button>
  )
}

export default function BusinessPlanPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-border border-t-black animate-spin"></div>
      </div>
    }>
      <BusinessPlanPageContent />
    </Suspense>
  )
}
