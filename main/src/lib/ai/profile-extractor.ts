import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { chatModel } from './gemini-client'
import type { ChatMessage } from '@/src/types/profile'
import type { ExtractedProfile } from '@/src/types/extracted-profile'

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

/**
 * 백그라운드에서 프로필 추출 실행 (서버사이드)
 * AI 채팅 중 비동기로 호출됨
 */
export async function triggerProfileExtraction(
  userId: string,
  conversationHistory: ChatMessage[]
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient()

    // 동의 여부 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('data_consent')
      .eq('user_id', userId)
      .single()

    if (!profile?.data_consent) {
      return // 동의하지 않은 경우 추출하지 않음
    }

    // 최소 메시지 수 확인
    const userMessages = conversationHistory.filter((msg) => msg.role === 'user')
    if (userMessages.length < 3) {
      return
    }

    // 대화 내용 포맷팅
    const conversationText = conversationHistory
      .map((msg) => `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}`)
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
      console.error('Failed to parse AI response for profile extraction')
      return
    }

    // 신뢰도 계산
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
      collaboration_preference: extractedData.collaboration_preference || null,
      extraction_version: '1.0',
      extracted_at: new Date().toISOString(),
    }

    // DB 업데이트
    await supabase
      .from('profiles')
      .update({
        extracted_profile: extractedProfile,
        extraction_confidence: confidence,
        last_extraction_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  } catch (error) {
    console.error('Profile extraction failed:', error)
  }
}
