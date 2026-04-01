'use client'

import React, { useMemo } from 'react'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  ChevronRight,
} from 'lucide-react'
import {
  FormTemplateType,
  BusinessPlanData,
  PsstSectionType,
  getTemplateById,
  ValidationResult,
  SectionValidation,
  ValidationCheck,
  ImprovementSuggestion,
} from '../../src/types/business-plan'

interface ValidationPanelProps {
  templateType: FormTemplateType
  data: BusinessPlanData
  sectionData: Record<string, Record<string, string>>
  onShowSuggestion?: (section: PsstSectionType, fieldId: string) => void
}

// Validation rules based on PSST framework
const VALIDATION_RULES: Record<PsstSectionType, {
  checks: Array<{
    id: string
    name: string
    check: (data: Record<string, string>, basicInfo: BusinessPlanData['basicInfo']) => boolean
    feedback: string
  }>
}> = {
  problem: {
    checks: [
      {
        id: 'P001',
        name: '고객 관점 서술',
        check: (data) => {
          const text = Object.values(data).join(' ')
          const positiveKeywords = ['고객', '사용자', '소비자', '이용자', '%가', '%의']
          const negativeKeywords = ['우리는', '저는', '내가']
          const hasPositive = positiveKeywords.some(k => text.includes(k))
          const hasNegative = negativeKeywords.some(k => text.includes(k))
          return hasPositive && !hasNegative
        },
        feedback: '문제를 고객 관점에서 서술해주세요. "고객의 N%가 ~를 경험한다" 형식을 권장합니다.',
      },
      {
        id: 'P002',
        name: '정량적 데이터',
        check: (data) => {
          const text = Object.values(data).join(' ')
          const numberMatches = text.match(/\d+/g)
          return numberMatches ? numberMatches.length >= 3 : false
        },
        feedback: '정량적 데이터가 부족합니다. 통계, 설문 결과, 시장 데이터 등 숫자를 추가해주세요.',
      },
      {
        id: 'P003',
        name: '기존 솔루션 한계',
        check: (data) => {
          const text = Object.values(data).join(' ')
          const keywords = ['기존', '현재', '한계', '문제점', '부족', '불편']
          return keywords.filter(k => text.includes(k)).length >= 2
        },
        feedback: '기존 솔루션의 한계점을 명시해주세요.',
      },
      {
        id: 'P004',
        name: '형용사 남용 체크',
        check: (data) => {
          const text = Object.values(data).join(' ')
          const forbidden = ['매우', '굉장히', '엄청난', '혁신적인', '획기적인']
          const count = forbidden.filter(f => text.includes(f)).length
          return count <= 1
        },
        feedback: '추상적 형용사를 줄이고 구체적 수치로 대체해주세요.',
      },
    ],
  },
  solution: {
    checks: [
      {
        id: 'S001',
        name: '고객 가치 명시',
        check: (data) => {
          const text = Object.values(data).join(' ')
          const keywords = ['절감', '향상', '개선', '효율', '편리', '시간', '비용', '만족']
          return keywords.filter(k => text.includes(k)).length >= 2
        },
        feedback: '기술 설명보다 고객이 얻는 가치를 강조해주세요.',
      },
      {
        id: 'S002',
        name: '작동 방식 설명',
        check: (data) => {
          const text = Object.values(data).join(' ')
          const patterns = ['단계', '→', '과정', '방식', '통해', '프로세스']
          return patterns.some(p => text.includes(p))
        },
        feedback: '솔루션이 어떻게 작동하는지 단계별로 설명해주세요.',
      },
      {
        id: 'S003',
        name: '차별화 포인트',
        check: (data) => {
          const text = Object.values(data).join(' ')
          const keywords = ['차별', '다르게', '유일', '특허', '독자', '경쟁사']
          return keywords.some(k => text.includes(k))
        },
        feedback: '경쟁사와 다른 점을 명확히 해주세요.',
      },
      {
        id: 'S004',
        name: 'MVP/개발 현황',
        check: (data) => {
          const text = Object.values(data).join(' ')
          const keywords = ['MVP', '프로토타입', '베타', '출시', '테스트', '사용자', '고객']
          return keywords.some(k => text.includes(k))
        },
        feedback: '현재 개발 현황을 추가해주세요. (MVP, 베타 테스트 등)',
      },
    ],
  },
  scaleup: {
    checks: [
      {
        id: 'SC001',
        name: '시장 규모 (TAM/SAM/SOM)',
        check: (data) => {
          const text = Object.values(data).join(' ')
          const required = ['TAM', 'SAM', 'SOM', '전체 시장', '유효 시장', '목표 시장']
          return required.filter(r => text.includes(r)).length >= 2
        },
        feedback: 'TAM, SAM, SOM을 모두 명시해주세요.',
      },
      {
        id: 'SC002',
        name: '수익 모델',
        check: (data) => {
          const text = Object.values(data).join(' ')
          const keywords = ['수익', '매출', '가격', '구독', '수수료', '판매']
          return keywords.filter(k => text.includes(k)).length >= 2
        },
        feedback: '수익 모델을 구체적으로 명시해주세요.',
      },
      {
        id: 'SC003',
        name: '단계별 성장 전략',
        check: (data) => {
          const text = Object.values(data).join(' ')
          const patterns = ['1단계', '2단계', '3단계', '초기', '중기', '장기', '개월']
          return patterns.filter(p => text.includes(p)).length >= 2
        },
        feedback: '시장 진입과 성장 전략을 단계별로 구분해주세요.',
      },
      {
        id: 'SC004',
        name: '마일스톤',
        check: (data) => {
          const text = Object.values(data).join(' ')
          const patterns = ['개월', '분기', '년', '목표', 'KPI', '달성']
          return patterns.filter(p => text.includes(p)).length >= 2
        },
        feedback: '시간대별 마일스톤과 KPI를 설정해주세요.',
      },
    ],
  },
  team: {
    checks: [
      {
        id: 'T001',
        name: '대표자 역량',
        check: (data) => {
          const text = Object.values(data).join(' ')
          const keywords = ['대표', 'CEO', '창업자', '경력', '년', '전문']
          return keywords.filter(k => text.includes(k)).length >= 2
        },
        feedback: '대표자의 관련 경력과 전문성을 구체적으로 명시해주세요.',
      },
      {
        id: 'T002',
        name: '역할 분담',
        check: (data) => {
          const text = Object.values(data).join(' ')
          const keywords = ['개발', '마케팅', '영업', '기획', '디자인', '운영', '담당']
          return keywords.filter(k => text.includes(k)).length >= 2
        },
        feedback: '팀원별 역할 분담을 명확히 해주세요.',
      },
      {
        id: 'T003',
        name: '팀 차별적 강점',
        check: (data) => {
          const text = Object.values(data).join(' ')
          const keywords = ['강점', '경험', '네트워크', '전문성', '노하우', '역량']
          return keywords.some(k => text.includes(k))
        },
        feedback: '"왜 이 팀이 이 사업을 성공시킬 수 있는가"에 대한 설명을 추가해주세요.',
      },
    ],
  },
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  templateType,
  data,
  sectionData,
  onShowSuggestion,
}) => {
  const template = getTemplateById(templateType)

  const validationResult = useMemo(() => {
    const sections: SectionValidation[] = []
    let totalScore = 0
    let maxScore = 0

    const psstSections: PsstSectionType[] = ['problem', 'solution', 'scaleup', 'team']

    psstSections.forEach((sectionType) => {
      const rules = VALIDATION_RULES[sectionType]
      const sectionContent = sectionData[sectionType] || {}
      const templateSection = template?.sections.find(s => s.type === sectionType)
      const sectionMaxScore = templateSection?.weight || 25

      const checks: ValidationCheck[] = rules.checks.map((rule) => {
        const passed = rule.check(sectionContent, data.basicInfo)
        return {
          id: rule.id,
          name: rule.name,
          passed,
          feedback: passed ? undefined : rule.feedback,
        }
      })

      const passedCount = checks.filter(c => c.passed).length
      const sectionScore = Math.round((passedCount / checks.length) * sectionMaxScore)

      sections.push({
        section: sectionType,
        score: sectionScore,
        maxScore: sectionMaxScore,
        checks,
      })

      totalScore += sectionScore
      maxScore += sectionMaxScore
    })

    // Overall feedback
    const percentage = (totalScore / maxScore) * 100
    let overallFeedback = ''
    if (percentage >= 90) {
      overallFeedback = '훌륭합니다! 심사 통과 가능성이 높습니다.'
    } else if (percentage >= 80) {
      overallFeedback = '잘 작성되었습니다. 아래 개선점을 보완하면 더 좋아집니다.'
    } else if (percentage >= 70) {
      overallFeedback = '기본은 갖추었지만, 개선이 필요한 부분이 있습니다.'
    } else if (percentage >= 50) {
      overallFeedback = '상당한 보완이 필요합니다. 아래 피드백을 참고해주세요.'
    } else {
      overallFeedback = '전면적인 재작성이 필요합니다.'
    }

    // Generate improvement suggestions
    const improvements: ImprovementSuggestion[] = sections
      .flatMap((s) =>
        s.checks
          .filter((c) => !c.passed)
          .map((c) => ({
            section: s.section,
            priority: (s.score / s.maxScore < 0.5 ? 'high' : 'medium') as 'high' | 'medium' | 'low',
            suggestion: c.feedback || '',
          }))
      )
      .slice(0, 5)

    return {
      totalScore,
      maxScore,
      sections,
      overallFeedback,
      improvements,
    } as ValidationResult
  }, [data, sectionData, template])

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100
    if (percentage >= 80) return 'text-status-success-text'
    if (percentage >= 60) return 'text-status-warning-text'
    return 'text-status-danger-text'
  }

  const getScoreBg = (score: number, max: number) => {
    const percentage = (score / max) * 100
    if (percentage >= 80) return 'bg-status-success-bg border-status-success-text/20'
    if (percentage >= 60) return 'bg-status-warning-bg border-status-warning-text/20'
    return 'bg-status-danger-bg border-status-danger-text/20'
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className={`p-4 border ${getScoreBg(validationResult.totalScore, validationResult.maxScore)}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium text-txt-secondary">총점</span>
          <span className={`text-2xl font-bold ${getScoreColor(validationResult.totalScore, validationResult.maxScore)}`}>
            {validationResult.totalScore}/{validationResult.maxScore}
          </span>
        </div>
        <div className="w-full h-2 bg-surface-sunken overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              (validationResult.totalScore / validationResult.maxScore) >= 0.8
                ? 'bg-status-success-text'
                : (validationResult.totalScore / validationResult.maxScore) >= 0.6
                  ? 'bg-status-warning-text'
                  : 'bg-indicator-alert'
            }`}
            style={{ width: `${(validationResult.totalScore / validationResult.maxScore) * 100}%` }}
          />
        </div>
        <p className="text-xs text-txt-secondary mt-2">{validationResult.overallFeedback}</p>
      </div>

      {/* Section Scores */}
      <div>
        <h4 className="text-[10px] font-medium text-txt-tertiary mb-3">
          섹션별 점수
        </h4>
        <div className="space-y-3">
          {validationResult.sections.map((section) => (
            <SectionScore key={section.section} section={section} />
          ))}
        </div>
      </div>

      {/* Improvement Suggestions */}
      {validationResult.improvements.length > 0 && (
        <div>
          <h4 className="text-[10px] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
            <Lightbulb size={12} />
            개선 제안
          </h4>
          <div className="space-y-2">
            {validationResult.improvements.map((imp, idx) => (
              <button
                key={idx}
                onClick={() => onShowSuggestion?.(imp.section, '')}
                className="w-full text-left p-3 bg-surface-card rounded-xl border border-border hover:border-border transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    size={14}
                    className={`mt-0.5 shrink-0 ${
                      imp.priority === 'high' ? 'text-status-danger-text' : 'text-status-warning-text'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono text-txt-tertiary mb-0.5">
                      {imp.section.toUpperCase()}
                    </div>
                    <p className="text-xs text-txt-secondary">{imp.suggestion}</p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-txt-disabled group-hover:text-txt-tertiary transition-colors"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface SectionScoreProps {
  section: SectionValidation
}

const SectionScore: React.FC<SectionScoreProps> = ({ section }) => {
  const [expanded, setExpanded] = React.useState(false)
  const percentage = (section.score / section.maxScore) * 100

  const sectionNames: Record<PsstSectionType, string> = {
    problem: 'Problem (문제 인식)',
    solution: 'Solution (실현 가능성)',
    scaleup: 'Scale-up (성장 전략)',
    team: 'Team (팀 구성)',
  }

  return (
    <div className="border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-surface-sunken transition-colors"
      >
        <div className="flex items-center gap-2">
          {percentage >= 80 ? (
            <CheckCircle2 size={16} className="text-status-success-text" />
          ) : percentage >= 60 ? (
            <AlertTriangle size={16} className="text-status-warning-text" />
          ) : (
            <XCircle size={16} className="text-status-danger-text" />
          )}
          <span className="text-sm font-medium text-txt-secondary">
            {sectionNames[section.section]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${
            percentage >= 80
              ? 'text-status-success-text'
              : percentage >= 60
                ? 'text-status-warning-text'
                : 'text-status-danger-text'
          }`}>
            {section.score}/{section.maxScore}
          </span>
          <ChevronRight
            size={14}
            className={`text-txt-tertiary transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border-subtle">
          <div className="space-y-2">
            {section.checks.map((check) => (
              <div
                key={check.id}
                className="flex items-start gap-2 text-xs"
              >
                {check.passed ? (
                  <CheckCircle2 size={12} className="text-indicator-online mt-0.5 shrink-0" />
                ) : (
                  <XCircle size={12} className="text-status-danger-text mt-0.5 shrink-0" />
                )}
                <div>
                  <span className={check.passed ? 'text-txt-secondary' : 'text-txt-tertiary'}>
                    {check.name}
                  </span>
                  {!check.passed && check.feedback && (
                    <p className="text-txt-tertiary mt-0.5">{check.feedback}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ValidationPanel
