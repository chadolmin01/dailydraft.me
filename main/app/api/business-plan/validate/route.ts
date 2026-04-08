import { NextRequest } from 'next/server'
import {
  getEvaluationCriteria,
  DISQUALIFICATION_CONDITIONS,
  FormEvaluationCriteria
} from '@/src/lib/evaluation-criteria'
import { ApiResponse } from '@/src/lib/api-utils'
import { FormTemplateType } from '@/src/types/business-plan'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// Validation rules based on PSST framework (2025년 공고문 기반)
interface ValidationRule {
  id: string
  name: string
  weight: number
  check: (text: string) => boolean
  feedback: string
}

const VALIDATION_RULES: Record<string, ValidationRule[]> = {
  problem: [
    {
      id: 'P001',
      name: '고객 관점 서술',
      weight: 3,
      check: (text) => {
        const positiveKeywords = ['고객', '사용자', '소비자', '이용자', '%가', '%의', '의견', '설문']
        const negativeKeywords = ['우리는', '저는', '내가', '제가']
        const hasPositive = positiveKeywords.some(k => text.includes(k))
        const hasNegative = negativeKeywords.some(k => text.includes(k))
        return hasPositive && !hasNegative
      },
      feedback: '문제를 고객 관점에서 서술해주세요. "고객의 N%가 ~를 경험한다" 형식을 권장합니다.'
    },
    {
      id: 'P002',
      name: '정량적 데이터',
      weight: 4,
      check: (text) => {
        const numberMatches = text.match(/\d+/g)
        const hasPercentage = /%/.test(text)
        const hasNumbers = numberMatches ? numberMatches.length >= 3 : false
        return hasNumbers || hasPercentage
      },
      feedback: '정량적 데이터가 부족합니다. 통계, 설문 결과, 시장 데이터 등 숫자를 추가해주세요.'
    },
    {
      id: 'P003',
      name: '출처 명시',
      weight: 2,
      check: (text) => {
        const patterns = ['출처', '자료', '조사', '통계청', '연구', '설문', '인터뷰', '2023', '2024', '2025', '2026']
        return patterns.some(p => text.includes(p))
      },
      feedback: '데이터 출처를 명시해주세요. (예: "통계청, 2024" 또는 "자체 설문조사 N명")'
    },
    {
      id: 'P004',
      name: '기존 솔루션 한계',
      weight: 3,
      check: (text) => {
        const keywords = ['기존', '현재', '한계', '문제점', '부족', '불편', '비용', '경쟁사', '대안']
        return keywords.filter(k => text.includes(k)).length >= 2
      },
      feedback: '기존 솔루션의 한계점을 명시해주세요. 왜 현재 대안이 충분하지 않은지 설명이 필요합니다.'
    },
    {
      id: 'P005',
      name: '형용사 남용 체크',
      weight: 2,
      check: (text) => {
        const forbidden = ['매우', '굉장히', '엄청난', '혁신적인', '획기적인', '최고의', '최초의', '완벽한']
        const count = forbidden.filter(f => text.includes(f)).length
        return count <= 1
      },
      feedback: '추상적 형용사를 줄이고 구체적 수치로 대체해주세요. "매우 큰" → "연 1조원 규모의"'
    }
  ],
  solution: [
    {
      id: 'S001',
      name: '고객 가치 명시',
      weight: 4,
      check: (text) => {
        const keywords = ['절감', '향상', '개선', '효율', '편리', '시간', '비용', '만족', '가치', '혜택']
        return keywords.filter(k => text.includes(k)).length >= 2
      },
      feedback: '기술 설명보다 고객이 얻는 가치를 강조해주세요. "~를 통해 N% 절감/향상"'
    },
    {
      id: 'S002',
      name: '작동 방식 설명',
      weight: 3,
      check: (text) => {
        const patterns = ['단계', '→', '과정', '방식', '통해', '프로세스', '절차', '흐름']
        return patterns.some(p => text.includes(p))
      },
      feedback: '솔루션이 어떻게 작동하는지 단계별로 설명해주세요.'
    },
    {
      id: 'S003',
      name: '차별화 포인트',
      weight: 4,
      check: (text) => {
        const keywords = ['차별', '다르게', '유일', '특허', '독자', '경쟁사', '기존', '최초', '유일한']
        return keywords.some(k => text.includes(k))
      },
      feedback: '경쟁사와 다른 점을 명확히 해주세요. 기술적/비즈니스적 차별점이 필요합니다.'
    },
    {
      id: 'S004',
      name: 'MVP/개발 현황',
      weight: 5,
      check: (text) => {
        const keywords = ['MVP', '프로토타입', '베타', '출시', '테스트', '사용자', '고객', '개발', '완료']
        return keywords.filter(k => text.includes(k)).length >= 2
      },
      feedback: '현재 개발 현황을 추가해주세요. (MVP, 베타 테스트, 초기 사용자 피드백 등)'
    }
  ],
  scaleup: [
    {
      id: 'SC001',
      name: '시장 규모 (TAM/SAM/SOM)',
      weight: 5,
      check: (text) => {
        const required = ['TAM', 'SAM', 'SOM', '전체 시장', '유효 시장', '목표 시장', '시장 규모']
        return required.filter(r => text.includes(r)).length >= 2
      },
      feedback: 'TAM(전체 시장), SAM(유효 시장), SOM(목표 시장)을 모두 명시해주세요.'
    },
    {
      id: 'SC002',
      name: '수익 모델',
      weight: 5,
      check: (text) => {
        const keywords = ['수익', '매출', '가격', '구독', '수수료', '판매', '과금', '모델', 'BM']
        return keywords.filter(k => text.includes(k)).length >= 2
      },
      feedback: '수익 모델을 구체적으로 명시해주세요. 어떻게 돈을 벌 것인지?'
    },
    {
      id: 'SC003',
      name: '단계별 성장 전략',
      weight: 4,
      check: (text) => {
        const patterns = ['1단계', '2단계', '3단계', '초기', '중기', '장기', '개월', '년']
        return patterns.filter(p => text.includes(p)).length >= 2
      },
      feedback: '시장 진입과 성장 전략을 단계별로 구분해주세요.'
    },
    {
      id: 'SC004',
      name: '마일스톤',
      weight: 3,
      check: (text) => {
        const patterns = ['개월', '분기', '년', '목표', 'KPI', '달성', '계획', '로드맵']
        return patterns.filter(p => text.includes(p)).length >= 2
      },
      feedback: '시간대별 마일스톤과 KPI를 설정해주세요. (예: "6개월 후 MAU 1만명")'
    }
  ],
  team: [
    {
      id: 'T001',
      name: '대표자 역량',
      weight: 4,
      check: (text) => {
        const keywords = ['대표', 'CEO', '창업자', '경력', '년', '전문', '출신', '경험']
        return keywords.filter(k => text.includes(k)).length >= 2
      },
      feedback: '대표자의 관련 경력과 전문성을 구체적으로 명시해주세요.'
    },
    {
      id: 'T002',
      name: '역할 분담',
      weight: 3,
      check: (text) => {
        const keywords = ['개발', '마케팅', '영업', '기획', '디자인', '운영', '담당', 'CTO', 'CMO', 'COO']
        return keywords.filter(k => text.includes(k)).length >= 2
      },
      feedback: '팀원별 역할 분담을 명확히 해주세요. (개발, 마케팅, 운영 등)'
    },
    {
      id: 'T003',
      name: '팀 차별적 강점',
      weight: 4,
      check: (text) => {
        const keywords = ['강점', '경험', '네트워크', '전문성', '노하우', '역량', '시너지']
        return keywords.some(k => text.includes(k))
      },
      feedback: '"왜 이 팀이 이 사업을 성공시킬 수 있는가"에 대한 설명을 추가해주세요.'
    },
    {
      id: 'T004',
      name: '부족 역량 보완 계획',
      weight: 3,
      check: (text) => {
        const keywords = ['채용', '보완', '필요', '예정', '자문', '파트너', '계획', '확보']
        return keywords.filter(k => text.includes(k)).length >= 1
      },
      feedback: '부족한 역량이 있다면 어떻게 보완할 것인지 계획을 명시해주세요.'
    }
  ]
}

