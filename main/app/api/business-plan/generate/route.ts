import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logError } from '@/src/lib/error-logging'
import { ApiResponse } from '@/src/lib/api-utils'
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
      return ApiResponse.badRequest('기본 정보(아이템명, 타겟 고객)가 필요합니다.')
    }

    // Get section prompt configuration
    const sectionConfig = SECTION_PROMPTS[section]
    if (!sectionConfig) {
      return ApiResponse.badRequest('지원하지 않는 섹션입니다.')
    }

    // Get industry-specific keywords
    const industryConfig = INDUSTRY_KEYWORDS[basicInfo.industry] || INDUSTRY_KEYWORDS.it_platform

    // Build the prompt
    const systemPrompt = sectionConfig.system
    const userPrompt = buildUserPrompt(section, basicInfo, industryConfig, existingData, generationType, fieldId)

    // Call AI API (using environment variable for API key)
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY

    if (!anthropicApiKey) {
      return ApiResponse.serviceUnavailable('API 키가 설정되지 않았습니다. 관리자에게 문의하세요.')
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
      return ApiResponse.ok({
        content: generatedContent,
        data: { [fieldId]: generatedContent },
        suggestions: [],
        confidence: 0.9
      })
    }

    // Parse section-level response into individual fields
    const parsedData = parseGeneratedContent(section, generatedContent, templateType)

    return ApiResponse.ok({
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
    return ApiResponse.internalError('생성 중 오류가 발생했습니다.')
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

