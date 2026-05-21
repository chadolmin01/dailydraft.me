// 정부지원 창업 패키지 사업계획서 타입 정의

// 양식 템플릿 타입 (2025년 정부 공고문 기반)
export type FormTemplateType =
  | 'yebi-chogi'           // 예비/초기창업패키지 (중소벤처기업부)
  | 'student-300'          // 학생창업유망팀300 (교육부)
  | 'saengae-chungnyeon'   // 생애최초청년창업 (창업중심대학)
  | 'oneul-jeongtong'      // 오늘전통 (문화체육관광부)
  | 'gyeonggi-g-star'      // 경기G스타오디션 (경기도)

// 양식 메타데이터
export interface FormTemplate {
  id: FormTemplateType
  name: string
  shortName: string
  description: string
  pages: number
  features: string[]
  sections: FormSection[]
  extraSections?: ExtraSection[]
}

// 공통 PSST 섹션
export type PsstSectionType = 'problem' | 'solution' | 'scaleup' | 'team'

// 추가 섹션 (양식별 특화)
export type ExtraSectionType =
  | 'business_canvas'      // 비즈니스 모델 캔버스
  | 'cooperation'          // 협동가능성
  | 'traditional_culture'  // 전통문화 활용
  | 'social_value'         // 사회적 가치
  | 'regional_connection'  // 지역 연관성
  | 'organization_capacity' // 조직역량

// 섹션 정의
export interface FormSection {
  type: PsstSectionType
  title: string
  weight: number // 배점
  fields: SectionField[]
}

export interface ExtraSection {
  type: ExtraSectionType
  title: string
  weight: number
  fields: SectionField[]
}

export interface SectionField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'list' | 'table' | 'rich-text'
  placeholder?: string
  required: boolean
  maxLength?: number
  helpText?: string
  aiGeneratable?: boolean
}

// 업종 타입
export type IndustryType =
  | 'it_platform'
  | 'manufacturing'
  | 'bio_healthcare'
  | 'food_fnb'
  | 'education'
  | 'fintech'
  | 'traditional_culture'
  | 'other'

// 사업계획서 기본 정보
export interface BusinessPlanBasicInfo {
  itemName: string           // 아이템/서비스명
  oneLiner: string           // 한 줄 설명 (50자 이내)
  targetCustomer: string     // 타겟 고객
  industry: IndustryType     // 업종
  fundingAmount?: number     // 희망 지원금액
}

// Problem 섹션 데이터
export interface ProblemSection {
  problems: ProblemItem[]
  existingSolutions: ExistingSolution[]
  summary?: string
}

export interface ProblemItem {
  id: string
  title: string
  description: string
  severity: string           // 심각성 (정량 데이터)
  source?: string            // 출처
}

export interface ExistingSolution {
  name: string
  limitation: string
}

// Solution 섹션 데이터
export interface SolutionSection {
  coreValue: string          // 핵심 가치
  howItWorks: string         // 작동 방식
  features: FeatureItem[]    // 핵심 기능 (3-5개)
  differentiation: string    // 차별화 포인트
  developmentStatus: DevelopmentStatus
  ipStatus?: string          // 지식재산권 현황
}

export interface FeatureItem {
  id: string
  name: string
  description: string
  customerBenefit: string
}

export interface DevelopmentStatus {
  stage: 'idea' | 'prototype' | 'mvp' | 'beta' | 'launched'
  description: string
  traction?: string          // 성과 데이터
}

// Scale-up 섹션 데이터
export interface ScaleUpSection {
  market: MarketSize
  businessModel: BusinessModel
  growthStrategy: GrowthStrategy
  fundUsagePlan: FundUsageItem[]
  milestones: MilestoneItem[]
}

export interface MarketSize {
  tam: MarketSizeItem        // 전체 시장
  sam: MarketSizeItem        // 유효 시장
  som: MarketSizeItem        // 목표 시장
  cagr?: number              // 연평균 성장률
  source: string             // 출처
}

