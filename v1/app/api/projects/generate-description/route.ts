import { createClient } from '@/src/lib/supabase/server'
import { chatModel } from '@/src/lib/ai/gemini-client'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { checkAIRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'

export const POST = withErrorCapture(async (request) => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return ApiResponse.unauthorized()
    }

    // Rate limit — AI 설명 생성 비용 보호
    const rateLimitResponse = await checkAIRateLimit(user.id, getClientIp(request))
    if (rateLimitResponse) return rateLimitResponse

    const { title, type, painPoint, roles, locationType, timeCommitment, compensationType } = await request.json()

    if (!title?.trim()) {
      return ApiResponse.badRequest('프로젝트 이름을 입력해주세요')
    }

    const typeLabel: Record<string, string> = {
      side_project: '함께 만들기',
      startup: '창업 준비',
      study: '함께 배우기',
    }

    const locationLabel: Record<string, string> = {
      remote: '원격',
      hybrid: '하이브리드',
      onsite: '오프라인',
    }

    const timeLabel: Record<string, string> = {
      part_time: '파트타임 (주 10시간 미만)',
      full_time: '풀타임 (주 10시간 이상)',
    }

    const compLabel: Record<string, string> = {
      unpaid: '무급 (경험 위주)',
      equity: '지분 제공',
      salary: '유급',
      hybrid: '혼합 (지분+급여)',
    }

    const infoLines = [
      `- 이름: ${title.trim()}`,
      `- 유형: ${typeLabel[type] || type || '사이드 프로젝트'}`,
    ]
    if (roles?.length) infoLines.push(`- 필요한 역할: ${roles.join(', ')}`)
    if (locationType) infoLines.push(`- 활동 방식: ${locationLabel[locationType] || locationType}`)
    if (timeCommitment) infoLines.push(`- 시간 투자: ${timeLabel[timeCommitment] || timeCommitment}`)
    if (compensationType) infoLines.push(`- 보상 방식: ${compLabel[compensationType] || compensationType}`)
    if (painPoint?.trim()) infoLines.push(`- 해결하려는 문제: ${painPoint.trim()}`)

    const prompt = `당신은 대학생 스타트업/프로젝트 플랫폼 "Draft"의 AI 어시스턴트입니다.
아래 정보를 바탕으로 팀원 모집용 프로젝트 설명을 작성해주세요.

## 프로젝트 정보
${infoLines.join('\n')}

## 규칙
- 3~5문단, 총 200~400자
- 첫 문단: 프로젝트가 무엇인지 한 줄 요약
- 중간: 어떤 문제를 해결하는지, 주요 기능/방향성
- 마지막: 현재 단계와 함께할 팀원에게 바라는 점 (필요한 역할, 활동 방식, 시간, 보상 정보를 자연스럽게 녹여서)
- 대학생 톤, 자연스럽고 열정적이지만 과하지 않게
- 마크다운 없이 순수 텍스트만
- 설명만 출력하세요. 다른 텍스트는 포함하지 마세요.`

    const result = await chatModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 800,
      },
    })

    const description = result.response.text().trim()

    return ApiResponse.ok({ description })
})
