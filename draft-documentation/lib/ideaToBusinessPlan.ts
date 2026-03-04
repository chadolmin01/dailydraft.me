// Idea Validator 결과 → 사업계획서 자동 매핑
// 검증된 아이디어를 사업계획서 양식에 맞게 변환

import {
  BusinessPlanData,
  BusinessPlanBasicInfo,
  FormTemplateType,
  IndustryType,
} from './types'

// PRD 구조 (Idea Validator에서 생성)
export interface PrdStructure {
  projectName: string
  tagline: string
  version: string
  overview: string
  targetAudience: string[]
  coreFeatures: Array<{
    name: string
    description: string
    priority: 'High' | 'Medium' | 'Low'
    effort: 'High' | 'Medium' | 'Low'
  }>
  techStack: string[]
  successMetrics: string[]
}

// JD 구조
export interface JdStructure {
  roleTitle: string
  department: string
  companyIntro: string
  responsibilities: string[]
  qualifications: string[]
  preferred: string[]
  benefits: string[]
}

// Persona Scores
export interface PersonaScores {
  developer: number
  designer: number
  vc: number
}

// Action Plan
export interface ActionPlan {
  developer: string[]
  designer: string[]
  vc: string[]
}

// Validation Result (from Idea Validator)
export interface ValidationResult {
  id: string
  timestamp: number
  projectIdea: string
  conversationHistory: string
  reflectedAdvice: string[]
  artifacts?: {
    prd?: string | PrdStructure
    jd?: string | JdStructure
  }
  score?: number
  personaScores?: PersonaScores
  actionPlan?: ActionPlan
}

// Mapping result
export interface IdeaToBusinessPlanResult {
  businessPlan: BusinessPlanData
  sectionData: Record<string, Record<string, string>>
  mappingSummary: {
    filledFields: number
    totalFields: number
    sourceValidationId?: string
    confidence: number
  }
}

// Detect industry from idea text
function detectIndustry(text: string): IndustryType {
  const industryKeywords: Record<IndustryType, string[]> = {
    it_platform: ['플랫폼', 'SaaS', 'AI', '앱', '소프트웨어', '매칭', '자동화', 'API'],
    manufacturing: ['제조', '하드웨어', '생산', 'IoT', '장비', '기계'],
    bio_healthcare: ['헬스케어', '의료', '바이오', '건강', '진단', '치료'],
    food_fnb: ['식품', 'F&B', '음식', '레스토랑', '밀키트', '요리'],
    education: ['교육', '에듀테크', '학습', '강의', '튜터'],
    fintech: ['핀테크', '금융', '결제', '투자', '보험'],
    traditional_culture: ['전통', '문화', '공예', '한복', '한식'],
    other: [],
  }

  const textLower = text.toLowerCase()

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(k => textLower.includes(k.toLowerCase()))) {
      return industry as IndustryType
    }
  }

  return 'other'
}

// Extract target customer from PRD
function extractTargetCustomer(prd: PrdStructure): string {
  if (prd.targetAudience.length > 0) {
    return prd.targetAudience.slice(0, 3).join(', ')
  }
  return ''
}

// Map PRD features to problem-solution format
function mapFeaturesToContent(
  prd: PrdStructure
): { problems: string; solutions: string } {
  const problems: string[] = []
  const solutions: string[] = []

  for (const feature of prd.coreFeatures.slice(0, 3)) {
    const problemStatement = `고객들이 ${feature.name}과 관련하여 어려움을 겪고 있습니다.`
    const solutionStatement = `${feature.name}: ${feature.description}`

    problems.push(problemStatement)
    solutions.push(solutionStatement)
  }

  return {
    problems: problems.join('\n\n'),
    solutions: solutions.map((s, i) => `${i + 1}. ${s}`).join('\n'),
  }
}

// Create empty business plan
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

