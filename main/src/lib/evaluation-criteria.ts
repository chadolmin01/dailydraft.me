// 정부지원 사업별 평가기준 데이터
// 출처: 2025년 공고문 수동 추출 (v3.1, 2회 검증 완료)

import { FormTemplateType } from '@/src/types/business-plan'

export interface EvaluationSection {
  name: string
  koreanName: string
  description: string
  weight?: number
}

export interface BonusPoint {
  condition: string
  score: number
  note?: string
  categories?: string[]
}

export interface Penalty {
  condition: string
  score: number
}

export interface Exemption {
  type: 'document_review' | 'priority_selection'
  conditions: string[]
}

export interface FormEvaluationCriteria {
  name: string
  fullName?: string
  target: string
  ageRequirement?: string
  funding: {
    max: string
    average?: string
  }
  period: string
  minimumScore: number
  evaluationSections: EvaluationSection[]
  bonusPoints: BonusPoint[]
  penalties?: Penalty[]
  exemptions: Exemption[]
  writingGuidelines: string[]
  specialNotes?: string[]
}

// PSST 공통 평가항목 (예비/초기/생애최초 공통)
const PSST_SECTIONS: EvaluationSection[] = [
  {
    name: 'problem',
    koreanName: '문제인식',
    description: '창업 아이템의 개발 배경 및 필요성 등',
    weight: 25
  },
  {
    name: 'solution',
    koreanName: '실현가능성',
    description: '창업 아이템의 사업기간 내 개발 또는 구체화 계획 등',
    weight: 25
  },
  {
    name: 'scaleup',
    koreanName: '성장전략',
    description: '창업 아이템의 사업화를 위한 차별성, 수익모델, 자금조달 방안 등',
    weight: 25
  },
  {
    name: 'team',
    koreanName: '팀(기업) 구성',
    description: '대표자 및 고용 (예정)인력이 보유한 기술 역량과 노하우 등',
    weight: 25
  }
]

