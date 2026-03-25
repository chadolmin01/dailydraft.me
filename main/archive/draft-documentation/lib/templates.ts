import { FormTemplate } from './types'

// 5종 정부양식 템플릿 정의
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
          { id: 'market_status', label: '시장 현황', type: 'textarea', required: true },
          { id: 'problem_definition', label: '문제점', type: 'textarea', required: true },
          { id: 'development_necessity', label: '개발 필요성', type: 'textarea', required: true },
        ]
      },
      {
        type: 'solution',
        title: '실현 가능성 (Solution)',
        weight: 30,
        fields: [
          { id: 'development_plan', label: '개발 계획', type: 'textarea', required: true },
          { id: 'differentiation', label: '차별성', type: 'textarea', required: true },
          { id: 'competitiveness', label: '경쟁력', type: 'textarea', required: true },
        ]
      },
      {
        type: 'scaleup',
        title: '성장 전략 (Scale-up)',
        weight: 30,
        fields: [
          { id: 'business_model', label: '비즈니스 모델', type: 'textarea', required: true },
          { id: 'market_size', label: '시장 규모', type: 'textarea', required: true },
          { id: 'investment_plan', label: '투자유치 계획', type: 'textarea', required: false },
          { id: 'roadmap', label: '사업화 로드맵', type: 'textarea', required: true },
        ]
      },
      {
        type: 'team',
        title: '팀 구성 (Team)',
        weight: 20,
        fields: [
          { id: 'founder', label: '대표자 역량', type: 'textarea', required: true },
          { id: 'team_members', label: '팀원 역량', type: 'textarea', required: false },
          { id: 'collaboration', label: '협력기관', type: 'textarea', required: false },
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
          { id: 'market_status', label: '시장 현황', type: 'textarea', required: true },
          { id: 'problem_definition', label: '문제점', type: 'textarea', required: true },
          { id: 'development_necessity', label: '개발 필요성', type: 'textarea', required: true },
        ]
      },
      {
        type: 'solution',
        title: '실현 가능성',
        weight: 30,
        fields: [
          { id: 'development_plan', label: '개발 계획', type: 'textarea', required: true },
          { id: 'differentiation', label: '차별성', type: 'textarea', required: true },
          { id: 'competitiveness', label: '경쟁력', type: 'textarea', required: true },
        ]
      },
      {
        type: 'scaleup',
        title: '성장 전략',
        weight: 30,
        fields: [
          { id: 'business_model', label: '비즈니스 모델', type: 'textarea', required: true },
          { id: 'market_size', label: '시장 규모', type: 'textarea', required: true },
          { id: 'roadmap', label: '사업화 로드맵', type: 'textarea', required: true },
        ]
      },
      {
        type: 'team',
        title: '팀 구성',
        weight: 20,
        fields: [
          { id: 'founder', label: '대표자 역량', type: 'textarea', required: true },
          { id: 'team_members', label: '팀원 역량', type: 'textarea', required: true },
          { id: 'team_synergy', label: '팀 시너지', type: 'textarea', required: true },
        ]
      },
    ],
    extraSections: [
      {
        type: 'business_canvas',
        title: '비즈니스 모델 캔버스',
        weight: 10,
        fields: [
          { id: 'value_proposition', label: '가치 제안', type: 'textarea', required: true },
          { id: 'customer_segments', label: '고객 세그먼트', type: 'textarea', required: true },
          { id: 'channels', label: '채널', type: 'textarea', required: true },
          { id: 'revenue_streams', label: '수익원', type: 'textarea', required: true },
          { id: 'key_resources', label: '핵심 자원', type: 'textarea', required: true },
          { id: 'key_activities', label: '핵심 활동', type: 'textarea', required: true },
          { id: 'key_partners', label: '핵심 파트너', type: 'textarea', required: true },
          { id: 'cost_structure', label: '비용 구조', type: 'textarea', required: true },
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
          { id: 'problem_definition', label: '문제점', type: 'textarea', required: true },
          { id: 'development_necessity', label: '개발 필요성', type: 'textarea', required: true },
        ]
      },
      {
        type: 'solution',
        title: '실현 가능성',
        weight: 25,
        fields: [
          { id: 'development_plan', label: '개발 계획', type: 'textarea', required: true },
          { id: 'differentiation', label: '차별성', type: 'textarea', required: true },
        ]
      },
      {
        type: 'scaleup',
        title: '성장 전략',
        weight: 25,
        fields: [
          { id: 'business_model', label: '비즈니스 모델', type: 'textarea', required: true },
          { id: 'market_size', label: '시장 규모', type: 'textarea', required: true },
        ]
      },
      {
        type: 'team',
        title: '팀 구성',
        weight: 15,
        fields: [
          { id: 'founder', label: '대표자 역량', type: 'textarea', required: true },
          { id: 'team_members', label: '팀원 역량', type: 'textarea', required: false },
        ]
      },
    ],
    extraSections: [
      {
        type: 'cooperation',
        title: '협동가능성 (Cooperation)',
        weight: 20,
        fields: [
          { id: 'cooperation_plan', label: '협력 계획', type: 'textarea', required: true },
          { id: 'network', label: '네트워크 활용', type: 'textarea', required: true },
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
          { id: 'problem_definition', label: '문제점', type: 'textarea', required: true },
          { id: 'traditional_challenge', label: '전통문화 현황 및 과제', type: 'textarea', required: true },
        ]
      },
      {
        type: 'solution',
        title: '실현 가능성',
        weight: 25,
        fields: [
          { id: 'development_plan', label: '개발 계획', type: 'textarea', required: true },
          { id: 'differentiation', label: '차별성', type: 'textarea', required: true },
        ]
      },
      {
        type: 'scaleup',
        title: '성장 전략',
        weight: 25,
        fields: [
          { id: 'business_model', label: '비즈니스 모델', type: 'textarea', required: true },
          { id: 'market_size', label: '시장 규모', type: 'textarea', required: true },
        ]
      },
      {
        type: 'team',
        title: '팀 구성',
        weight: 15,
        fields: [
          { id: 'founder', label: '대표자 역량', type: 'textarea', required: true },
          { id: 'team_members', label: '팀원 역량', type: 'textarea', required: false },
        ]
      },
    ],
    extraSections: [
      {
        type: 'traditional_culture',
        title: '전통문화 활용',
        weight: 10,
        fields: [
          { id: 'cultural_element', label: '활용 전통문화 요소', type: 'textarea', required: true },
          { id: 'modernization', label: '현대화 방안', type: 'textarea', required: true },
        ]
      },
      {
        type: 'social_value',
        title: '사회적 가치',
        weight: 10,
        fields: [
          { id: 'social_impact', label: '사회적 임팩트', type: 'textarea', required: true },
          { id: 'sustainability', label: '지속가능성', type: 'textarea', required: true },
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
          { id: 'problem_definition', label: '문제점', type: 'textarea', required: true },
          { id: 'development_necessity', label: '개발 필요성', type: 'textarea', required: true },
        ]
      },
      {
        type: 'solution',
        title: '실현 가능성',
        weight: 25,
        fields: [
          { id: 'development_plan', label: '개발 계획', type: 'textarea', required: true },
          { id: 'differentiation', label: '차별성', type: 'textarea', required: true },
        ]
      },
      {
        type: 'scaleup',
        title: '성장 전략',
        weight: 25,
        fields: [
          { id: 'business_model', label: '비즈니스 모델', type: 'textarea', required: true },
          { id: 'market_size', label: '시장 규모', type: 'textarea', required: true },
        ]
      },
      {
        type: 'team',
        title: '팀 구성',
        weight: 15,
        fields: [
          { id: 'founder', label: '대표자 역량', type: 'textarea', required: true },
          { id: 'team_members', label: '팀원 역량', type: 'textarea', required: false },
        ]
      },
    ],
    extraSections: [
      {
        type: 'regional_connection',
        title: '지역 연관성',
        weight: 10,
        fields: [
          { id: 'gyeonggi_connection', label: '경기도 연관성', type: 'textarea', required: true },
          { id: 'local_impact', label: '지역 경제 기여', type: 'textarea', required: true },
        ]
      },
      {
        type: 'organization_capacity',
        title: '조직역량',
        weight: 10,
        fields: [
          { id: 'org_structure', label: '조직 구조', type: 'textarea', required: true },
          { id: 'execution_capacity', label: '실행 역량', type: 'textarea', required: true },
        ]
      }
    ]
  }
]

export function getTemplateById(id: string): FormTemplate | undefined {
  return FORM_TEMPLATES.find(t => t.id === id)
}
