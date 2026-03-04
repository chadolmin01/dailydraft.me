import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logError } from '@/src/lib/error-logging'
import {
  getEvaluationCriteria,
  getFormSpecificPrompt,
  DISQUALIFICATION_CONDITIONS,
  FUND_CATEGORIES,
  FormEvaluationCriteria
} from '@/src/lib/evaluation-criteria'
import { FormTemplateType } from '@/src/types/business-plan'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// PSST 섹션별 프롬프트 시스템 (2025년 정부 공고문 기반)
const SECTION_PROMPTS: Record<string, {
  system: string
  structure: string[]
  templates: Record<string, string>
}> = {
  problem: {
    system: `당신은 정부 창업지원사업 사업계획서 "문제인식(Problem)" 섹션 작성 전문가입니다.

[평가 기준 - 2025년 공고문 기반]
평가항목: "창업 아이템의 개발 배경 및 필요성 등"
최소 점수: 60점 이상 필수 (미달 시 선정 대상 제외)

심사위원이 '이건 진짜 문제다'라고 느끼게 하는 것이 목표입니다.

핵심 규칙:
1. 고객 관점에서 서술 (창업자 관점 X)
2. 정량적 데이터 포함 (통계, 설문, 인터뷰) - 반드시 출처 명시
3. 기존 솔루션의 한계점 명시
4. 두괄식 구조 (결론 먼저)
5. 문제는 최대 3개로 집중

[주의사항]
- 개인정보(학력, 소속 등) 삭제 또는 마스킹 필요
- 추상적 형용사(매우, 엄청난 등) 대신 구체적 수치 사용
- 타인의 사업계획서 모방/표절 금지`,
    structure: [
      '문제 상황 도입 (후킹)',
      '문제의 심각성 (정량 데이터)',
      '기존 솔루션의 한계',
      '문제 해결 시 기대 효과'
    ],
    templates: {
      hook: '[타겟 고객]의 [N]%가 [문제 상황]을 경험합니다.',
      severity: '이로 인해 연간 [금액]원의 [손실/비용]이 발생하며, [부정적 결과]로 이어집니다.',
      existing_limit: '기존 [솔루션A]는 [한계1], [솔루션B]는 [한계2]의 문제가 있습니다.',
      opportunity: '이 문제를 해결하면 [긍정적 결과]를 달성할 수 있습니다.'
    }
  },
  solution: {
    system: `당신은 정부 창업지원사업 사업계획서 "실현가능성(Solution)" 섹션 작성 전문가입니다.

[평가 기준 - 2025년 공고문 기반]
평가항목: "창업 아이템의 사업기간 내 개발 또는 구체화 계획 등"
최소 점수: 60점 이상 필수 (미달 시 선정 대상 제외)

Problem에서 제시한 문제를 어떻게 해결하는지 구체적으로 설명합니다.

핵심 규칙:
1. Problem과 1:1 매칭 (문제별로 해결책 제시)
2. 기술보다 '고객 가치' 중심 서술
3. MVP/프로토타입 증거 포함 (개발 현황 필수)
4. 경쟁사 대비 차별점 명확화
5. 핵심 기능은 3-5개로 제한
6. 사업기간(8-10개월) 내 구체화 가능한 계획

[특히 강조할 점]
- 초기창업패키지의 경우 심층 인터뷰(30분) 대비 필요
- 지식재산권 현황 언급 권장 (특허, 실용신안 등)`,
    structure: [
      '솔루션 핵심 가치 (한 문장)',
      '작동 방식 (How it works)',
      '핵심 기능 (최대 4개)',
      '차별화 포인트',
      '개발 현황/로드맵'
    ],
    templates: {
      core_value: '[서비스명]은 [핵심 기술/방법]을 통해 [문제]를 해결하여 [고객 가치]를 제공합니다.',
      how_it_works: '[단계1] → [단계2] → [단계3]의 과정으로 [결과]를 달성합니다.',
      feature: '• [기능명]: [기능 설명] → [고객 혜택]',
      differentiation: '기존 [경쟁사]와 달리, [차별점]을 통해 [우위]를 확보합니다.'
    }
  },
  scaleup: {
    system: `당신은 정부 창업지원사업 사업계획서 "성장전략(Scale-up)" 섹션 작성 전문가입니다.

[평가 기준 - 2025년 공고문 기반]
평가항목: "창업 아이템의 사업화를 위한 차별성, 수익모델, 자금조달 방안 등"
최소 점수: 60점 이상 필수 (미달 시 선정 대상 제외)

시장 규모와 성장 가능성, 비즈니스 모델을 정량적으로 제시합니다.

핵심 규칙:
1. 시장 규모는 TAM/SAM/SOM 모두 포함 (출처 필수!)
2. 수익 모델 구체화 (가격 정책, Unit Economics)
3. 단계별 성장 전략 (3단계)
4. 마일스톤과 KPI 설정
5. 자금조달 방안 명시

[사업비 집행 비목 참고]
재료비, 외주용역비, 기계장치, 특허권등무형자산취득비, 인건비,
지급수수료, 여비, 교육훈련비, 광고선전비

[가점 기회]
- 기후테크 분야: +1점 (클린테크, 카본테크, 에코테크, 푸드테크, 지오테크)
- 1억원 이상 투자유치 실적: +1점 (초기창업패키지만)`,
    structure: [
      'TAM/SAM/SOM 시장 규모',
      '수익 모델',
      '시장 진입 전략 (1단계)',
      '성장 전략 (2단계)',
      '확장 전략 (3단계)'
    ],
    templates: {
      tam: 'TAM: [시장명] 시장 전체 규모 [금액] ([출처], [연도])',
      sam: 'SAM: [세분 시장] [금액] (TAM의 [N]%)',
      som: 'SOM: [목표 시장] [금액] (3년 내 [N]% 점유 목표)',
      stage: '[N]단계 ([기간]): [타겟]을 대상으로 [전략]을 통해 [목표] 달성'
    }
  },
  team: {
    system: `당신은 정부 창업지원사업 사업계획서 "팀(기업) 구성(Team)" 섹션 작성 전문가입니다.

[평가 기준 - 2025년 공고문 기반]
평가항목: "대표자 및 고용 (예정)인력이 보유한 기술 역량과 노하우 등"
최소 점수: 60점 이상 필수 (미달 시 선정 대상 제외)

팀이 이 사업을 성공시킬 수 있는 이유를 설명합니다.

핵심 규칙:
1. 대표자 관련 경력/전문성 강조
2. 팀원별 역할 분담 명확화
3. '왜 이 팀인가' 설명
4. 부족한 역량 보완 계획 포함
5. 자문단/파트너 네트워크 언급

[가점 기회]
- 인공지능(융합혁신) 대학원 졸업생: +2점
  (고려대, 서울대, KAIST, 연세대 등 19개 대학)
- 정부 주관 창업경진대회 장관급 이상 수상: +1점

[주의사항]
- 학생창업유망팀300의 경우 팀대표가 반드시 발표 (팀원 발표 시 -5점)
- 협약기간 내 대표자 변경 시 협약취소 가능`,
    structure: [
      '대표자 소개 (역량 + 창업 동기)',
      '핵심 팀원 (역할 + 경력)',
      '팀의 차별적 강점',
      '부족 역량 보완 계획',
      '자문단/파트너'
    ],
    templates: {
      founder: '[이름] 대표 | [현 직함]\n- [관련 경력 N년]\n- [핵심 성과/전문성]\n- 창업 동기: [동기]',
      member: '[이름] | [역할]\n- [이전 소속/경력]\n- 담당: [담당 업무]',
      strength: '우리 팀만의 강점: [업계 경험/기술력/네트워크] 보유',
      plan: '향후 [N]개월 내 [역할] 담당자 [N]명 채용 예정'
    }
  }
}

