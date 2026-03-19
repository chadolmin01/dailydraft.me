import { chatModel } from '@/src/lib/ai/gemini-client'
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

const SYSTEM_PROMPT = (profile: ProfileContext) => `당신은 Draft 플랫폼의 AI 프로필 분석가입니다. 대학생/청년의 프로젝트 팀 매칭을 위해 깊이 있는 정보를 수집하는 역할입니다.

## 사용자 기본 프로필
- 이름: ${profile.name || '미설정'}
- 소속: ${profile.university || '미설정'}${profile.major ? ` ${profile.major}` : ''}
- 포지션: ${profile.position || '미설정'}
- 현재 상황: ${profile.situation || '미설정'}
- 기술: ${profile.skills?.join(', ') || '미설정'}
- 관심 분야: ${profile.interests?.join(', ') || '미설정'}

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

- 첫 메시지: ${profile.name}님의 프로필을 봤다는 걸 살짝 언급하며 자연스럽게 첫 질문. 예: "${profile.name}님, ${profile.position || '개발'}${profile.university ? ` (${profile.university})` : ''}이시군요! 혹시 지금까지 프로젝트를 해본 적 있으세요?"
- 한 번에 질문 1개만. 절대 2개 이상 동시에 묻지 않기
- 사용자 답변에 구체적으로 반응하기. "그렇군요" 대신 답변 내용을 반영한 반응. 예: "팀프 경험이 있으시군요! 그때 어떤 부분을 맡으셨어요?"
- 이미 프로필에 있는 정보(포지션, 기술 등)는 다시 묻지 않기
- 한국어, 반말+존댓말 혼합 (친근하지만 예의 바르게). 2-3문장 이내
- 형식적인 칭찬 금지. "정말 대단하시네요" 같은 과한 반응 금지
- 사용자가 짧게 답하면 ("네", "아니요" 등): 부담 없이 구체화 유도. 예: "전혀 없어도 괜찮아요! 그럼 혼자 작업하는 걸 더 좋아하시는 편인가요?"
- 사용자가 길게 답하면: 핵심을 짧게 짚고 다음으로
- 대화가 5회 이상 진행되면 "거의 다 파악한 것 같아요!" 같이 자연스럽게 마무리 유도. 완료 버튼을 누르라고 직접 언급하지 말 것
- 답변 끝에 이모지 남용 금지. 최대 1개`

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const rateLimitResponse = await checkAIRateLimit(user.id, getClientIp(request))
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const { messages, profile, saveTranscript } = body as {
      messages: Message[]
      profile: ProfileContext
      saveTranscript?: boolean
    }

    // Auto-save transcript to DB on each exchange
    if (saveTranscript && Array.isArray(messages) && messages.length > 0) {
      const transcript = messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: new Date().toISOString(),
      }))
      await supabase.from('profiles')
        .update({ ai_chat_transcript: transcript })
        .eq('user_id', user.id)
    }

    if (!Array.isArray(messages)) {
      return ApiResponse.badRequest('Invalid messages')
    }

    const systemPrompt = SYSTEM_PROMPT(profile)

    // Build chat history for Gemini (exclude the last user message since we'll send it separately)
    const historyMessages = messages.slice(0, -1)
    const chatHistory = historyMessages.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.content }],
    }))

    const chat = chatModel.startChat({
      history: chatHistory.length > 0 ? chatHistory : undefined,
      systemInstruction: { role: 'user', parts: [{ text: systemPrompt }] },
    })

    // Send the last user message, or a trigger for the first question
    const lastUserMsg = messages.length > 0
      ? messages[messages.length - 1].content
      : '프로필 분석 대화를 시작해주세요'

    const result = await chat.sendMessage(lastUserMsg)
    const reply = result.response.text().trim()

    return ApiResponse.ok({ reply })
  } catch (error) {
    console.error('Onboarding chat error:', error)
    return ApiResponse.internalError('채팅 처리 중 오류가 발생했습니다')
  }
}