export interface MarketSizeItem {
  value: number
  unit: '억원' | '조원' | '만원'
  description?: string
}

export interface BusinessModel {
  type: string               // 수익 모델 유형
  revenueStreams: RevenueStream[]
  pricing?: string
  unitEconomics?: {
    cac: number              // 고객 획득 비용
    ltv: number              // 고객 생애 가치
  }
}

export interface RevenueStream {
  name: string
  description: string
  percentage: number         // 예상 비중
}

export interface GrowthStrategy {
  stages: GrowthStage[]
  channels: string[]         // 마케팅/영업 채널
}

export interface GrowthStage {
  stage: number
  period: string             // 예: "0-6개월"
  target: string
  strategy: string
  goal: string
}

export interface FundUsageItem {
  category: string
  amount: number
  percentage: number
  description: string
}

export interface MilestoneItem {
  period: string
  milestone: string
  kpi: string
  targetValue: string
}

// Team 섹션 데이터
export interface TeamSection {
  founder: TeamMember
  members: TeamMember[]
  teamStrength: string       // 팀 차별적 강점
  hiringPlan?: HiringPlan[]
  advisors?: Advisor[]
}

export interface TeamMember {
  name: string
  role: string
  title?: string
  experience: string         // 경력
  expertise: string          // 전문성
  motivation?: string        // 창업 동기 (대표자용)
}

export interface HiringPlan {
  role: string
  count: number
  timeline: string
}

export interface Advisor {
  name: string
  expertise: string
  affiliation?: string
}

// 전체 사업계획서 데이터
export interface BusinessPlanData {
  id?: string
  templateType: FormTemplateType
  status: 'draft' | 'in_progress' | 'completed'
  basicInfo: BusinessPlanBasicInfo
  problem: ProblemSection
  solution: SolutionSection
  scaleup: ScaleUpSection
  team: TeamSection
  extraSections?: Record<ExtraSectionType, unknown>
  /** 워크플로우에서 연결된 검증 아이디어 ID (FK) */
  validatedIdeaId?: string
  createdAt?: string
  updatedAt?: string
}

// AI 생성 요청
export interface AiGenerateRequest {
  section: PsstSectionType | ExtraSectionType
  templateType: FormTemplateType
  context: {
    basicInfo: BusinessPlanBasicInfo
    existingData?: Partial<BusinessPlanData>
  }
  fieldId?: string           // 특정 필드만 생성할 때
}

// AI 생성 응답
export interface AiGenerateResponse {
  content: string
  suggestions?: string[]
  confidence: number         // 0-1
}

// 검증 결과
export interface ValidationResult {
  totalScore: number
  maxScore: number
  sections: SectionValidation[]
  overallFeedback: string
  improvements: ImprovementSuggestion[]
}

export interface SectionValidation {
  section: PsstSectionType
  score: number
  maxScore: number
  checks: ValidationCheck[]
}

export interface ValidationCheck {
  id: string
  name: string
  passed: boolean
  feedback?: string
}

export interface ImprovementSuggestion {
  section: PsstSectionType
  priority: 'high' | 'medium' | 'low'
  before?: string
  after?: string
  suggestion: string
}