// Score ranges for feedback (60점 이상이 최소 기준)
const SCORE_RANGES = {
  excellent: { min: 90, message: '훌륭합니다! 심사 통과 가능성이 높습니다.' },
  good: { min: 80, message: '잘 작성되었습니다. 아래 개선점을 보완하면 더 좋아집니다.' },
  fair: { min: 70, message: '기본은 갖추었지만, 개선이 필요한 부분이 있습니다.' },
  needs_work: { min: 60, message: '최소 기준(60점)을 충족했지만, 선정을 위해 보완이 필요합니다.' },
  insufficient: { min: 0, message: '⚠️ 60점 미만! 현재 상태로는 선정 대상에서 제외됩니다. 전면적인 보완이 필요합니다.' }
}

// 양식별 가점 체크
function checkBonusPoints(
  templateType: FormTemplateType,
  text: string,
  basicInfo?: { industry?: string }
): { earned: number; possible: number; details: string[] } {
  const criteria = getEvaluationCriteria(templateType)
  const details: string[] = []
  let earned = 0
  let possible = 0

  for (const bonus of criteria.bonusPoints) {
    possible += bonus.score

    // 기후테크 분야 체크
    if (bonus.condition.includes('기후테크')) {
      const climateKeywords = ['기후', '탄소', '재생에너지', '에너지', '친환경', '넷제로', '탄소중립', '클린테크', '에코', '업사이클링']
      if (climateKeywords.some(k => text.includes(k))) {
        earned += bonus.score
        details.push(`✅ ${bonus.condition} (+${bonus.score}점)`)
      } else {
        details.push(`⬜ ${bonus.condition} (해당 시 +${bonus.score}점)`)
      }
    }
    // AI 대학원 졸업생 체크
    else if (bonus.condition.includes('인공지능') || bonus.condition.includes('대학원')) {
      const universities = bonus.categories || []
      if (universities.some(u => text.includes(u))) {
        earned += bonus.score
        details.push(`✅ ${bonus.condition} (+${bonus.score}점)`)
      } else {
        details.push(`⬜ ${bonus.condition} (해당 시 +${bonus.score}점)`)
      }
    }
    // 기타 가점 조건
    else {
      details.push(`⬜ ${bonus.condition} (해당 시 +${bonus.score}점)`)
    }
  }

  return { earned, possible, details }
}