// Map validation result to business plan
export function mapIdeaToBusinessPlan(
  validationResult: ValidationResult,
  templateType: FormTemplateType = 'yebi-chogi'
): IdeaToBusinessPlanResult {
  const businessPlan = createEmptyBusinessPlan(templateType)
  const sectionData: Record<string, Record<string, string>> = {}
  let filledFields = 0
  const totalFields = 15

  // Parse PRD and JD if available
  let prd: PrdStructure | null = null
  let jd: JdStructure | null = null

  if (validationResult.artifacts?.prd) {
    prd = typeof validationResult.artifacts.prd === 'string'
      ? JSON.parse(validationResult.artifacts.prd)
      : validationResult.artifacts.prd
  }
  if (validationResult.artifacts?.jd) {
    jd = typeof validationResult.artifacts.jd === 'string'
      ? JSON.parse(validationResult.artifacts.jd)
      : validationResult.artifacts.jd
  }

  // Map Basic Info
  if (prd) {
    businessPlan.basicInfo = {
      itemName: prd.projectName || '',
      oneLiner: prd.tagline || '',
      targetCustomer: extractTargetCustomer(prd),
      industry: detectIndustry(prd.overview + ' ' + validationResult.projectIdea),
    }
    filledFields += 4
  } else {
    businessPlan.basicInfo = {
      itemName: validationResult.projectIdea.split(' ').slice(0, 3).join(' '),
      oneLiner: validationResult.projectIdea.substring(0, 50),
      targetCustomer: '',
      industry: detectIndustry(validationResult.projectIdea),
    }
    filledFields += 2
  }

  // Map Problem Section
  sectionData.problem = {}

  if (prd) {
    sectionData.problem.market_status = prd.overview || ''
    filledFields++

    const { problems } = mapFeaturesToContent(prd)
    sectionData.problem.problem_definition = problems || `${prd.targetAudience.join(', ')}이(가) 겪는 문제를 해결합니다.`
    filledFields++

    if (prd.successMetrics.length > 0) {
      sectionData.problem.development_necessity = `이 문제를 해결하면 다음과 같은 성과를 달성할 수 있습니다:\n${prd.successMetrics.map(m => `• ${m}`).join('\n')}`
      filledFields++
    }
  }

  // Map Solution Section
  sectionData.solution = {}

  if (prd) {
    sectionData.solution.development_plan = prd.coreFeatures
      .map(f => `• ${f.name} (${f.priority} 우선순위)\n  ${f.description}`)
      .join('\n\n')
    filledFields++

    if (prd.techStack.length > 0) {
      sectionData.solution.differentiation = `기술 스택: ${prd.techStack.join(', ')}\n\n이를 통해 차별화된 솔루션을 제공합니다.`
      filledFields++
    }

    const highPriorityFeatures = prd.coreFeatures.filter(f => f.priority === 'High')
    if (highPriorityFeatures.length > 0) {
      sectionData.solution.competitiveness = `핵심 경쟁력:\n${highPriorityFeatures.map(f => `• ${f.name}: ${f.description}`).join('\n')}`
      filledFields++
    }
  }

  // Map Scale-up Section
  sectionData.scaleup = {}

  if (prd?.successMetrics) {
    sectionData.scaleup.business_model = `성공 지표:\n${prd.successMetrics.map(m => `• ${m}`).join('\n')}\n\n위 지표를 달성하기 위한 비즈니스 모델을 구축합니다.`
    filledFields++
  }

  if (validationResult.actionPlan) {
    const allActions = [
      ...validationResult.actionPlan.developer.map(a => `[개발] ${a}`),
      ...validationResult.actionPlan.designer.map(a => `[디자인] ${a}`),
      ...validationResult.actionPlan.vc.map(a => `[비즈니스] ${a}`),
    ]
    sectionData.scaleup.roadmap = `실행 계획:\n${allActions.slice(0, 6).map((a, i) => `${i + 1}. ${a}`).join('\n')}`
    filledFields++
  }

  // Map Team Section
  sectionData.team = {}

  if (jd) {
    sectionData.team.founder = `${jd.roleTitle} 관련 역량 보유\n\n필요 역량:\n${jd.qualifications.slice(0, 3).map(q => `• ${q}`).join('\n')}`
    filledFields++

    sectionData.team.team_members = `채용 계획:\n${jd.responsibilities.slice(0, 3).map(r => `• ${r}`).join('\n')}\n\n우대 사항:\n${jd.preferred.slice(0, 3).map(p => `• ${p}`).join('\n')}`
    filledFields++
  }

  // Calculate confidence
  let confidence = 0.5
  if (prd) confidence += 0.25
  if (jd) confidence += 0.15
  if (validationResult.actionPlan) confidence += 0.1

  return {
    businessPlan,
    sectionData,
    mappingSummary: {
      filledFields,
      totalFields,
      sourceValidationId: validationResult.id,
      confidence: Math.min(1, confidence),
    },
  }
}

// Get summary of what was mapped
export function getMappingSummary(result: IdeaToBusinessPlanResult): string {
  const { mappingSummary, sectionData } = result

  const sectionStatus = []
  if (Object.keys(sectionData.problem || {}).length > 0) {
    sectionStatus.push('문제 인식')
  }
  if (Object.keys(sectionData.solution || {}).length > 0) {
    sectionStatus.push('솔루션')
  }
  if (Object.keys(sectionData.scaleup || {}).length > 0) {
    sectionStatus.push('성장 전략')
  }
  if (Object.keys(sectionData.team || {}).length > 0) {
    sectionStatus.push('팀 구성')
  }

  return `${mappingSummary.filledFields}개 필드 자동 완성 (${sectionStatus.join(', ')})`
}

// Check if can map to business plan
export function canMapToBusinessPlan(validationResult: ValidationResult): boolean {
  return !!(
    validationResult.projectIdea &&
    validationResult.artifacts &&
    (validationResult.artifacts.prd || validationResult.artifacts.jd)
  )
}