// 양식 템플릿 정의
export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: 'yebi-chogi',
    name: '예비/초기창업패키지',
    shortName: '예비/초기',
    description: 'PSST 표준 양식, 사업비 집행계획 포함',
    pages: 15,
    features: ['PSST 표준', '사업비 집행계획', '개발 로드맵'],
    sections: [
      {
        type: 'problem',
        title: '문제 인식 (Problem)',
        weight: 20,
        fields: [
          { id: 'market_status', label: '시장 현황', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'problem_definition', label: '문제점', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'development_necessity', label: '개발 필요성', type: 'textarea', required: true, aiGeneratable: true },
        ]
      },
      {
        type: 'solution',
        title: '실현 가능성 (Solution)',
        weight: 30,
        fields: [
          { id: 'development_plan', label: '개발 계획', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'differentiation', label: '차별성', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'competitiveness', label: '경쟁력', type: 'textarea', required: true, aiGeneratable: true },
        ]
      },
      {
        type: 'scaleup',
        title: '성장 전략 (Scale-up)',
        weight: 30,
        fields: [
          { id: 'business_model', label: '비즈니스 모델', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'market_size', label: '시장 규모', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'investment_plan', label: '투자유치 계획', type: 'textarea', required: false, aiGeneratable: true },
          { id: 'roadmap', label: '사업화 로드맵', type: 'textarea', required: true, aiGeneratable: true },
        ]
      },
      {
        type: 'team',
        title: '팀 구성 (Team)',
        weight: 20,
        fields: [
          { id: 'founder', label: '대표자 역량', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'team_members', label: '팀원 역량', type: 'textarea', required: false, aiGeneratable: true },
          { id: 'collaboration', label: '협력기관', type: 'textarea', required: false, aiGeneratable: false },
        ]
      },
    ]
  },
  {
    id: 'student-300',
    name: '학생창업유망팀300',
    shortName: '학생300',
    description: '비즈니스 모델 캔버스, 팀 시너지 강조',
    pages: 15,
    features: ['비즈니스 모델 캔버스', '팀 시너지', 'PSST'],
    sections: [
      {
        type: 'problem',
        title: '문제 인식',
        weight: 20,
        fields: [
          { id: 'market_status', label: '시장 현황', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'problem_definition', label: '문제점', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'development_necessity', label: '개발 필요성', type: 'textarea', required: true, aiGeneratable: true },
        ]
      },
      {
        type: 'solution',
        title: '실현 가능성',
        weight: 30,
        fields: [
          { id: 'development_plan', label: '개발 계획', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'differentiation', label: '차별성', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'competitiveness', label: '경쟁력', type: 'textarea', required: true, aiGeneratable: true },
        ]
      },
      {
        type: 'scaleup',
        title: '성장 전략',
        weight: 30,
        fields: [
          { id: 'business_model', label: '비즈니스 모델', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'market_size', label: '시장 규모', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'roadmap', label: '사업화 로드맵', type: 'textarea', required: true, aiGeneratable: true },
        ]
      },
      {
        type: 'team',
        title: '팀 구성',
        weight: 20,
        fields: [
          { id: 'founder', label: '대표자 역량', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'team_members', label: '팀원 역량', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'team_synergy', label: '팀 시너지', type: 'textarea', required: true, aiGeneratable: true },
        ]
      },
    ],
    extraSections: [
      {
        type: 'business_canvas',
        title: '비즈니스 모델 캔버스',
        weight: 10,
        fields: [
          { id: 'value_proposition', label: '가치 제안', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'customer_segments', label: '고객 세그먼트', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'channels', label: '채널', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'revenue_streams', label: '수익원', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'key_resources', label: '핵심 자원', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'key_activities', label: '핵심 활동', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'key_partners', label: '핵심 파트너', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'cost_structure', label: '비용 구조', type: 'textarea', required: true, aiGeneratable: true },
        ]
      }
    ]
  },
  {
    id: 'saengae-chungnyeon',
    name: '생애최초청년창업',
    shortName: '생애최초',
    description: 'PSST + 협동가능성(Cooperation) 포함',
    pages: 9,
    features: ['PSST', '협동가능성(C)', '청년 특화'],
    sections: [
      {
        type: 'problem',
        title: '문제 인식',
        weight: 15,
        fields: [
          { id: 'problem_definition', label: '문제점', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'development_necessity', label: '개발 필요성', type: 'textarea', required: true, aiGeneratable: true },
        ]
      },
      {
        type: 'solution',
        title: '실현 가능성',
        weight: 25,
        fields: [
          { id: 'development_plan', label: '개발 계획', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'differentiation', label: '차별성', type: 'textarea', required: true, aiGeneratable: true },
        ]
      },
      {
        type: 'scaleup',
        title: '성장 전략',
        weight: 25,
        fields: [
          { id: 'business_model', label: '비즈니스 모델', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'market_size', label: '시장 규모', type: 'textarea', required: true, aiGeneratable: true },
        ]
      },
      {
        type: 'team',
        title: '팀 구성',
        weight: 15,
        fields: [
          { id: 'founder', label: '대표자 역량', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'team_members', label: '팀원 역량', type: 'textarea', required: false, aiGeneratable: true },
        ]
      },
    ],
    extraSections: [
      {
        type: 'cooperation',
        title: '협동가능성 (Cooperation)',
        weight: 20,
        fields: [
          { id: 'cooperation_plan', label: '협력 계획', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'network', label: '네트워크 활용', type: 'textarea', required: true, aiGeneratable: true },
        ]
      }
    ]
  },
  {
    id: 'oneul-jeongtong',
    name: '오늘전통',
    shortName: '오늘전통',
    description: '전통문화 활용, 사회적 가치 강조',
    pages: 10,
    features: ['전통문화 활용', '사회적 가치', 'PSST'],
    sections: [
      {
        type: 'problem',
        title: '문제 인식',
        weight: 15,
        fields: [
          { id: 'problem_definition', label: '문제점', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'traditional_challenge', label: '전통문화 현황 및 과제', type: 'textarea', required: true, aiGeneratable: true },
        ]
      },
      {
        type: 'solution',
        title: '실현 가능성',
        weight: 25,
        fields: [
          { id: 'development_plan', label: '개발 계획', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'differentiation', label: '차별성', type: 'textarea', required: true, aiGeneratable: true },
        ]
      },
      {
        type: 'scaleup',
        title: '성장 전략',
        weight: 25,
        fields: [
          { id: 'business_model', label: '비즈니스 모델', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'market_size', label: '시장 규모', type: 'textarea', required: true, aiGeneratable: true },
        ]
      },
      {
        type: 'team',
        title: '팀 구성',
        weight: 15,
        fields: [
          { id: 'founder', label: '대표자 역량', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'team_members', label: '팀원 역량', type: 'textarea', required: false, aiGeneratable: true },
        ]
      },
    ],
    extraSections: [
      {
        type: 'traditional_culture',
        title: '전통문화 활용',
        weight: 10,
        fields: [
          { id: 'cultural_element', label: '활용 전통문화 요소', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'modernization', label: '현대화 방안', type: 'textarea', required: true, aiGeneratable: true },
        ]
      },
      {
        type: 'social_value',
        title: '사회적 가치',
        weight: 10,
        fields: [
          { id: 'social_impact', label: '사회적 임팩트', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'sustainability', label: '지속가능성', type: 'textarea', required: true, aiGeneratable: true },
        ]
      }
    ]
  },
  {
    id: 'gyeonggi-g-star',
    name: '경기G스타오디션',
    shortName: 'G스타',
    description: '지역 연관성, 조직역량 강조',
    pages: 10,
    features: ['지역 연관성', '조직역량', 'PSST'],
    sections: [
      {
        type: 'problem',
        title: '문제 인식',
        weight: 15,
        fields: [
          { id: 'problem_definition', label: '문제점', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'development_necessity', label: '개발 필요성', type: 'textarea', required: true, aiGeneratable: true },
        ]
      },
      {
        type: 'solution',
        title: '실현 가능성',
        weight: 25,
        fields: [
          { id: 'development_plan', label: '개발 계획', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'differentiation', label: '차별성', type: 'textarea', required: true, aiGeneratable: true },
        ]
      },
      {
        type: 'scaleup',
        title: '성장 전략',
        weight: 25,
        fields: [
          { id: 'business_model', label: '비즈니스 모델', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'market_size', label: '시장 규모', type: 'textarea', required: true, aiGeneratable: true },
        ]
      },
      {
        type: 'team',
        title: '팀 구성',
        weight: 15,
        fields: [
          { id: 'founder', label: '대표자 역량', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'team_members', label: '팀원 역량', type: 'textarea', required: false, aiGeneratable: true },
        ]
      },
    ],
    extraSections: [
      {
        type: 'regional_connection',
        title: '지역 연관성',
        weight: 10,
        fields: [
          { id: 'gyeonggi_connection', label: '경기도 연관성', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'local_impact', label: '지역 경제 기여', type: 'textarea', required: true, aiGeneratable: true },
        ]
      },
      {
        type: 'organization_capacity',
        title: '조직역량',
        weight: 10,
        fields: [
          { id: 'org_structure', label: '조직 구조', type: 'textarea', required: true, aiGeneratable: true },
          { id: 'execution_capacity', label: '실행 역량', type: 'textarea', required: true, aiGeneratable: true },
        ]
      }
    ]
  }
]