// 실격 조건 체크
function checkDisqualifications(text: string): string[] {
  const warnings: string[] = []

  // 개인정보 노출 체크
  const personalInfoPatterns = [
    /\d{6}[-\s]?\d{7}/,  // 주민번호 패턴
    /\d{3}[-\s]?\d{4}[-\s]?\d{4}/,  // 전화번호 패턴
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/  // 이메일 패턴
  ]
  for (const pattern of personalInfoPatterns) {
    if (pattern.test(text)) {
      warnings.push('⚠️ 개인정보(연락처/이메일 등)가 포함되어 있을 수 있습니다. 마스킹 처리가 필요합니다.')
      break
    }
  }

  // 표절/도용 관련 경고 문구
  const plagiarismKeywords = ['복사', 'copy', '인용', '참고문헌', '출처 없음']
  if (plagiarismKeywords.some(k => text.toLowerCase().includes(k))) {
    warnings.push('⚠️ 타인의 사업계획서 모방/표절 시 3년간 참여제한 및 사업비 환수 대상입니다.')
  }

  return warnings
}

export const POST = withErrorCapture(async (req: NextRequest) => {
  const body = await req.json()
  const { sectionData, basicInfo, templateType = 'yebi-chogi' } = body

    if (!sectionData) {
      return ApiResponse.badRequest('검증할 데이터가 필요합니다.')
    }

    // 양식별 평가기준 가져오기
    const formCriteria = getEvaluationCriteria(templateType as FormTemplateType)

    const results: Record<string, {
      score: number
      maxScore: number
      checks: Array<{
        id: string
        name: string
        passed: boolean
        feedback?: string
      }>
    }> = {}

    let totalScore = 0
    let totalMaxScore = 0
    let allText = ''

    // Validate each section
    for (const [section, rules] of Object.entries(VALIDATION_RULES)) {
      const sectionContent = sectionData[section]
      if (!sectionContent) continue

      // Combine all field contents
      const combinedText = typeof sectionContent === 'string'
        ? sectionContent
        : Object.values(sectionContent).join(' ')
      allText += ' ' + combinedText

      const checks = rules.map(rule => {
        const passed = rule.check(combinedText)
        return {
          id: rule.id,
          name: rule.name,
          passed,
          feedback: passed ? undefined : rule.feedback
        }
      })

      const sectionMaxScore = rules.reduce((sum, r) => sum + r.weight, 0)
      const sectionScore = checks.reduce((sum, c, i) => {
        return sum + (c.passed ? rules[i].weight : 0)
      }, 0)

      results[section] = {
        score: sectionScore,
        maxScore: sectionMaxScore,
        checks
      }

      totalScore += sectionScore
      totalMaxScore += sectionMaxScore
    }

    // Calculate overall percentage and feedback
    const percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0
    let overallFeedback = SCORE_RANGES.insufficient.message

    for (const [_, range] of Object.entries(SCORE_RANGES)) {
      if (percentage >= range.min) {
        overallFeedback = range.message
        break
      }
    }

    // 가점 체크
    const bonusCheck = checkBonusPoints(templateType as FormTemplateType, allText, basicInfo)

    // 실격 조건 체크
    const disqualificationWarnings = checkDisqualifications(allText)

    // Generate improvement suggestions
    const improvements: Array<{
      section: string
      priority: 'high' | 'medium' | 'low'
      suggestion: string
    }> = []

    for (const [section, result] of Object.entries(results)) {
      const sectionPercentage = (result.score / result.maxScore) * 100

      for (const check of result.checks) {
        if (!check.passed && check.feedback) {
          improvements.push({
            section,
            priority: sectionPercentage < 50 ? 'high' : sectionPercentage < 60 ? 'medium' : 'low',
            suggestion: check.feedback
          })
        }
      }
    }

    // Sort by priority and limit to top 5
    const sortedImprovements = improvements
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
      .slice(0, 5)

    // 60점이 최소 기준
    const minimumThreshold = formCriteria.minimumScore

    return ApiResponse.ok({
      totalScore,
      maxScore: totalMaxScore,
      percentage: Math.round(percentage),
      overallFeedback,
      sections: results,
      improvements: sortedImprovements,
      passThreshold: minimumThreshold,
      isPassing: percentage >= minimumThreshold,
      // 추가: 양식별 정보
      formInfo: {
        name: formCriteria.name,
        target: formCriteria.target,
        minimumScore: minimumThreshold,
        period: formCriteria.period
      },
      // 추가: 가점 정보
      bonusPoints: {
        earned: bonusCheck.earned,
        possible: bonusCheck.possible,
        details: bonusCheck.details
      },
      // 추가: 실격 경고
      warnings: disqualificationWarnings
    })
})
