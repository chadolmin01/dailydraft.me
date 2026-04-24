import { NextRequest } from 'next/server'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { PrdAnalysisSchema, PrdGenerationSchema } from '@/src/lib/ai/schemas'
import { checkAIRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
})

const ANALYSIS_PROMPT = `당신은 스타트업 아이디어 분석가입니다. 3명의 팀원이 제출한 텍스트에서 핵심 정보를 추출하세요.

[중요 원칙]
- 짧은 문장이라도 최대한 의미를 파악하여 추출하세요.
- 절대로 "불명확"이라고 하지 마세요. 짧더라도 있는 그대로 추출하세요.

각 필드:
- domain: 제품 도메인
- product_type: 앱/웹/서비스
- pm_intent: { core_idea, business_model, priority_features[], keywords[] }
- designer_intent: { mood, references[], keywords[] }
- developer_intent: { suggested_stack[], platforms[], keywords[] }
- conflicts: [{ type, description, roles[] }]
- missing_info: [누락정보]`

const PRD_PROMPT = `당신은 IT 스타트업의 수석 PM입니다. 분석된 입력 데이터를 바탕으로 PRD 초안을 작성하세요.

[MVP 수렴 원칙 - 반드시 준수]

1. P0는 핵심 가설 검증 기능만:
   - MVP의 목적은 "유저가 이 서비스를 쓰는가?"를 검증하는 것
   - 결제/구독 시스템은 P1 이하로. PG사 연동은 MVP에서 제외하고 수동/폼 결제로 우회
   - P0는 최대 1-2개만. 나머지는 P1, P2로 내려라

2. 기술 스택은 하나로 수렴:
   - 웹(Next.js/React)과 앱(Flutter/RN)이 동시에 제안되면, 반드시 하나만 선택하라
   - 선택 기준: 타겟 유저 접근성. 결정을 내리고, 나머지는 skip_for_now에 넣어라
   - "검토 필요"라고 쓰지 말고 "X로 간다"고 결론 내려라

3. open_questions는 진짜 결정 못하는 것만:
   - 기술 스택 선택 같은 건 AI가 결정하라
   - open_questions에는 비즈니스 판단이 필요한 것만 (가격 정책, 파트너십 등)

4. 기능 추론 금지:
   - 사용자가 언급하지 않은 기능을 추가하지 마라

각 필드:
- elevator_pitch: 제품 한 줄 요약
- problem_and_target: { persona, pain_point, current_alternative }
- core_features: [{ feature_name, user_story, priority: 'P0'|'P1'|'P2' }]
- role_perspectives: { business{monetization, key_metrics}, design{mood_keywords[], references[]}, tech{expected_stack[], technical_risks} }
- open_questions: [{ issue, involved_roles[], ai_suggestion }]
- next_steps: { immediate_action, mvp_scope[], skip_for_now[], decision_needed }`

export const POST = withErrorCapture(async (request: NextRequest) => {
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_PROJECT_ID) {
    return ApiResponse.serviceUnavailable('AI 서비스를 사용할 수 없습니다.')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return ApiResponse.unauthorized('로그인이 필요합니다')
  }

  const rateLimitResponse = await checkAIRateLimit(user.id, getClientIp(request))
  if (rateLimitResponse) return rateLimitResponse

  const { pm, designer, developer } = await request.json()

  if (!pm && !designer && !developer) {
    return ApiResponse.badRequest('최소 하나 이상의 역할 입력이 필요합니다.')
  }

  // 입력 길이 제한 (각 2000자)
  const safePm = typeof pm === 'string' ? pm.slice(0, 2000) : ''
  const safeDesigner = typeof designer === 'string' ? designer.slice(0, 2000) : ''
  const safeDeveloper = typeof developer === 'string' ? developer.slice(0, 2000) : ''

  const rawInput = `[PM/기획자] ${safePm || '(없음)'}\n[디자이너] ${safeDesigner || '(없음)'}\n[개발자] ${safeDeveloper || '(없음)'}`

  // 1단계: 분석
  const { object: analysis } = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: PrdAnalysisSchema,
    system: ANALYSIS_PROMPT,
    prompt: rawInput,
  })

  // 2단계: PRD 생성
  const prdPrompt = `도메인: ${analysis.domain}
PM/기획자: ${analysis.pm_intent?.core_idea || '미정'}, BM: ${analysis.pm_intent?.business_model || '미정'} (결제 시스템은 MVP에서 P1 이하로)
디자이너: ${analysis.designer_intent?.mood || '미정'}, 레퍼런스: ${analysis.designer_intent?.references?.join(', ') || '없음'}
개발자 제안 스택: ${analysis.developer_intent?.suggested_stack?.join(', ') || '미정'} (2개 이상이면 하나만 선택하고 결론 내려라)
플랫폼: ${analysis.developer_intent?.platforms?.join(', ') || '미정'}
충돌: ${analysis.conflicts?.length > 0 ? analysis.conflicts.map((c: { description: string }) => c.description).join(', ') : '없음'}`

  const { object: prd } = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: PrdGenerationSchema,
    system: PRD_PROMPT,
    prompt: prdPrompt,
  })

  return ApiResponse.ok({ success: true, data: prd, analysis })
})
