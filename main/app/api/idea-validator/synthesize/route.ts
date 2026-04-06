import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { genAI } from '@/src/lib/ai/gemini-client'
import { checkAIRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: '로그인이 필요합니다' }), { status: 401 })
    }

    const rateLimitRes = await checkAIRateLimit(user.id, getClientIp(request))
    if (rateLimitRes) return rateLimitRes

    const { originalIdea, conversationHistory, scorecard } = await request.json()

    if (!originalIdea) {
      return new Response(JSON.stringify({ error: '아이디어가 필요합니다' }), { status: 400 })
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

<scorecard>${scorecardText} (총점: ${scorecard?.totalScore || 0}/100)</scorecard>

<output_format>
JSON:
{
  "summary": "1-2문장 핵심 요약",
  "strengths": ["강점 1", "강점 2", "강점 3"],
  "risks": ["리스크 1", "리스크 2", "리스크 3"],
  "nextSteps": ["다음 단계 1", "다음 단계 2", "다음 단계 3"],
  "oneLiner": "한 줄 엘리베이터 피치",
  "targetCustomer": "핵심 타겟 고객"
}
</output_format>`

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { maxOutputTokens: 1500, temperature: 0.5, responseMimeType: 'application/json' },
    })

    const result = await model.generateContent(prompt)
    const parsed = JSON.parse(result.response.text())

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Synthesize Error:', err)
    return new Response(JSON.stringify({ error: '종합 중 오류가 발생했습니다' }), { status: 500 })
  }
}
