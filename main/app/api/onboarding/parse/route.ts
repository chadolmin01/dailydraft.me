import { chatModel } from '@/src/lib/ai/gemini-client'
import { createClient } from '@/src/lib/supabase/server'
import { checkAIRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'
import { ApiResponse } from '@/src/lib/api-utils'
import { safeGenerate } from '@/src/lib/ai/safe-generate'
import { OnboardingParseSchema } from '@/src/lib/ai/schemas'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return ApiResponse.unauthorized()
    }

    const rateLimitResponse = await checkAIRateLimit(user.id, getClientIp(request))
    if (rateLimitResponse) return rateLimitResponse

    const { text, type } = await request.json()

    if (!text || typeof text !== 'string' || !['skills', 'interests'].includes(type)) {
      return ApiResponse.badRequest('Invalid input')
    }

    const trimmed = text.trim().slice(0, 500) // limit input

    const prompt = type === 'skills'
      ? `사용자가 자신의 기술 스택을 자유롭게 설명했습니다. 여기서 기술/도구/스킬을 추출해주세요.

사용자 입력: "${trimmed}"

규칙:
- 프로그래밍 언어, 프레임워크, 도구, 플랫폼, 방법론 등 모두 포함
- "바이브코딩", "커서", "클로드 코드" 같은 AI 도구도 기술로 인정
- 정식 영문 명칭으로 변환 (예: "리액트" → "React", "파이썬" → "Python")
- 한국어 그대로가 자연스러운 건 한국어 유지 (예: "바이브코딩" → "Vibe Coding")
- 중복 제거
- JSON 배열만 반환, 다른 텍스트 없이

예시: ["React", "Python", "Figma", "Vibe Coding"]`
      : `사용자가 관심 분야를 자유롭게 설명했습니다. 관심 분야/산업/주제를 추출해주세요.

사용자 입력: "${trimmed}"

규칙:
- 기존 카테고리에 매칭되면 해당 이름 사용: AI/ML, Web, Mobile, HealthTech, EdTech, Fintech, Social, E-commerce, IoT, Game, Blockchain, DevTools
- 기존 카테고리에 없는 새로운 관심 분야도 자유롭게 추가 가능
- 간결하고 명확한 태그로 정리 (예: "Sustainability", "음악", "로봇공학", "우주산업")
- 너무 넓은 개념은 구체화 (예: "기술" → 제외, "AI 스타트업" → "AI/ML")
- 중복 제거, 최대 8개
- JSON 배열만 반환, 다른 텍스트 없이

예시: ["AI/ML", "Sustainability", "Game", "로봇공학"]`

    let items: string[] = []
    try {
      const result = await safeGenerate({
        model: chatModel, prompt,
        schema: OnboardingParseSchema,
        extractJson: 'array',
      })
      items = result.data
    } catch {
      // AI 파싱 실패 시 빈 배열 반환
    }
    const clean = items.filter(v => typeof v === 'string' && v.length < 50).slice(0, 20)

    return ApiResponse.ok({ items: clean })
  } catch (error) {
    console.error('Parse error:', error)
    return ApiResponse.internalError('스킬/관심분야 파싱 중 오류가 발생했습니다')
  }
}
