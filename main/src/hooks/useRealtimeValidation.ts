'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  BusinessPlanData,
  PsstSectionType,
  BusinessPlanBasicInfo
} from '../types/business-plan'

// Validation check result
export interface ValidationCheckResult {
  id: string
  name: string
  passed: boolean
  weight: number
  feedback?: string
  potentialGain?: number // Points to gain if fixed
}

// Section validation result
export interface SectionValidationResult {
  section: PsstSectionType
  score: number
  maxScore: number
  checks: ValidationCheckResult[]
  percentage: number
}

// Overall validation result
export interface RealtimeValidationResult {
  totalScore: number
  maxScore: number
  percentage: number
  passingScore: number
  isPassingThreshold: boolean
  sections: SectionValidationResult[]
  topImprovements: ImprovementItem[]
  lastUpdated: number
}

export interface ImprovementItem {
  section: PsstSectionType
  checkId: string
  checkName: string
  feedback: string
  potentialGain: number
  priority: 'high' | 'medium' | 'low'
}

// Validation rules based on PSST framework and psst_validation_system.json
const VALIDATION_RULES: Record<PsstSectionType, {
  maxScore: number
  checks: Array<{
    id: string
    name: string
    weight: number
    check: (data: Record<string, string>, basicInfo: BusinessPlanBasicInfo) => boolean
    feedback: string
  }>
}> = {
  problem: {
    maxScore: 20,
    checks: [
      {
        id: 'P001',
        name: '고객 관점 서술',
        weight: 3,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const positiveKeywords = ['고객', '사용자', '소비자', '이용자', '%가', '%의', '사람들']
          const negativeKeywords = ['우리는', '저는', '내가']
          const hasPositive = positiveKeywords.some(k => text.includes(k))
          const tooManyNegative = negativeKeywords.filter(k => text.includes(k)).length >= 2
          return hasPositive && !tooManyNegative
        },
        feedback: '문제를 고객 관점에서 서술해주세요. "고객의 N%가 ~를 경험한다" 형식을 권장합니다.',
      },
      {
        id: 'P002',
        name: '정량적 데이터',
        weight: 4,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const numberMatches = text.match(/\d+(\.\d+)?(%|명|원|억|조|만|개|년|월|일)?/g)
          return numberMatches ? numberMatches.length >= 3 : false
        },
        feedback: '정량적 데이터가 부족합니다. 통계, 설문 결과, 시장 데이터 등 숫자를 추가해주세요.',
      },
      {
        id: 'P003',
        name: '출처 명시',
        weight: 2,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const sourcePatterns = ['출처', '자료', /\(.*\d{4}.*\)/, '조사', '통계청', '연구', '보고서']
          return sourcePatterns.some(p =>
            typeof p === 'string' ? text.includes(p) : p.test(text)
          )
        },
        feedback: '데이터 출처를 명시해주세요. (예: "통계청, 2024" 또는 "자체 설문조사 N명")',
      },
      {
        id: 'P004',
        name: '기존 솔루션 한계',
        weight: 3,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const keywords = ['기존', '현재', '한계', '문제점', '부족', '불편', '비용', '어려움']
          return keywords.filter(k => text.includes(k)).length >= 2
        },
        feedback: '기존 솔루션의 한계점을 명시해주세요. 왜 현재 대안이 충분하지 않은지 설명이 필요합니다.',
      },
      {
        id: 'P005',
        name: '적절한 분량',
        weight: 2,
        check: (data) => {
          const text = Object.values(data).join(' ')
          return text.length >= 200 && text.length <= 2000
        },
        feedback: '문제 인식 섹션은 200-2000자 사이로 작성해주세요.',
      },
      {
        id: 'P006',
        name: '형용사 남용 체크',
        weight: 3,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const forbidden = ['매우', '굉장히', '엄청난', '혁신적인', '획기적인', '최고의', '최초의']
          const count = forbidden.filter(f => text.includes(f)).length
          return count <= 1
        },
        feedback: '추상적 형용사를 줄이고 구체적 수치로 대체해주세요. "매우 큰" → "연 1조원 규모의"',
      },
    ],
  },
  solution: {
    maxScore: 30,
    checks: [
      {
        id: 'S001',
        name: 'P-S 매칭',
        weight: 5,
        check: (data) => {
          const text = Object.values(data).join(' ')
          // Check if solution addresses problems mentioned
          const solutionKeywords = ['해결', '개선', '제공', '통해', '가능']
          return solutionKeywords.filter(k => text.includes(k)).length >= 2
        },
        feedback: 'Problem에서 제시한 각 문제에 대응하는 해결책을 명시해주세요.',
      },
      {
        id: 'S002',
        name: '고객 가치 명시',
        weight: 4,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const keywords = ['절감', '향상', '개선', '효율', '편리', '시간', '비용', '만족', '증가', '감소']
          return keywords.filter(k => text.includes(k)).length >= 2
        },
        feedback: '기술 설명보다 고객이 얻는 가치를 강조해주세요. "~를 통해 N% 절감/향상"',
      },
      {
        id: 'S003',
        name: '작동 방식 설명',
        weight: 4,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const patterns = ['단계', '→', '과정', '방식', '통해', '프로세스', '순서', '먼저', '다음']
          return patterns.filter(p => text.includes(p)).length >= 2
        },
        feedback: '솔루션이 어떻게 작동하는지 단계별로 설명해주세요.',
      },
      {
        id: 'S004',
        name: '차별화 포인트',
        weight: 5,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const keywords = ['차별', '다르게', '유일', '특허', '독자', '경쟁사', '기존', '최초', '독점']
          return keywords.filter(k => text.includes(k)).length >= 1
        },
        feedback: '경쟁사와 다른 점을 명확히 해주세요. 기술적/비즈니스적 차별점이 필요합니다.',
      },
      {
        id: 'S005',
        name: 'MVP/개발 현황',
        weight: 5,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const keywords = ['MVP', '프로토타입', '베타', '출시', '테스트', '사용자', '고객', '개발', '완료']
          return keywords.filter(k => text.includes(k)).length >= 1
        },
        feedback: '현재 개발 현황을 추가해주세요. MVP, 베타 테스트, 초기 사용자 피드백 등.',
      },
      {
        id: 'S006',
        name: '핵심 기능 명시',
        weight: 4,
        check: (data) => {
          const text = Object.values(data).join(' ')
          // Check for bullet points or numbered lists suggesting features
          const hasFeatureList = text.includes('•') || text.includes('-') || /\d\.\s/.test(text)
          const featureKeywords = ['기능', '제공', '지원', '가능', '서비스']
          return hasFeatureList || featureKeywords.filter(k => text.includes(k)).length >= 2
        },
        feedback: '핵심 기능을 3-5개로 정리해주세요. 리스트 형식을 권장합니다.',
      },
    ],
  },
  scaleup: {
    maxScore: 30,
    checks: [
      {
        id: 'SC001',
        name: '시장 규모 (TAM/SAM/SOM)',
        weight: 5,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const required = ['TAM', 'SAM', 'SOM', '전체 시장', '유효 시장', '목표 시장']
          return required.filter(r => text.includes(r)).length >= 2
        },
        feedback: 'TAM(전체 시장), SAM(유효 시장), SOM(목표 시장)을 모두 명시해주세요.',
      },
      {
        id: 'SC002',
        name: '시장 출처',
        weight: 3,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const hasMarket = ['시장', 'TAM', 'SAM', 'SOM'].some(k => text.includes(k))
          const hasSource = ['출처', '자료', /\(.*\d{4}.*\)/, 'Statista', '보고서'].some(p =>
            typeof p === 'string' ? text.includes(p) : p.test(text)
          )
          return !hasMarket || hasSource
        },
        feedback: '시장 규모 데이터의 출처를 명시해주세요. (예: "Statista, 2024")',
      },
      {
        id: 'SC003',
        name: '수익 모델',
        weight: 5,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const keywords = ['수익', '매출', '가격', '구독', '수수료', '판매', '과금', 'BM', '비즈니스 모델']
          return keywords.filter(k => text.includes(k)).length >= 2
        },
        feedback: '수익 모델을 구체적으로 명시해주세요. 어떻게 돈을 벌 것인지?',
      },
      {
        id: 'SC004',
        name: '단계별 성장 전략',
        weight: 4,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const patterns = ['1단계', '2단계', '3단계', '초기', '중기', '장기', '단계', 'Phase']
          return patterns.filter(p => text.includes(p)).length >= 2
        },
        feedback: '시장 진입과 성장 전략을 단계별로 구분해주세요.',
      },
      {
        id: 'SC005',
        name: '마케팅/영업 채널',
        weight: 4,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const keywords = ['마케팅', '영업', '채널', '광고', '제휴', '파트너', 'SNS', 'B2B', 'B2C', '온라인', '오프라인']
          return keywords.filter(k => text.includes(k)).length >= 2
        },
        feedback: '고객 확보 채널을 구체적으로 명시해주세요. 온라인/오프라인, B2B/B2C 등.',
      },
      {
        id: 'SC006',
        name: '자금 사용 계획',
        weight: 4,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const keywords = ['자금', '예산', '비용', '투입', '사용', '계획', '투자', '%']
          return keywords.filter(k => text.includes(k)).length >= 2
        },
        feedback: '지원금 사용 계획을 항목별로 구체화해주세요. (예: 개발비 40%, 마케팅비 30%)',
      },
      {
        id: 'SC007',
        name: '마일스톤 설정',
        weight: 4,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const patterns = ['개월', '분기', '년', '목표', 'KPI', '달성', '월', '주']
          return patterns.filter(p => text.includes(p)).length >= 2
        },
        feedback: '시간대별 마일스톤과 KPI를 설정해주세요. (예: "6개월 후 MAU 1만명")',
      },
    ],
  },
  team: {
    maxScore: 20,
    checks: [
      {
        id: 'T001',
        name: '대표자 역량',
        weight: 5,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const keywords = ['대표', 'CEO', '창업자', '경력', '년', '전문', '경험']
          return keywords.filter(k => text.includes(k)).length >= 2
        },
        feedback: '대표자의 관련 경력과 전문성을 구체적으로 명시해주세요.',
      },
      {
        id: 'T002',
        name: '역할 분담',
        weight: 4,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const keywords = ['개발', '마케팅', '영업', '기획', '디자인', '운영', '담당', 'CTO', 'CMO', 'COO']
          return keywords.filter(k => text.includes(k)).length >= 2
        },
        feedback: '팀원별 역할 분담을 명확히 해주세요. (개발, 마케팅, 운영 등)',
      },
      {
        id: 'T003',
        name: '팀 차별적 강점',
        weight: 5,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const keywords = ['강점', '경험', '네트워크', '전문성', '노하우', '역량', '출신', '경력']
          return keywords.filter(k => text.includes(k)).length >= 2
        },
        feedback: '"왜 이 팀이 이 사업을 성공시킬 수 있는가"에 대한 설명을 추가해주세요.',
      },
      {
        id: 'T004',
        name: '부족 역량 보완 계획',
        weight: 3,
        check: (data) => {
          const text = Object.values(data).join(' ')
          const keywords = ['채용', '보완', '필요', '예정', '자문', '파트너', '계획', '협력']
          return keywords.filter(k => text.includes(k)).length >= 1
        },
        feedback: '부족한 역량이 있다면 어떻게 보완할 것인지 계획을 명시해주세요.',
      },
      {
        id: 'T005',
        name: '구체적 경력 명시',
        weight: 3,
        check: (data) => {
          const text = Object.values(data).join(' ')
          // Check for specific years or company names
          const hasYears = /\d+년/.test(text)
          const hasSpecific = ['출신', '근무', '재직', '설립', '창업'].some(k => text.includes(k))
          return hasYears || hasSpecific
        },
        feedback: '팀원들의 구체적인 경력 연수와 이전 소속을 명시해주세요.',
      },
    ],
  },
}