// 업종 정보
export const INDUSTRIES: Record<IndustryType, { name: string; keywords: string[] }> = {
  it_platform: {
    name: 'IT/플랫폼',
    keywords: ['자동화', 'AI', '플랫폼', '매칭', 'SaaS']
  },
  manufacturing: {
    name: '제조/하드웨어',
    keywords: ['특허', '신소재', 'IoT', '생산']
  },
  bio_healthcare: {
    name: '바이오/헬스케어',
    keywords: ['AI진단', '디지털치료', '원격의료', '헬스케어']
  },
  food_fnb: {
    name: '식품/F&B',
    keywords: ['클린라벨', '대체식품', '밀키트', 'D2C']
  },
  education: {
    name: '교육/에듀테크',
    keywords: ['에듀테크', 'LMS', '온라인교육', 'AI튜터']
  },
  fintech: {
    name: '핀테크/금융',
    keywords: ['결제', '보험', '투자', '블록체인']
  },
  traditional_culture: {
    name: '전통문화',
    keywords: ['전통', '문화', '공예', '한복', '한식']
  },
  other: {
    name: '기타',
    keywords: []
  }
}

// 위저드 스텝 정의
export interface WizardStep {
  id: number
  title: string
  description: string
  sections: (PsstSectionType | 'basic' | ExtraSectionType)[]
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    title: '기본 정보',
    description: '아이템명, 타겟 고객, 업종을 입력합니다',
    sections: ['basic']
  },
  {
    id: 2,
    title: '문제 정의',
    description: '해결하려는 문제를 정의합니다',
    sections: ['problem']
  },
  {
    id: 3,
    title: '솔루션',
    description: '문제 해결 방안을 설명합니다',
    sections: ['solution']
  },
  {
    id: 4,
    title: '성장 전략',
    description: '시장과 비즈니스 모델을 설명합니다',
    sections: ['scaleup']
  },
  {
    id: 5,
    title: '팀 구성',
    description: '팀 역량을 소개합니다',
    sections: ['team']
  }
]