// 양식별 평가기준
export const EVALUATION_CRITERIA: Record<FormTemplateType, FormEvaluationCriteria> = {
  'yebi-chogi': {
    name: '예비창업패키지',
    target: '예비창업자 (사업자등록 전)',
    funding: { max: '1억원' },
    period: '10개월',
    minimumScore: 60,
    evaluationSections: PSST_SECTIONS,
    bonusPoints: [
      {
        condition: '인공지능(융합혁신) 대학원 졸업생',
        score: 2,
        categories: ['고려대', '광주과기원', '서울대', '성균관대', '연세대', '울산과기원', '중앙대', '포항공대', '한양대', 'KAIST', '경희대', '동국대', '부산대', '아주대', '이화여대', '인하대', '전남대', '충남대', '한양대 ERICA']
      },
      {
        condition: '정부 주관 전국 규모 창업경진대회 장관급 이상 훈격 수상자',
        score: 1,
        note: '최근 2년 이내 (2023.2.17~2025.2.16), 다수 수상해도 최대 1점'
      },
      {
        condition: '기후테크 분야 창업 예정',
        score: 1,
        categories: ['클린테크(재생에너지, 에너지신산업, 탈탄소에너지)', '카본테크(탄소포집, 공정혁신, 모빌리티)', '에코테크(자원순환, 폐기물절감, 업사이클링)', '푸드테크(대체식품, 스마트식품, 애그테크)', '지오테크(우주기상, 기후적응, AI·데이터금융)']
      },
      {
        condition: '1인 창조기업 지원센터의 추천을 받은 입주기업',
        score: 1
      }
    ],
    exemptions: [
      {
        type: 'document_review',
        conditions: [
          "'24년 도전! K-스타트업 왕중왕전 진출자",
          "성실경영 심층평가 통과자 중 청년(만 39세 이하)"
        ]
      },
      {
        type: 'priority_selection',
        conditions: [
          "'24년 도전! K-스타트업 왕중왕전 수상자(대상, 최우수상)",
          "'24년 D-DAY(디캠프), 정주영 창업경진대회(아산나눔재단) 입상자 중 해당 기관 추천",
          "'24년 사전 인큐베이팅 프로그램 수료자"
        ]
      }
    ],
    writingGuidelines: [
      '사업계획서 15페이지 이내',
      '사업비 집행계획 구체적 작성',
      '개인정보(학력, 소속 등) 삭제 또는 마스킹',
      '평가 단계별 점수가 60점 미만일 경우 선정 대상에서 제외'
    ],
    specialNotes: [
      '발표평가: 30분 이내 (발표 15-20분 + 질의응답)',
      '협약종료일 2개월 이전까지 창업(사업자등록) 이행 필수',
      '협약종료일로부터 1년 이상 창업기업 유지 의무'
    ]
  },

  'student-300': {
    name: '학생창업유망팀300',
    target: '초중고, 학교 밖 청소년, 대학(원) 재학생 창업팀',
    funding: { max: '비지원금 (교육/멘토링 위주)' },
    period: '약 6개월 (트랙별 상이)',
    minimumScore: 60,
    evaluationSections: PSST_SECTIONS,
    bonusPoints: [
      {
        condition: '실험실 특화형 창업선도대학 지원사업 참여팀',
        score: 3
      },
      {
        condition: '팀구성원 50% 이상 외국인 유학생으로 구성 (도약트랙 유학생)',
        score: 3
      },
      {
        condition: 'OASIS 프로그램 수료자가 참여한 팀',
        score: 3
      },
      {
        condition: '팀구성원 60% 이상 전문대학생으로 구성 (성장트랙B)',
        score: 3
      }
    ],
    penalties: [
      { condition: '팀구성원 변경', score: -5 },
      { condition: '팀대표가 아닌 팀원이 발표', score: -5 }
    ],
    exemptions: [
      {
        type: 'document_review',
        conditions: [
          "2024년 예비트랙 최종선발(인증서 수여기준) 구성원이 팀 대표자인 창업팀",
          "도약트랙 서류심사 통과팀이 발표심사 탈락 후 재신청"
        ]
      }
    ],
    writingGuidelines: [
      '팀 단위(3~5인) 신청 필수',
      '1인당 1개팀에만 참가 가능',
      '트랙별 중복 신청 불가 (단, 도약트랙 탈락 시 성장트랙 재신청 가능)',
      '사업계획서 PDF 제출 권장'
    ],
    specialNotes: [
      '도약트랙(일반): 40팀 선발, K-스타트업 통합본선 진출 기회',
      '도약트랙(유학생): 10팀 선발',
      '성장트랙(A): 300팀 선발, 권역별 운영',
      '성장트랙(B): 60팀 선발, 전문대 특화'
    ]
  },

  'saengae-chungnyeon': {
    name: '생애최초청년창업',
    fullName: '창업중심대학 생애최초 청년 예비창업형',
    target: '만 29세 이하 생애최초 청년 예비창업자',
    ageRequirement: '만 29세 이하 (1995.3.12 이후 출생자)',
    funding: { max: '1억원', average: '47백만원' },
    period: '8개월',
    minimumScore: 60,
    evaluationSections: PSST_SECTIONS,
    bonusPoints: [
      {
        condition: '인공지능(융합혁신) 대학원 졸업생',
        score: 2
      },
      {
        condition: '정부 주관 전국 규모 창업경진대회 장관급 이상 훈격 수상자',
        score: 1
      },
      {
        condition: '기후테크 분야 창업 예정',
        score: 1
      }
    ],
    exemptions: [
      {
        type: 'document_review',
        conditions: []
      },
      {
        type: 'priority_selection',
        conditions: []
      }
    ],
    writingGuidelines: [
      '생애 최초 창업자만 신청 가능 (이전 사업자등록 이력 없음)',
      '협약종료 30일 이전까지 창업(사업자등록) 이행 필수',
      '협약종료일로부터 1년 이상 창업기업 유지 의무',
      '협약기간 내 대표자 변경 시 협약취소'
    ],
    specialNotes: [
      '창업중심대학 11개 대학에서 운영',
      '창업중심대학, 예비창업패키지, 초기창업패키지 총 3회 이상 협약 이력이 없어야 함'
    ]
  },

  'oneul-jeongtong': {
    name: '오늘전통',
    fullName: '오늘전통 청년 예비창업 공모전',
    target: '전통문화산업 분야 예비창업자',
    ageRequirement: '만 39세 이하 (1985년 7월 1일 이후 출생자)',
    funding: { max: '10백만원 (대상)', average: '44백만원 (총 시상금)' },
    period: '5개월 (8월~12월)',
    minimumScore: 60,
    evaluationSections: [
      { name: 'innovation', koreanName: '혁신성', description: '아이디어의 창의성과 혁신성', weight: 20 },
      { name: 'differentiation', koreanName: '차별성', description: '기존 제품/서비스와의 차별점', weight: 20 },
      { name: 'feasibility', koreanName: '실현가능성', description: '사업화 실현 가능성', weight: 20 },
      { name: 'economy', koreanName: '경제성', description: '경제적 타당성과 수익성', weight: 20 },
      { name: 'sustainability', koreanName: '지속가능성', description: '사업의 지속가능성', weight: 10 },
      { name: 'specificity', koreanName: '구체성', description: '사업계획의 구체성', weight: 10 }
    ],
    bonusPoints: [
      {
        condition: '예비창업 아카데미 보육 중 사업자등록',
        score: 0, // 가산점 부여 (점수 미공개)
        note: '최종평가 가산점 부여'
      }
    ],
    exemptions: [
      {
        type: 'document_review',
        conditions: []
      },
      {
        type: 'priority_selection',
        conditions: [
          "대상/최우수상(2팀)은 2026 초기창업기업 공모 시 프리패스 부여"
        ]
      }
    ],
    writingGuidelines: [
      '요약서 내 소속과 이름 등 신상정보 표기 금지 (낙선 사유)',
      '사업계획서 내 소속과 이름 등 신상정보 표기 금지 (낙선 사유)',
      '지정양식 사용 필수',
      '최대 5인 팀 구성 가능',
      '1개팀당 최대 3개 공모안 접수 가능'
    ],
    specialNotes: [
      '전통문화분야: 공예, 한복, 한지, 한식, 한옥, 전통놀이, 전통예술',
      '1차 선정 50팀 → 예비창업 아카데미 → 2차 심사 → 최종 30팀 선정',
      '수상자 전원 향후 5년간 오늘전통 청년 초기창업기업 공모 가산점 부여'
    ]
  },

  'gyeonggi-g-star': {
    name: '경기G스타오디션',
    fullName: '경기 창업 공모 (G스타 오디션)',
    target: '예비 창업자 또는 7년 이내 창업자',
    funding: { max: '30백만원 (글로벌리그 대상)' },
    period: '약 4개월',
    minimumScore: 60,
    evaluationSections: PSST_SECTIONS,
    bonusPoints: [],
    exemptions: [
      {
        type: 'document_review',
        conditions: []
      }
    ],
    writingGuidelines: [
      '예비·초기 리그: 예비 창업자 또는 3년 이내 창업자',
      '글로벌 리그: 7년 이내 창업자',
      '아이디어 공지 예외 주장 가능 (12개월 이내 특허 출원)'
    ],
    specialNotes: [
      '예비·초기리그: 예선 100팀 → 본선 30팀 → 결선 10팀 입상',
      '글로벌리그: 별도 운영',
      '대상/최우수상/우수상: 경기도지사 상장',
      '장려상: 경기도경제과학진흥원장 상장'
    ]
  }
}

