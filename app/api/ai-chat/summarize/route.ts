import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { chatModel } from '@/src/lib/ai/gemini-client'
import { checkAIRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'
import { ApiResponse } from '@/src/lib/api-utils'

const SUMMARY_PROMPT = `스타트업 팀 빌딩 인터뷰 내용을 전문적인 프로필 요약으로 작성해주세요.

작성 규칙:
1. 3인칭 경어체 사용 ("~하고 계십니다", "~보유하고 계십니다")
2. 비즈니스 문서 톤 유지
3. 80자 내외로 간결하게
4. 사용자 발언만 요약 (AI 질문 제외)
5. 내용이 부족하면 있는 내용만 요약

형식:
"[서비스/아이디어]를 구상하고 계십니다. [핵심 특징]을 통해 [가치/차별점]을 제공하고자 합니다."

대화:
`

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const rateLimitResponse = await checkAIRateLimit(user.id, getClientIp(request))
    if (rateLimitResponse) return rateLimitResponse

    const { messages } = await request.json()

    if (!messages || messages.length < 2) {
      return NextResponse.json({ summary: '' })
    }

    // Extract only user messages
    const userMessages = messages
      .filter((m: { role: string; content: string }) => m.role === 'user')
      .map((m: { role: string; content: string }) => m.content)
      .join('\n')

    if (!userMessages.trim()) {
      return NextResponse.json({ summary: '' })
    }

    const result = await chatModel.generateContent(SUMMARY_PROMPT + userMessages)
    const summary = result.response.text().trim()

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Summarize error:', error)
    return ApiResponse.internalError()
  }
}
