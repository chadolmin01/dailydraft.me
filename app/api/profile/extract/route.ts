import { createClient } from '@/src/lib/supabase/server'
import { chatModel } from '@/src/lib/ai/gemini-client'
import { logError } from '@/src/lib/error-logging'
import type { ExtractedProfile } from '@/src/types/extracted-profile'
import type { Json } from '@/src/types/database'
import { ApiResponse } from '@/src/lib/api-utils'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const EXTRACTION_PROMPT = `당신은 대화 내용에서 사용자의 프로필 정보를 추출하는 전문가입니다.

다음 대화 기록을 분석하여 사용자의 프로필을 JSON 형식으로 추출해주세요.

## 추출 규칙
1. 사용자가 명시적으로 언급한 내용만 추출합니다.
2. 추론하거나 가정하지 마세요.
3. 확실하지 않은 정보는 null로 표시하세요.
4. 한국어로 작성하세요.

## 출력 형식 (JSON)
{
  "role": "직무 (기획자, 개발자, 디자이너 등)",
  "experience_level": "경험 수준 (초보, 1-2년 경험, 3년 이상 등)",
  "preferred_market": "선호 시장 (B2B, B2C, B2B2C 중 하나 또는 null)",
  "decision_style": "의사결정 스타일 (데이터 중심, 고객 중심, 직관형 등)",
  "skills": ["보유 기술 배열"],
  "tools": ["사용 도구 배열"],
  "personality_tags": ["성격 태그 배열 (실행형, 분석형, 창의형 등)"],
  "collaboration_preference": "협업 선호도 (수평적, 명확한 역할 분담 등)"
}

## 대화 내용
`

// Redis 기반 Rate limit: 하루 10회
const extractionRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '24 h'),
  prefix: 'ratelimit:extraction',
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    // 동의 여부 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('data_consent')
      .eq('user_id', user.id)
      .single()

    if (!profile?.data_consent) {
      return ApiResponse.forbidden('맞춤형 추천 동의가 필요합니다.')
    }

    // Redis rate limit 확인
    try {
      const { success } = await extractionRatelimit.limit(`user:${user.id}`)
      if (!success) {
        return ApiResponse.rateLimited('일일 추출 한도(10회)를 초과했습니다.')
      }
    } catch {
      // Redis 실패 시 요청 허용 (graceful degradation)
    }

    const { conversationHistory } = await request.json()

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return ApiResponse.badRequest('conversationHistory 필드가 필요합니다.')
    }

    // 최소 메시지 수 확인
    const userMessages = conversationHistory.filter(
      (msg: { role: string }) => msg.role === 'user'
    )
    if (userMessages.length < 3) {
      return ApiResponse.badRequest('프로필 추출에 최소 3개 이상의 메시지가 필요합니다.')
    }

    // 대화 내용 포맷팅
    const conversationText = conversationHistory
      .map(
        (msg: { role: string; content: string }) =>
          `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}`
      )
      .join('\n\n')

    // Gemini로 프로필 추출
    const result = await chatModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: EXTRACTION_PROMPT + conversationText }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 1000,
        responseMimeType: 'application/json',
      },
    })

    const responseText = result.response.text()
    let extractedData: Partial<ExtractedProfile>

    try {
      extractedData = JSON.parse(responseText)
    } catch {
      return ApiResponse.internalError()
    }

    // 신뢰도 계산 (채워진 필드 비율)
    const fields = [
      'role',
      'experience_level',
      'preferred_market',
      'decision_style',
      'collaboration_preference',
    ]
    const arrayFields = ['skills', 'tools', 'personality_tags']

    let filledCount = 0
    let totalWeight = 0

    for (const field of fields) {
      totalWeight += 1
      if (extractedData[field as keyof ExtractedProfile]) {
        filledCount += 1
      }
    }

    for (const field of arrayFields) {
      totalWeight += 1
      const arr = extractedData[field as keyof ExtractedProfile] as
        | string[]
        | undefined
      if (arr && Array.isArray(arr) && arr.length > 0) {
        filledCount += 1
      }
    }

    const confidence = Math.round((filledCount / totalWeight) * 100)

    // 완성된 프로필 객체
    const extractedProfile: ExtractedProfile = {
      role: extractedData.role || '',
      experience_level: extractedData.experience_level || null,
      preferred_market: extractedData.preferred_market || null,
      decision_style: extractedData.decision_style || null,
      skills: Array.isArray(extractedData.skills) ? extractedData.skills : [],
      tools: Array.isArray(extractedData.tools) ? extractedData.tools : [],
      personality_tags: Array.isArray(extractedData.personality_tags)
        ? extractedData.personality_tags
        : [],
      collaboration_preference:
        extractedData.collaboration_preference || null,
      extraction_version: '1.0',
      extracted_at: new Date().toISOString(),
    }

    // DB 업데이트
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        extracted_profile: extractedProfile as unknown as Json,
        extraction_confidence: confidence,
        last_extraction_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Profile extract update error:', updateError.message)
      return ApiResponse.internalError()
    }

    return ApiResponse.ok({
      success: true,
      profile: extractedProfile,
      confidence,
    })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    await logError({
      level: 'error',
      source: 'api',
      errorCode: err.name,
      message: err.message,
      stackTrace: err.stack,
      endpoint: '/api/profile/extract',
      method: 'POST',
    })
    return ApiResponse.internalError()
  }
}