// 업종별 키워드
const INDUSTRY_KEYWORDS: Record<string, {
  problem_focus: string[]
  solution_keywords: string[]
  metrics: string[]
}> = {
  it_platform: {
    problem_focus: ['비효율', '정보 비대칭', '접근성', '디지털 전환'],
    solution_keywords: ['자동화', 'AI', '플랫폼', '매칭', 'SaaS'],
    metrics: ['MAU', 'DAU', '전환율', '리텐션', 'ARPU']
  },
  manufacturing: {
    problem_focus: ['품질', '비용', '생산성', '안전'],
    solution_keywords: ['특허', '신소재', 'IoT', '자동화', '스마트팩토리'],
    metrics: ['생산량', '불량률', '원가절감율', '납기준수율']
  },
  bio_healthcare: {
    problem_focus: ['접근성', '정확도', '비용', '편의성'],
    solution_keywords: ['AI진단', '디지털치료', '원격의료', '개인맞춤'],
    metrics: ['정확도', '임상결과', '환자수', '재방문율']
  },
  food_fnb: {
    problem_focus: ['건강', '편의성', '지속가능성', '가격'],
    solution_keywords: ['클린라벨', '대체식품', '밀키트', 'D2C'],
    metrics: ['재구매율', '객단가', '유통채널수', 'SKU']
  },
  education: {
    problem_focus: ['효율', '개인화', '접근성', '비용'],
    solution_keywords: ['에듀테크', 'AI튜터', '적응학습', '게이미피케이션'],
    metrics: ['학습완료율', 'NPS', '성적향상률', '재등록률']
  },
  fintech: {
    problem_focus: ['편의성', '비용', '접근성', '보안'],
    solution_keywords: ['간편결제', '로보어드바이저', 'P2P', '블록체인'],
    metrics: ['거래량', '사용자수', '대출승인률', '연체율']
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      section,
      fieldId,
      templateType,
      generationType = 'draft',
      context
    } = body

    const { basicInfo, existingData } = context || {}

    if (!basicInfo?.itemName || !basicInfo?.targetCustomer) {
      return NextResponse.json(
        { error: '기본 정보(아이템명, 타겟 고객)가 필요합니다.' },
        { status: 400 }
      )
    }

    // Get section prompt configuration
    const sectionConfig = SECTION_PROMPTS[section]
    if (!sectionConfig) {
      return NextResponse.json(
        { error: '지원하지 않는 섹션입니다.' },
        { status: 400 }
      )
    }

    // Get industry-specific keywords
    const industryConfig = INDUSTRY_KEYWORDS[basicInfo.industry] || INDUSTRY_KEYWORDS.it_platform

    // Build the prompt
    const systemPrompt = sectionConfig.system
    const userPrompt = buildUserPrompt(section, basicInfo, industryConfig, existingData, generationType, fieldId)

    // Call AI API (using environment variable for API key)
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY

    if (!anthropicApiKey) {
      // Return mock data for development
      const mockContent = generateMockContent(section, basicInfo, fieldId)
      return NextResponse.json({
        content: mockContent,
        data: fieldId ? { [fieldId]: mockContent } : mockContent,
        suggestions: [],
        confidence: 0.85
      })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }

    const aiResponse = await response.json()
    const generatedContent = aiResponse.content[0]?.text || ''

    // Parse the response based on field or section
    if (fieldId) {
      return NextResponse.json({
        content: generatedContent,
        data: { [fieldId]: generatedContent },
        suggestions: [],
        confidence: 0.9
      })
    }

    // Parse section-level response into individual fields
    const parsedData = parseGeneratedContent(section, generatedContent, templateType)

    return NextResponse.json({
      content: generatedContent,
      data: parsedData,
      suggestions: [],
      confidence: 0.9
    })

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('Business plan generation error:', error)
    await logError({
      level: 'error',
      source: 'api',
      errorCode: err.name,
      message: err.message,
      stackTrace: err.stack,
      endpoint: '/api/business-plan/generate',
      method: 'POST',
    })
    return NextResponse.json(
      { error: '생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

function buildUserPrompt(
  section: string,
  basicInfo: {
    itemName: string
    oneLiner: string
    targetCustomer: string
    industry: string
    fundingAmount?: number
    templateType?: FormTemplateType
  },
  industryConfig: typeof INDUSTRY_KEYWORDS[string],
  existingData: Record<string, Record<string, string>> | undefined,
  generationType: string,
  fieldId?: string
): string {
  // 양식별 평가기준 가져오기
  const templateType = basicInfo.templateType || 'yebi-chogi'
  const formCriteria = getEvaluationCriteria(templateType)
  const formSpecificPrompt = getFormSpecificPrompt(templateType)

  const baseContext = `
## 사업 정보
- 아이템명: ${basicInfo.itemName}
- 한 줄 설명: ${basicInfo.oneLiner}
- 타겟 고객: ${basicInfo.targetCustomer}
- 업종: ${basicInfo.industry}
- 신청 양식: ${formCriteria.name}
${basicInfo.fundingAmount ? `- 희망 지원금: ${basicInfo.fundingAmount}만원` : ''}

## 업종별 키워드 (참고)
- 문제 초점: ${industryConfig.problem_focus.join(', ')}
- 솔루션 키워드: ${industryConfig.solution_keywords.join(', ')}
- 핵심 지표: ${industryConfig.metrics.join(', ')}
${formSpecificPrompt}`

  const existingContent = existingData?.[section]
    ? `\n## 기존 작성 내용\n${JSON.stringify(existingData[section], null, 2)}`
    : ''

  let instruction = ''

  if (fieldId) {
    instruction = `다음 필드의 내용을 작성해주세요: ${fieldId}\n\n작성 시 위의 사업 정보를 참고하여 PSST 프레임워크에 맞게 작성해주세요. 500-800자 내외로 작성하고, 구체적인 수치와 데이터를 포함해주세요.`
  } else {
    switch (generationType) {
      case 'draft':
        instruction = `${section} 섹션의 전체 내용을 초안으로 작성해주세요.\n\n각 필드별로 구분하여 작성하고, 총 1000-1500자 내외로 작성해주세요.`
        break
      case 'improve':
        instruction = `기존 작성 내용을 더 설득력 있게 개선해주세요.\n\n- 추상적 표현을 구체적 수치로 변환\n- 두괄식 구조로 재구성\n- 심사위원 관점에서 보완`
        break
      case 'expand':
        instruction = `기존 작성 내용에 더 많은 세부 정보를 추가해주세요.\n\n- 추가 데이터/통계 보강\n- 사례/예시 추가\n- 근거 자료 보완`
        break
    }
  }

  return `${baseContext}${existingContent}\n\n## 요청\n${instruction}`
}

function parseGeneratedContent(
  section: string,
  content: string,
  templateType: string
): Record<string, string> {
  // Simple parsing - split by common field markers
  const result: Record<string, string> = {}

  // Default field mappings
  const fieldMappings: Record<string, string[]> = {
    problem: ['market_status', 'problem_definition', 'development_necessity'],
    solution: ['development_plan', 'differentiation', 'competitiveness'],
    scaleup: ['business_model', 'market_size', 'roadmap'],
    team: ['founder', 'team_members', 'team_synergy']
  }

  const fields = fieldMappings[section] || []

  // Split content by section markers or distribute evenly
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim())

  fields.forEach((field, index) => {
    if (paragraphs[index]) {
      result[field] = paragraphs[index].trim()
    } else if (paragraphs.length > 0) {
      // If not enough paragraphs, use the whole content for the first field
      result[field] = index === 0 ? content : ''
    }
  })

  return result
}

function generateMockContent(
  section: string,
  basicInfo: { itemName: string; oneLiner: string; targetCustomer: string },
  fieldId?: string
): string | Record<string, string> {
  const mockTemplates: Record<string, Record<string, string>> = {
    problem: {
      market_status: `${basicInfo.targetCustomer}를 대상으로 한 시장 현황을 분석한 결과, 해당 시장은 연평균 15%의 성장률을 보이고 있습니다. 그러나 현재 시장에서는 고객의 니즈를 충족시키는 솔루션이 부재한 상황입니다.

관련 시장 규모는 2024년 기준 약 5,000억원으로 추정되며, 2027년에는 8,000억원 규모로 성장할 것으로 전망됩니다.`,
      problem_definition: `${basicInfo.targetCustomer}의 72%가 현재 사용 중인 솔루션에 불만족하고 있습니다 (자체 설문조사, N=200, 2024.01).

주요 문제점:
1. 기존 솔루션의 복잡한 사용성 (응답자 65%)
2. 높은 비용 부담 (응답자 58%)
3. 개인화된 서비스 부재 (응답자 53%)

이로 인해 평균적으로 월 50만원의 추가 비용이 발생하고, 업무 효율이 30% 저하되는 문제가 있습니다.`,
      development_necessity: `${basicInfo.itemName}의 개발은 다음과 같은 시장의 요구에 대응하기 위해 필수적입니다.

1. 디지털 전환 가속화: 코로나19 이후 디지털 솔루션에 대한 수요가 300% 증가
2. 비용 절감 니즈: 기업들의 비용 효율화 요구 증대
3. 사용자 경험 중시: MZ세대의 직관적 UX에 대한 기대 상승

${basicInfo.oneLiner}를 통해 이러한 시장의 요구를 충족시킬 수 있습니다.`
    },
    solution: {
      development_plan: `${basicInfo.itemName}은 3단계 개발 로드맵을 통해 구현됩니다.

[1단계: MVP 개발] (3개월)
- 핵심 기능 구현
- 베타 사용자 100명 확보
- 사용성 테스트 및 피드백 수집

[2단계: 기능 고도화] (3-6개월)
- AI 기반 개인화 기능 추가
- 대시보드 및 분석 기능 구현
- 외부 서비스 연동 API 개발

[3단계: 확장] (6-12개월)
- B2B 기능 확장
- 다국어 지원
- 엔터프라이즈 버전 출시`,
      differentiation: `${basicInfo.itemName}의 핵심 차별화 포인트:

1. **AI 기반 자동화**: 기존 수작업 대비 처리 시간 80% 단축
2. **직관적 UX**: 5분 내 온보딩 완료 (경쟁사 평균 30분)
3. **합리적 가격**: 경쟁사 대비 40% 저렴한 가격 정책
4. **국내 최적화**: 한국 시장 특성에 맞춘 기능 제공

경쟁사 A가 기능 중심이라면, ${basicInfo.itemName}은 사용자 경험 중심으로 설계되었습니다.`,
      competitiveness: `기술적 경쟁력:
- 자체 개발 AI 엔진 (특허 출원 중)
- 99.9% 서비스 가용성 보장
- 실시간 데이터 처리 (지연시간 < 100ms)

비즈니스 경쟁력:
- ${basicInfo.targetCustomer} 대상 MVP 테스트 완료 (만족도 4.5/5.0)
- 초기 파트너사 3개 확보 (LOI 체결)
- 관련 분야 전문가 네트워크 보유`
    },
    scaleup: {
      business_model: `수익 모델:

1. **구독 모델** (70%)
   - Basic: 월 29,000원 (개인)
   - Pro: 월 99,000원 (팀)
   - Enterprise: 협의 (대기업)

2. **트랜잭션 수수료** (20%)
   - 거래당 1-3% 수수료

3. **프리미엄 서비스** (10%)
   - 컨설팅, 교육, 커스터마이징

예상 Unit Economics:
- CAC: 50,000원
- LTV: 350,000원 (12개월 기준)
- LTV/CAC: 7.0`,
      market_size: `시장 규모 분석:

**TAM (전체 시장)**: 2조원
- ${basicInfo.targetCustomer} 관련 전체 시장
- 출처: 한국소프트웨어산업협회, 2024

**SAM (유효 시장)**: 5,000억원
- 디지털 솔루션 도입 의향이 있는 기업
- TAM의 25%

**SOM (목표 시장)**: 100억원
- 3년 내 점유 목표: 2%
- 연 고객 3,500개사 확보 목표

시장 성장률: 연평균 18% (CAGR)`,
      roadmap: `사업화 로드맵:

**1단계: 시장 진입** (0-6개월)
- 타겟: 스타트업 및 중소기업
- 전략: 무료 체험 + 바이럴 마케팅
- KPI: MAU 5,000, 유료 전환율 5%

**2단계: 성장** (6-12개월)
- 타겟: 중견기업으로 확대
- 전략: 파트너십 마케팅, 세미나
- KPI: MAU 20,000, MRR 1억원

**3단계: 확장** (12-24개월)
- 타겟: 대기업 + 해외 진출
- 전략: 엔터프라이즈 영업팀 구축
- KPI: ARR 30억원, 해외 매출 10%`
    },
    team: {
      founder: `[대표자명] 대표 | CEO & Founder

경력 및 전문성:
- ${basicInfo.itemName} 관련 분야 7년 경력
- 전 A사 Product Manager (5년)
- B대학교 컴퓨터공학 석사

핵심 성과:
- A사 신규 프로덕트 런칭, 연 매출 50억원 달성
- 관련 특허 2건 보유
- 스타트업 멘토링 3년 경험

창업 동기:
${basicInfo.targetCustomer}로서 직접 겪은 불편함을 해결하고자 창업을 결심했습니다. ${basicInfo.oneLiner}를 통해 시장의 비효율을 개선하고자 합니다.`,
      team_members: `핵심 팀원:

**[CTO명]** | CTO
- 네이버 시니어 개발자 출신 (6년)
- 대용량 트래픽 처리 전문
- 담당: 기술 총괄, 아키텍처 설계

**[CMO명]** | CMO
- 카카오 마케팅팀 출신 (4년)
- B2B SaaS 마케팅 전문
- 담당: 마케팅 전략, 그로스해킹

**[개발자명]** | Lead Developer
- 토스 백엔드 개발자 출신 (3년)
- 담당: 백엔드 개발, API 설계`,
      team_synergy: `팀 시너지:

**왜 이 팀인가?**
1. 대표의 도메인 전문성 + CTO의 기술력 = 제품 완성도
2. 전원 스타트업 경험 → 린 스타트업 방법론 체화
3. 상호 보완적 역량 (기획/개발/마케팅)

**팀 문화**
- 주 2회 전체 스탠드업 미팅
- OKR 기반 성과 관리
- 투명한 의사결정 구조

**보완 계획**
- 6개월 내 디자이너 1명 채용 예정
- 영업/CS 담당자 2명 채용 계획
- 자문위원: 업계 전문가 3인 확보`
    }
  }

  if (fieldId && mockTemplates[section]?.[fieldId]) {
    return mockTemplates[section][fieldId]
  }

  return mockTemplates[section] || {}
}
