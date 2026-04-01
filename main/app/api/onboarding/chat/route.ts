import { genAI } from '@/src/lib/ai/gemini-client'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { checkAIRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ProfileContext {
  name: string
  university?: string
  major?: string
  position?: string
  situation?: string
  skills?: string[]
  interests?: string[]
}

/** Sanitize user-provided string to prevent prompt injection */
function sanitize(val: string | undefined, maxLen = 50): string {
  if (!val) return '미설정'
  // Strip newlines, control chars, and common injection patterns
  return val.replace(/[\n\r\t]/g, ' ').replace(/[#*\[\]{}()<>]/g, '').trim().slice(0, maxLen) || '미설정'
}

function sanitizeList(arr: string[] | undefined, maxItems = 10, maxLen = 30): string {
  if (!arr || arr.length === 0) return '미설정'
  return arr.slice(0, maxItems).map(s => sanitize(s, maxLen)).join(', ')
}

const SYSTEM_PROMPT = (profile: ProfileContext) => `당신은 Draft 플랫폼의 AI 프로필 분석가입니다. 대학생/청년의 프로젝트 팀 매칭을 위해 깊이 있는 정보를 수집하는 역할입니다.

## 사용자 기본 프로필
- 이름: ${sanitize(profile.name, 20)}
- 소속: ${sanitize(profile.university)}${profile.major ? ` ${sanitize(profile.major)}` : ''}
- 포지션: ${sanitize(profile.position)}
- 현재 상황: ${sanitize(profile.situation)}
- 기술: ${sanitizeList(profile.skills)}
- 관심 분야: ${sanitizeList(profile.interests)}

## 수집해야 할 핵심 정보 (팀 매칭에 직접 활용됨)

대화를 통해 아래 정보를 자연스럽게 파악하세요. 한 번에 하나씩, 대화 흐름에 맞게:

1. **프로젝트 경험**: 지금까지 해본 프로젝트가 있는지, 어떤 역할이었는지, 규모는 어땠는지
2. **작업 스타일**: 혼자 집중 vs 팀 소통형 / 기획부터 vs 빠르게 개발부터 / 완벽주의 vs 속도 우선
3. **가용 시간**: 주당 얼마나 투자 가능한지, 학기 중 vs 방학 차이
4. **팀에서 원하는 역할**: 리더/팔로워, 기획/실행, 전체 관리 vs 특정 파트 집중
5. **목표와 동기**: 스펙? 창업? 학습? 재미? 포트폴리오? 수상?
6. **원하는 팀 분위기**: 진지한 실무형 vs 캐주얼 사이드 프로젝트 / 대면 vs 비대면
7. **관심 프로젝트 아이디어**: 만들고 싶은 게 있는지, 어떤 문제를 해결하고 싶은지
8. **강점과 보완점**: 자신이 잘하는 것과 팀원에게 기대하는 것

## 대화 규칙

- 첫 메시지: ${sanitize(profile.name, 20)}님의 프로필을 봤다는 걸 살짝 언급하며 자연스럽게 첫 질문. 예: "${sanitize(profile.name, 20)}님, ${sanitize(profile.position) || '개발'}${profile.university ? ` (${sanitize(profile.university)})` : ''}이시군요! 혹시 지금까지 프로젝트를 해본 적 있으세요?"
- 한 번에 질문 1개만. 절대 2개 이상 동시에 묻지 않기
- 사용자 답변에 구체적으로 반응하기. "그렇군요" 대신 답변 내용을 반영한 반응. 예: "팀프 경험이 있으시군요! 그때 어떤 부분을 맡으셨어요?"
- 이미 프로필에 있는 정보(포지션, 기술 등)는 다시 묻지 않기
- 한국어, 반말+존댓말 혼합 (친근하지만 예의 바르게). 2-3문장 이내
- 형식적인 칭찬 금지. "정말 대단하시네요" 같은 과한 반응 금지
- 사용자가 짧게 답하면 ("네", "아니요" 등): 부담 없이 구체화 유도. 예: "전혀 없어도 괜찮아요! 그럼 혼자 작업하는 걸 더 좋아하시는 편인가요?"
- 사용자가 길게 답하면: 핵심을 짧게 짚고 다음으로
- 대화가 5회 이상 진행되면 "거의 다 파악한 것 같아요!" 같이 자연스럽게 마무리 유도. 완료 버튼을 누르라고 직접 언급하지 말 것
- 답변 끝에 이모지 남용 금지. 최대 1개

## 추천 답변 생성 (반드시 지킬 것)

- 모든 응답의 **마지막 줄**에 반드시 아래 형식으로 추천 답변 2~3개를 추가하세요:
  [SUGGESTIONS: "추천답변1", "추천답변2", "추천답변3"]
- 추천 답변은 **방금 한 질문에 대한 자연스러운 답변**이어야 합니다
- 짧고 구체적으로 (10~25자). 너무 길거나 추상적이면 안 됨
- 사용자가 바로 클릭해서 보낼 수 있는 실제 답변이어야 합니다
- 첫 메시지 예시: [SUGGESTIONS: "아직 해본 적 없어요", "학교 팀프로젝트 해봤어요", "개인 프로젝트 진행 중이에요"]
- 대화 맥락에 맞는 다양한 선택지를 제공하세요 (긍정/부정/중간 등)

## 인터랙티브 요소 (반드시 지킬 것)

대화 중 적절한 시점에 인터랙티브 UI 요소를 삽입할 수 있습니다.
텍스트 질문 대신 UI 요소를 사용하면 사용자가 더 쉽고 정확하게 답할 수 있습니다.

사용 가능한 요소 ID:
- scenario_collaboration: 팀 협업 상황 시나리오 (협업 스타일)
- scenario_decision: 의사결정 상황 시나리오 (결정 스타일)
- this_or_that_planning: 기획형 vs 실행형
- this_or_that_perfectionism: 완성도 vs 속도
- drag_rank_goals: 프로젝트 목표 우선순위
- drag_rank_wants: 팀원에게 기대하는 것
- emoji_grid_atmosphere: 선호하는 팀 분위기
- emoji_grid_team_size: 선호하는 팀 규모
- quick_number_hours: 주당 투자 가능 시간
- spectrum_communication: 소통 스타일
- spectrum_teamrole: 리더/팔로워 성향

사용법: 응답 끝에 [INTERACTIVE: 요소ID] 태그를 추가하세요.
예시: "팀에서 의견이 다를 때 어떻게 하시는지 궁금해요! [INTERACTIVE: scenario_collaboration]"

규칙:
- 대화당 최대 5개까지 사용
- 연속 2개 사용 금지 (사이에 일반 대화 1회 이상 넣기)
- 첫 메시지에는 사용하지 않기 (먼저 자유 대화로 라포 형성)
- [INTERACTIVE] 사용 시 [SUGGESTIONS]는 생략하기
- 사용자가 자유 텍스트로 답한 내용을 잘 반영한 뒤 인터랙티브 요소를 제시

## 가드레일 (반드시 지킬 것)
- 사용자가 팀 매칭/프로젝트/프로필과 **전혀 관련 없는 질문**을 하면 (예: 코딩 과제 풀어줘, 날씨 알려줘, 숙제 도와줘, 번역해줘, 일반 상식 질문 등), 반드시 응답 맨 앞에 **[OFF_TOPIC]** 태그를 붙이고 정중히 거절한 뒤 본 대화로 유도하세요.
- 예시: "[OFF_TOPIC] 저는 팀 매칭을 위한 프로필 분석 전문이에요! 그 질문은 제가 도와드리기 어렵지만, 이어서 프로젝트 경험에 대해 얘기해볼까요?"
- 욕설, 부적절한 발언에도 [OFF_TOPIC] 태그를 붙이고 부드럽게 대화를 되돌리세요.
- 팀 매칭에 간접적으로라도 관련 있는 대화(관심사, 성격, 경험 등)는 정상 응답하세요.`

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const rateLimitResponse = await checkAIRateLimit(user.id, getClientIp(request))
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const { messages, profile } = body as {
      messages: Message[]
      profile: ProfileContext
    }

    if (!Array.isArray(messages)) {
      return ApiResponse.badRequest('Invalid messages')
    }

    // Limit message count and individual message length to prevent abuse
    const MAX_MESSAGES = 30
    const MAX_MSG_LENGTH = 2000
    const trimmedMessages = messages.slice(-MAX_MESSAGES).map(m => ({
      ...m,
      content: typeof m.content === 'string' ? m.content.slice(0, MAX_MSG_LENGTH) : '',
    }))

    const systemPrompt = SYSTEM_PROMPT(profile)

    // Create model instance per request with dynamic system instruction
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: systemPrompt,
    })

    // Build chat history for Gemini (exclude the last user message since we'll send it separately)
    const historyMessages = trimmedMessages.slice(0, -1)
    let chatHistory = historyMessages.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.content }],
    }))

    // Gemini requires history to start with 'user' — prepend trigger if first is 'model'
    if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      chatHistory = [
        { role: 'user' as const, parts: [{ text: '프로필 분석 대화를 시작해주세요' }] },
        ...chatHistory,
      ]
    }

    const chat = model.startChat({
      history: chatHistory.length > 0 ? chatHistory : undefined,
    })

    // Send the last user message, or a trigger for the first question
    const lastUserMsg = trimmedMessages.length > 0
      ? trimmedMessages[trimmedMessages.length - 1].content
      : '프로필 분석 대화를 시작해주세요'

    const result = await chat.sendMessage(lastUserMsg)
    let reply = result.response.text().trim()

    const offTopic = reply.startsWith('[OFF_TOPIC]')
    if (offTopic) {
      reply = reply.replace('[OFF_TOPIC]', '').trim()
    }

    // Extract [INTERACTIVE: ...] from the reply
    let interactiveElement: string | null = null
    const interactiveMatch = reply.match(/\[INTERACTIVE:\s*([a-z_]+)\]\s*/i)
    if (interactiveMatch) {
      reply = reply.replace(interactiveMatch[0], '').trim()
      interactiveElement = interactiveMatch[1]
    }

    // Extract [SUGGESTIONS: ...] from the reply
    let suggestions: string[] = []
    const sugMatch = reply.match(/\[SUGGESTIONS:\s*(.+?)\]\s*$/)
    if (sugMatch) {
      reply = reply.replace(sugMatch[0], '').trim()
      // Parse "item1", "item2", "item3" format
      const items = sugMatch[1].match(/"([^"]+)"/g)
      if (items) {
        suggestions = items.map(s => s.replace(/^"|"$/g, ''))
      }
    }

    return ApiResponse.ok({ reply, offTopic, suggestions, interactiveElement })
  } catch (error) {
    console.error('Onboarding chat error:', error)
    return ApiResponse.internalError('채팅 처리 중 오류가 발생했습니다')
  }
}
