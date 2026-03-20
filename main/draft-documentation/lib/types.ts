// 사업계획서 문서 생성 타입 정의 (간소화)

// 양식 템플릿 타입
export type FormTemplateType =
  | 'yebi-chogi'           // 예비/초기창업패키지
  | 'student-300'          // 학생창업유망팀300
  | 'saengae-chungnyeon'   // 생애최초청년창업
  | 'oneul-jeongtong'      // 오늘전통
  | 'gyeonggi-g-star'      // 경기G스타오디션

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

// PSST 섹션
export type PsstSectionType = 'problem' | 'solution' | 'scaleup' | 'team'

// 추가 섹션
export type ExtraSectionType =
  | 'business_canvas'
  | 'cooperation'
  | 'traditional_culture'
  | 'social_value'
  | 'regional_connection'
  | 'organization_capacity'

// 섹션 정의
export interface FormSection {
  type: PsstSectionType
  title: string
  weight: number
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
  itemName: string
  oneLiner: string
  targetCustomer: string
  industry: IndustryType
  fundingAmount?: number
}

// 전체 사업계획서 데이터 (간소화)
export interface BusinessPlanData {
  templateType: FormTemplateType
  basicInfo: BusinessPlanBasicInfo
}

// 섹션 데이터 (폼 입력값)
export type SectionDataType = Record<string, Record<string, string>>

// 내보내기 관련 타입
export interface ExportSection {
  title: string
  weight: number
  content: Array<{
    label: string
    value: string
  }>
}

export interface ExportContent {
  title: string
  subtitle: string
  templateName: string
  basicInfo: {
    itemName: string
    oneLiner: string
    targetCustomer: string
    industry: string
    fundingAmount?: number
  }
  sections: ExportSection[]
  extraSections?: ExportSection[]
}

// 업종 정보
export const INDUSTRIES: Record<IndustryType, { name: string }> = {
  it_platform: { name: 'IT/플랫폼' },
  manufacturing: { name: '제조/하드웨어' },
  bio_healthcare: { name: '바이오/헬스케어' },
  food_fnb: { name: '식품/F&B' },
  education: { name: '교육/에듀테크' },
  fintech: { name: '핀테크/금융' },
  traditional_culture: { name: '전통문화' },
  other: { name: '기타' },
}

export function getIndustryName(type: IndustryType): string {
  return INDUSTRIES[type]?.name || '기타'
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
