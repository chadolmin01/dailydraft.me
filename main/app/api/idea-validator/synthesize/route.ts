import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { checkAIRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
})

const SynthesisSchema = z.object({
  summary: z.string().describe('1-2문장 핵심 요약'),
  strengths: z.array(z.string()).describe('강점 3개'),
  risks: z.array(z.string()).describe('리스크 3개'),
  nextSteps: z.array(z.string()).describe('다음 단계 3개'),
  oneLiner: z.string().describe('한 줄 엘리베이터 피치'),
  targetCustomer: z.string().describe('핵심 타겟 고객'),
})

export const POST = withErrorCapture(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return ApiResponse.unauthorized('로그인이 필요합니다')
  }

  const rateLimitRes = await checkAIRateLimit(user.id, getClientIp(request))
  if (rateLimitRes) return rateLimitRes

  const { originalIdea, conversationHistory, scorecard } = await request.json()

  if (!originalIdea) {
    return ApiResponse.badRequest('아이디어가 필요합니다')
  }

  const historyText = Array.isArray(conversationHistory)
    ? conversationHistory.slice(0, 30).join('\n')
    : ''

  const scorecardText = scorecard
    ? Object.entries(scorecard)
        .filter(([k]) => k !== 'totalScore')
        .map(([k, v]) => `${k}: ${(v as { current: number }).current}`)
        .join(', ')
    : '없음'

  const prompt = `<task>
아래 아이디어 검증 결과를 바탕으로 사업계획서 핵심 요약을 생성하세요.
</task>

<idea>${originalIdea}</idea>

<conversation_summary>
${historyText}
</conversation_summary>

<scorecard>${scorecardText} (총점: ${scorecard?.totalScore || 0}/100)</scorecard>`

  const { object: parsed } = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: SynthesisSchema,
    prompt,
    temperature: 0.5,
  })

  return new Response(JSON.stringify({ success: true, data: parsed }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