const PASSING_SCORE = 70

export function useRealtimeValidation(
  sectionData: Record<string, Record<string, string>>,
  basicInfo: BusinessPlanBasicInfo,
  debounceMs: number = 300
) {
  const [validationResult, setValidationResult] = useState<RealtimeValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate validation for a single section
  const validateSection = useCallback((
    sectionType: PsstSectionType,
    data: Record<string, string>
  ): SectionValidationResult => {
    const rules = VALIDATION_RULES[sectionType]
    const checks: ValidationCheckResult[] = []
    let sectionScore = 0

    for (const rule of rules.checks) {
      const passed = rule.check(data, basicInfo)
      const earnedPoints = passed ? rule.weight : 0
      sectionScore += earnedPoints

      checks.push({
        id: rule.id,
        name: rule.name,
        passed,
        weight: rule.weight,
        feedback: passed ? undefined : rule.feedback,
        potentialGain: passed ? 0 : rule.weight,
      })
    }

    return {
      section: sectionType,
      score: sectionScore,
      maxScore: rules.maxScore,
      checks,
      percentage: Math.round((sectionScore / rules.maxScore) * 100),
    }
  }, [basicInfo])

  // Calculate full validation
  const calculateValidation = useCallback((): RealtimeValidationResult => {
    const sections: SectionValidationResult[] = []
    const psstSections: PsstSectionType[] = ['problem', 'solution', 'scaleup', 'team']

    for (const sectionType of psstSections) {
      const sectionContent = sectionData[sectionType] || {}
      sections.push(validateSection(sectionType, sectionContent))
    }

    const totalScore = sections.reduce((sum, s) => sum + s.score, 0)
    const maxScore = sections.reduce((sum, s) => sum + s.maxScore, 0)
    const percentage = Math.round((totalScore / maxScore) * 100)

    // Generate top improvements sorted by potential gain
    const allImprovements: ImprovementItem[] = []
    for (const section of sections) {
      for (const check of section.checks) {
        if (!check.passed && check.feedback) {
          allImprovements.push({
            section: section.section,
            checkId: check.id,
            checkName: check.name,
            feedback: check.feedback,
            potentialGain: check.potentialGain || check.weight,
            priority: check.weight >= 5 ? 'high' : check.weight >= 3 ? 'medium' : 'low',
          })
        }
      }
    }

    // Sort by potential gain (highest first)
    allImprovements.sort((a, b) => b.potentialGain - a.potentialGain)

    return {
      totalScore,
      maxScore,
      percentage,
      passingScore: PASSING_SCORE,
      isPassingThreshold: percentage >= PASSING_SCORE,
      sections,
      topImprovements: allImprovements.slice(0, 5),
      lastUpdated: Date.now(),
    }
  }, [sectionData, validateSection])

  // Debounced validation
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    setIsValidating(true)

    debounceTimerRef.current = setTimeout(() => {
      const result = calculateValidation()
      setValidationResult(result)
      setIsValidating(false)
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [sectionData, calculateValidation, debounceMs])

  // Get score for a specific section
  const getSectionScore = useCallback((sectionType: PsstSectionType): SectionValidationResult | null => {
    if (!validationResult) return null
    return validationResult.sections.find(s => s.section === sectionType) || null
  }, [validationResult])

  // Calculate what the score would be if a specific check passed
  const getScoreIfFixed = useCallback((sectionType: PsstSectionType, checkId: string): number => {
    if (!validationResult) return 0
    const section = validationResult.sections.find(s => s.section === sectionType)
    if (!section) return 0
    const check = section.checks.find(c => c.id === checkId)
    if (!check || check.passed) return validationResult.totalScore
    return validationResult.totalScore + check.weight
  }, [validationResult])

  // Force recalculation
  const forceValidate = useCallback(() => {
    setIsValidating(true)
    const result = calculateValidation()
    setValidationResult(result)
    setIsValidating(false)
    return result
  }, [calculateValidation])

  return {
    validationResult,
    isValidating,
    getSectionScore,
    getScoreIfFixed,
    forceValidate,
    passingScore: PASSING_SCORE,
  }
}

export default useRealtimeValidation
