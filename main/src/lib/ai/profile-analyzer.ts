import { chatModel } from './gemini-client'
import type { ProfileAnalysisResult } from '@/src/types/profile-analysis'
import { safeGenerate } from './safe-generate'
import { ProfileAnalysisSchema } from './schemas'

interface ProfileInput {
  desired_position: string | null
  skills: Array<{ name: string; level: string }> | null
  interest_tags: string[] | null
  personality: Record<string, number> | null
  vision_summary: string | null
  current_situation: string | null
  major: string | null
  extracted_profile: Record<string, unknown> | null
}

function buildProfileAnalysisPrompt(profile: ProfileInput): string {
  const skills = profile.skills
    ?.map(s => `${s.name} (${s.level})`)
    .join(', ') || '없음'

  const interests = profile.interest_tags?.join(', ') || '없음'

  const personality = profile.personality
    ? Object.entries(profile.personality)
        .map(([k, v]) => `${k}: ${v}/10`)
        .join(', ')
    : '없음'

  const extracted = profile.extracted_profile
    ? `\n- 추출 프로필: ${JSON.stringify(profile.extracted_profile)}`
    : ''

  return `당신은 스타트업 커뮤니티 "Draft"의 프로필 분석 전문가입니다.
사용자의 프로필을 종합 분석하여 어떤 스타트업 분야에 적합한지 평가해주세요.

## 사용자 프로필
- 포지션: ${profile.desired_position || '미설정'}
- 스킬: ${skills}
- 관심 분야: ${interests}
- 성향: ${personality}
- 비전: ${profile.vision_summary || '없음'}
- 현재 상황: ${profile.current_situation || '없음'}
- 전공: ${profile.major || '없음'}${extracted}

## JSON 출력 형식
{
  "scores": {
    "market_fit": <0-100 시장 적합도>,
    "execution_power": <0-100 실행력>,
    "technical_depth": <0-100 기술 역량>,
    "team_synergy": <0-100 팀 시너지>,
    "founder_readiness": <0-100 창업 준비도>
  },
  "recommended_fields": [
    {"name": "분야명", "score": <0-100>, "reason": "30자 이내 이유"},
    {"name": "분야명", "score": <0-100>, "reason": "30자 이내 이유"},
    {"name": "분야명", "score": <0-100>, "reason": "30자 이내 이유"}
  ],
  "strengths": ["강점1", "강점2"],
  "growth_areas": ["성장 영역1", "성장 영역2"],
  "founder_type": "Blitz Builder | Market Sniper | Tech Pioneer | Community Builder 중 하나",
  "one_liner": "이 사용자를 한 줄로 설명"
}

## 파운더 유형
- "Blitz Builder": 빠른 실행과 MVP 구축에 강한 타입
- "Market Sniper": 시장 분석과 정확한 타겟팅에 강한 타입
- "Tech Pioneer": 기술적 차별화와 혁신에 강한 타입
- "Community Builder": 커뮤니티와 네트워크 구축에 강한 타입

## 규칙
- recommended_fields는 정확히 3개
- strengths는 2-3개
- growth_areas는 2-3개
- 모든 텍스트는 한국어
- JSON만 출력하세요. 다른 텍스트는 포함하지 마세요.`
}

export async function analyzeProfile(profile: ProfileInput): Promise<ProfileAnalysisResult> {
  const prompt = buildProfileAnalysisPrompt(profile)

  try {
    const { data } = await safeGenerate({
      model: chatModel,
      prompt: {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          topP: 0.9,
          maxOutputTokens: 1500,
          responseMimeType: 'application/json',
        },
      },
      schema: ProfileAnalysisSchema,
    })
    return data as ProfileAnalysisResult
  } catch (error) {
    console.error('Profile analysis error:', error)
    throw new Error('프로필 분석 중 오류가 발생했습니다.')
  }
}
