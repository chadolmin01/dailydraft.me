import { chatModel } from './gemini-client'
import type { ChatMessage } from '@/src/types/profile'

const SYSTEM_PROMPT = `당신은 스타트업 전문 팀 빌딩 어드바이저입니다. 사용자가 성공적인 팀을 구축할 수 있도록 비전, 목표, 경험, 인재상을 명확히 파악하는 것이 목표입니다.

## 허용된 대화 주제 (4가지만)
1. **아이디어** - 구상 중인 아이디어, 해결하려는 문제, 서비스/제품 관련
2. **목표** - 단기/장기 목표, 성장 계획, 성공 지표 관련
3. **팀** - 이상적인 팀원, 협업 스타일, 팀 문화 관련
4. **비전** - 미래 비전, 5년 후 모습, 세상에 미치고 싶은 영향 관련

## 대화 규칙
1. 한 번에 하나의 질문만 하십시오.
2. 질문은 간결하고 명확하게 (2-3 문장 이내).
3. 한국어로 대화하십시오.
4. 전문적이고 신뢰감을 주는 비즈니스 매너를 유지하십시오.

## 중요: 주제 이탈 처리
사용자가 위 4가지 주제(아이디어, 목표, 팀, 비전)와 관련 없는 이야기를 하면:
- 정중하게 "해당 내용은 팀 빌딩과 관련이 없어 답변드리기 어렵습니다."라고 안내
- 다시 4가지 주제 중 하나를 선택하도록 유도
- 예: 날씨, 음식, 연예인, 일반 잡담, 코딩 질문 등은 모두 거부

## 대화 종료 유도
- 사용자 메시지가 7-8개가 되면: "충분한 정보가 모였습니다. 마지막으로 한 가지만 더 여쭤봐도 될까요?"
- 사용자 메시지가 9개 이상이면: "좋은 대화였습니다. 이제 '완료하기' 버튼을 눌러 프로필을 저장하시면 됩니다."라고 안내하고 더 이상 질문하지 마십시오.

사용자의 답변을 경청하고, 문맥에 맞게 정중히 다음 질문으로 연결하십시오.`

export async function startAIChatSession(): Promise<string> {
  const chat = chatModel.startChat({
    history: [],
  })

  const result = await chat.sendMessage(
    '안녕하십니까. 스타트업 팀 빌딩을 지원하는 AI 어드바이저입니다. 귀하에게 최적화된 팀 구성을 제안하기 위해 몇 가지 인터뷰를 진행하고자 합니다. 먼저, 현재 구상하고 계신 아이디어나 프로젝트에 대해 설명해 주시겠습니까?'
  )

  return result.response.text()
}

/**
 * 대화가 6턴 이상이면 이전 턴들을 요약 텍스트로 압축하고
 * 최근 4턴만 전체 전송하여 토큰 사용량을 절감합니다.
 * 요약은 별도 API 호출 없이 이전 턴 content를 concat + truncate 방식으로 생성.
 */
function compressHistory(
  messages: ChatMessage[]
): { role: string; parts: { text: string }[] }[] {
  // 첫 메시지(시스템/인트로)를 제외한 실제 대화 메시지
  const conversation = messages.slice(1)

  const RECENT_TURN_COUNT = 4
  // 턴 수 기준: user+model 쌍이 아닌 메시지 개수 기준
  if (conversation.length <= RECENT_TURN_COUNT * 2) {
    // 6턴 이하면 압축 불필요 — 전체 전송
    return conversation.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))
  }

  // 이전 대화 (최근 4턴 제외)와 최근 4턴 분리
  // 최근 8개 메시지 = 최근 4턴(user+model 쌍)
  const recentCount = RECENT_TURN_COUNT * 2
  const olderMessages = conversation.slice(0, -recentCount)
  const recentMessages = conversation.slice(-recentCount)

  // 이전 대화를 간단한 요약 텍스트로 압축 (추가 API 호출 없이 concat + truncate)
  const MAX_SUMMARY_LENGTH = 1500
  const summaryText = olderMessages
    .map((msg) => {
      const speaker = msg.role === 'user' ? '사용자' : 'AI'
      // 각 메시지를 150자로 truncate하여 핵심만 보존
      const truncatedContent =
        msg.content.length > 150
          ? msg.content.slice(0, 150) + '...'
          : msg.content
      return `${speaker}: ${truncatedContent}`
    })
    .join('\n')
    .slice(0, MAX_SUMMARY_LENGTH)

  // 요약을 user 메시지로 시작하여 올바른 user-model 교대 구조 유지
  const compressedHistory: { role: string; parts: { text: string }[] }[] = [
    {
      role: 'user',
      parts: [
        {
          text: `[이전 대화 요약]\n${summaryText}\n\n(위는 이전 대화의 요약입니다. 이어서 최근 대화를 계속합니다.)`,
        },
      ],
    },
    {
      role: 'model',
      parts: [
        {
          text: '네, 이전 대화 내용을 참고하여 계속 진행하겠습니다.',
        },
      ],
    },
    ...recentMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })),
  ]

  return compressedHistory
}

export async function sendChatMessage(
  conversationHistory: ChatMessage[],
  userMessage: string
): Promise<string> {
  const historyForGemini = compressHistory(conversationHistory)

  const chat = chatModel.startChat({
    history: historyForGemini,
    systemInstruction: {
      role: 'user',
      parts: [{ text: SYSTEM_PROMPT }],
    },
    generationConfig: {
      temperature: 0.7,
      topP: 1,
      topK: 40,
      maxOutputTokens: 800,
    },
  })

  const result = await chat.sendMessage(userMessage)
  return result.response.text()
}

export async function generateConversationSummary(
  conversationHistory: ChatMessage[]
): Promise<string> {
  const conversationText = conversationHistory
    .map((msg) => `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}`)
    .join('\n\n')

  const summaryPrompt = `다음은 스타트업 팀 빌딩을 위한 사용자와의 인터뷰 내용입니다. 이를 바탕으로 사용자의 비전, 목표, 이상적인 팀상에 대한 요약 보고서를 200-300자 내외로 작성해 주십시오.

대화 내용:
${conversationText}

요약 (200-300자, 한국어, 보고서 형식):`

  const result = await chatModel.generateContent(summaryPrompt)
  return result.response.text()
}

export function shouldEndChat(conversationHistory: ChatMessage[]): boolean {
  const userMessages = conversationHistory.filter((msg) => msg.role === 'user')
  return userMessages.length >= 5 && userMessages.length <= 10
}