// 사업비 집행 비목 (예비/초기/생애최초 공통)
export const FUND_CATEGORIES = [
  { name: '재료비', description: '재료 또는 원료, 데이터 등 구매 비용' },
  { name: '외주용역비', description: '창업아이템 고도화를 위해 외부 업체에 의뢰하는 비용' },
  { name: '기계장치', description: '기계, 설비, 비품, SW 등 구매 비용' },
  { name: '특허권등무형자산취득비', description: '지식재산권 출원 및 등록 관련 비용' },
  { name: '인건비', description: '창업기업 소속 직원의 사업 참여 인건비' },
  { name: '지급수수료', description: '기술이전비, 전시회 참가비, 시험인증비, 멘토링비 등' },
  { name: '여비', description: '출장 관련 비용' },
  { name: '교육훈련비', description: '기술 및 경영교육 이수 비용' },
  { name: '광고선전비', description: '홍보 및 마케팅 소요 비용' }
]

// 공통 제재/실격 조건
export const DISQUALIFICATION_CONDITIONS = [
  '타인의 특허, 실용신안 등 지식재산권 침해',
  '사행성 및 환경오염 유발 등 반사회적 성격의 창업 아이템',
  '사업계획서를 타인이 대신 작성하여 제출 (사기 또는 업무방해죄 처벌 가능)',
  '고의 또는 과실로 타인의 사업계획서 모방/표절/도용'
]

export const FRAUD_PENALTIES = [
  '형사처벌 가능',
  '정부지원사업비 전액 환수',
  '창업사업화 지원사업 참여제한 3년',
  '부정수급 시 반환금액의 최대 5배 제재부가금'
]

// 유틸리티 함수
export function getEvaluationCriteria(formType: FormTemplateType): FormEvaluationCriteria {
  return EVALUATION_CRITERIA[formType]
}

export function getBonusPointsTotal(formType: FormTemplateType): number {
  const criteria = EVALUATION_CRITERIA[formType]
  return criteria.bonusPoints.reduce((sum, bp) => sum + bp.score, 0)
}

export function getFormSpecificPrompt(formType: FormTemplateType): string {
  const criteria = EVALUATION_CRITERIA[formType]

  let prompt = `\n## 양식별 평가 기준 (${criteria.name})\n`
  prompt += `- 대상: ${criteria.target}\n`
  prompt += `- 지원금: ${criteria.funding.max}\n`
  prompt += `- 최소 점수: ${criteria.minimumScore}점 이상\n\n`

  prompt += `### 평가항목\n`
  criteria.evaluationSections.forEach(section => {
    prompt += `- ${section.koreanName}: ${section.description}\n`
  })

  if (criteria.bonusPoints.length > 0) {
    prompt += `\n### 가점 조건\n`
    criteria.bonusPoints.forEach(bp => {
      prompt += `- ${bp.condition}: +${bp.score}점\n`
    })
  }

  prompt += `\n### 작성 가이드라인\n`
  criteria.writingGuidelines.forEach(guide => {
    prompt += `- ${guide}\n`
  })

  return prompt
}
