import { genAI } from '@/src/lib/ai/gemini-client'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { checkAIRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { NextResponse, type NextRequest } from 'next/server'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `당신은 Draft 플랫폼의 도우미 AI입니다. 사용자의 질문에 친절하고 정확하게 답변하세요.

## Draft 플랫폼 소개
Draft는 대학생/청년을 위한 프로젝트 팀 매칭 플랫폼입니다.

## 주요 기능
1. **프로젝트 탐색 (/explore)**: 다양한 프로젝트를 탐색하고 관심 표시 가능
2. **프로젝트 등록 (/projects)**: 자신의 프로젝트를 등록하고 팀원 모집
3. **프로필 (/profile)**: 기술 스택, 관심 분야, 성향 등 프로필 관리
4. **커피챗**: 관심 있는 팀원에게 1:1 대화 요청
5. **AI 프로필 분석**: 온보딩 시 AI 대화를 통해 팀 매칭에 활용될 프로필 데이터 생성
6. **사업 계획서 (/business-plan)**: AI 도움을 받아 사업 계획서 작성
7. **아이디어 검증 (/idea-validator)**: 스타트업 아이디어 검증 도구
8. **대시보드 (/dashboard)**: 활동 요약, 추천 프로젝트, 알림 확인
9. **캘린더 (/calendar)**: 스타트업/해커톤 일정 확인
10. **네트워크 (/network)**: AI 기반 팀원 추천

## 자주 묻는 질문
- 프로젝트 등록: explore 페이지에서 "새 프로젝트" 버튼
- 프로필 수정: 프로필 페이지에서 "수정" 버튼
- 커피챗: 상대방 프로필에서 "커피챗 요청" 버튼
- 팀 매칭: AI가 기술 스택, 성향, 관심 분야를 분석해 자동 추천
- 구독/결제: 설정 > 구독 관리에서 확인

## 답변 규칙
- 한국어 존댓말 사용
- 2-3문장 이내로 간결하게
- 관련 페이지 경로를 함께 안내 (예: "/profile에서 확인할 수 있어요")
- 모르는 내용은 "정확한 답변을 드리기 어렵지만, 버그 리포트로 남겨주시면 확인해드릴게요"
- 기술적 문제는 버그 리포트 탭으로 안내

## 가드레일 (반드시 지킬 것)
- Draft 플랫폼과 **전혀 관련 없는 질문**을 하면 (예: 코딩 과제, 날씨, 숙제, 번역, 일반 상식 등), 반드시 응답 맨 앞에 **[OFF_TOPIC]** 태그를 붙이고 정중히 거절하세요.
- 예시: "[OFF_TOPIC] 죄송해요, 저는 Draft 플랫폼 관련 질문만 도와드릴 수 있어요. 플랫폼 사용에 대해 궁금한 점이 있으시면 편하게 물어보세요!"
- 욕설, 부적절한 발언에도 [OFF_TOPIC] 태그를 붙이고 부드럽게 안내하세요.`

export const POST = withErrorCapture(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const rateLimitResponse = await checkAIRateLimit(user.id, getClientIp(request))
  if (rateLimitResponse) return rateLimitResponse

  const body = await request.json()
  const { messages } = body as { messages: Message[] }

  if (!Array.isArray(messages) || messages.length === 0) {
    return ApiResponse.badRequest('Invalid messages')
  }

  const historyMessages = messages.slice(0, -1)
  const chatHistory = historyMessages.map(m => ({
    role: m.role === 'user' ? 'user' as const : 'model' as const,
    parts: [{ text: m.content }],
  }))

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
    systemInstruction: SYSTEM_PROMPT,
  })

  const chat = model.startChat({
    history: chatHistory.length > 0 ? chatHistory : undefined,
  })

  const lastMsg = messages[messages.length - 1].content

  // Stream response for faster TTFB
  const { stream } = await chat.sendMessageStream(lastMsg)

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.text()
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: true })}\n\n`))
        controller.close()
      }
    },
  })

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
})