// 유틸리티 함수
export function getTemplateById(id: FormTemplateType): FormTemplate | undefined {
  return FORM_TEMPLATES.find(t => t.id === id)
}

export function getIndustryName(type: IndustryType): string {
  return INDUSTRIES[type]?.name || '기타'
}

// 초기 빈 사업계획서 데이터 생성
export function createEmptyBusinessPlan(templateType: FormTemplateType): BusinessPlanData {
  return {
    templateType,
    status: 'draft',
    basicInfo: {
      itemName: '',
      oneLiner: '',
      targetCustomer: '',
      industry: 'other'
    },
    problem: {
      problems: [],
      existingSolutions: []
    },
    solution: {
      coreValue: '',
      howItWorks: '',
      features: [],
      differentiation: '',
      developmentStatus: {
        stage: 'idea',
        description: ''
      }
    },
    scaleup: {
      market: {
        tam: { value: 0, unit: '억원' },
        sam: { value: 0, unit: '억원' },
        som: { value: 0, unit: '억원' },
        source: ''
      },
      businessModel: {
        type: '',
        revenueStreams: []
      },
      growthStrategy: {
        stages: [],
        channels: []
      },
      fundUsagePlan: [],
      milestones: []
    },
    team: {
      founder: {
        name: '',
        role: '대표',
        experience: '',
        expertise: ''
      },
      members: [],
      teamStrength: ''
    }
  }
}
