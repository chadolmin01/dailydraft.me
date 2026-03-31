import { chatModel } from '@/src/lib/ai/gemini-client'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { checkAIRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'
import { safeGenerate } from '@/src/lib/ai/safe-generate'
import { OnboardingSummarySchema } from '@/src/lib/ai/schemas'

interface TranscriptMessage {
  role: 'user' | 'assistant'
  content: string
}

const SUMMARIZE_PROMPT = `아래는 Draft 플랫폼 온보딩에서 AI와 사용자가 나눈 대화입니다.
이 대화를 분석해서 팀 매칭에 활용할 수 있는 구조화된 프로필 데이터를 추출하세요.

## 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력.

{
  "personality": {
    "risk": <1-10, 위험 감수 성향. 도전적=높음, 안정적=낮음>,
    "time": <1-10, 시간 투자 가능량. 풀타임=10, 여유 없음=1>,
    "communication": <1-10, 소통 선호도. 수시 소통=10, 혼자 집중=1>,
    "decision": <1-10, 의사결정 스타일. 빠른 실행=10, 신중한 계획=1>
  },
  "work_style": {
    "collaboration": <1-10, 협업 vs 독립. 팀 소통형=10, 혼자 집중=1>,
    "planning": <1-10, 기획 우선 vs 실행 우선. 기획부터=10, 바로 개발=1>,
    "perfectionism": <1-10, 완벽주의 vs 속도. 완벽주의=10, 속도 우선=1>
  },
  "availability": {
    "hours_per_week": <숫자, 주당 투자 가능 시간. 모르면 null>,
    "prefer_online": <boolean, 비대면 선호 여부>,
    "semester_available": <boolean, 학기 중에도 가능한지>
  },
  "team_preference": {
    "role": <"리더" | "팔로워" | "유연" 중 하나>,
    "preferred_size": <"2-3명" | "4-5명" | "6명+" | null>,
    "atmosphere": <"실무형" | "캐주얼" | "균형" 중 하나>
  },
  "goals": [<문자열 배열, 예: "포트폴리오", "창업", "학습", "수상">],
  "strengths": [<문자열 배열, 자신이 잘하는 것>],
  "wants_from_team": [<문자열 배열, 팀원에게 기대하는 역량>],
  "project_interests": [<문자열 배열, 만들고 싶은 것이나 관심 프로젝트>],
  "summary": "<2-3문장으로 이 사용자의 팀 매칭 포인트 요약>"
}

## 규칙
- 대화에서 언급되지 않은 항목은 중간값(5) 또는 null 사용
- 배열은 대화에서 추출 가능한 것만 포함, 빈 배열 가능
- summary는 팀 매칭 시 다른 사용자에게 보여줄 수 있는 간결한 소개
- 반드시 유효한 JSON만 출력`

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const rateLimitResponse = await checkAIRateLimit(user.id, getClientIp(request))
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const { transcript } = body as { transcript: TranscriptMessage[] }

    if (!Array.isArray(transcript) || transcript.length === 0) {
      return ApiResponse.badRequest('No transcript provided')
    }

    // C9: Limit transcript size to prevent abuse
    const MAX_TRANSCRIPT_MESSAGES = 40
    const MAX_MSG_CONTENT_LENGTH = 3000
    const trimmedTranscript = transcript.slice(0, MAX_TRANSCRIPT_MESSAGES).map(m => ({
      ...m,
      content: typeof m.content === 'string' ? m.content.slice(0, MAX_MSG_CONTENT_LENGTH) : '',
    }))

    // Format conversation for analysis
    const conversationText = trimmedTranscript
      .map(m => `${m.role === 'user' ? '사용자' : 'AI'}: ${m.content}`)
      .join('\n\n')

    const prompt = `${SUMMARIZE_PROMPT}\n\n## 대화 내용\n\n${conversationText}`

    const { data: parsed } = await safeGenerate({
      model: chatModel,
      prompt,
      schema: OnboardingSummarySchema,
      extractJson: 'object',
    })

    // Save to DB: personality + vision_summary (스키마가 클램핑 완료)
    const updateData: Record<string, unknown> = {
      ai_chat_completed: true,
    }

    if (parsed.personality) {
      updateData.personality = parsed.personality
    }

    if (parsed.summary || parsed.work_style) {
      updateData.vision_summary = JSON.stringify({
        work_style: parsed.work_style || null,
        availability: parsed.availability || null,
        team_preference: parsed.team_preference || null,
        goals: parsed.goals || [],
        strengths: parsed.strengths || [],
        wants_from_team: parsed.wants_from_team || [],
        project_interests: parsed.project_interests || [],
        summary: parsed.summary || '',
      })
    }

    await supabase.from('profiles')
      .update(updateData)
      .eq('user_id', user.id)

    return ApiResponse.ok({ profile: parsed })
  } catch (error) {
    console.error('Summarize error:', error)
    return ApiResponse.internalError('프로필 요약 중 오류가 발생했습니다')
  }
}

