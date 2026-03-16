/**
 * AI 이벤트 적합도 분석기
 * 사용자 프로필과 이벤트의 매칭을 AI로 분석하여 적합도, 강점, 개선점, 추천을 제공
 */

import { chatModel } from './gemini-client'
import type { Profile } from '@/src/types/profile'
import type { StartupEvent } from '@/src/types/startup-events'

export interface EventFitAnalysis {
  fitScore: number // 0-100
  strengths: string[] // 강점 (최대 3개)
  gaps: string[] // 부족한 점 (최대 3개)
  recommendations: string[] // 개선 제안 (최대 3개)
  summary: string // 한 줄 요약
}

interface AnalysisInput {
  profile: Profile
  event: StartupEvent
}

/**
 * 프로필과 이벤트 정보를 바탕으로 AI 분석 프롬프트 생성
 */
function buildAnalysisPrompt(input: AnalysisInput): string {
  const { profile, event } = input

  // 프로필 정보 추출
  const profileInfo = {
    skills: profile.skills?.map((s) => `${s.name}(${s.level})`).join(', ') || '없음',
    interests: profile.interest_tags?.join(', ') || '없음',
    desiredPosition: profile.desired_position || '미정',
    situation: profile.current_situation || '미정',
    vision: profile.vision_summary || '없음',
    location: profile.location || '미정',
    university: profile.university || '미정',
    major: profile.major || '미정',
  }

  // 이벤트 정보 추출
  const eventInfo = {
    title: event.title,
    organizer: event.organizer,
    type: event.event_type,
    description: event.description || '설명 없음',
    targetAudience: event.target_audience || '제한 없음',
    interestTags: event.interest_tags?.join(', ') || '없음',
    deadline: event.registration_end_date,
  }

  return `당신은 스타트업 지원사업 전문 컨설턴트입니다. 사용자의 프로필과 지원사업 정보를 분석하여 적합도를 평가해주세요.

## 사용자 프로필
- 스킬: ${profileInfo.skills}
- 관심 분야: ${profileInfo.interests}
- 희망 포지션: ${profileInfo.desiredPosition}
- 현재 상황: ${profileInfo.situation}
- 비전/목표: ${profileInfo.vision}
- 위치: ${profileInfo.location}
- 학교/전공: ${profileInfo.university} ${profileInfo.major}

## 지원사업 정보
- 제목: ${eventInfo.title}
- 주최: ${eventInfo.organizer}
- 유형: ${eventInfo.type}
- 설명: ${eventInfo.description}
- 지원 대상: ${eventInfo.targetAudience}
- 관련 태그: ${eventInfo.interestTags}
- 마감일: ${eventInfo.deadline}

## 분석 요청
위 정보를 바탕으로 다음 JSON 형식으로 분석 결과를 제공해주세요:

{
  "fitScore": <0-100 사이 정수, 적합도 점수>,
  "strengths": [<강점 3개 이내, 각 30자 이내 문자열>],
  "gaps": [<부족한 점 3개 이내, 각 30자 이내 문자열>],
  "recommendations": [<구체적인 개선 제안 3개 이내, 각 50자 이내 문자열>],
  "summary": "<한 줄 요약, 50자 이내>"
}

분석 시 고려사항:
1. fitScore는 스킬 매칭, 관심 분야 일치, 지원 대상 부합도를 종합하여 산정
2. strengths는 사용자가 이 지원사업에 유리한 점
3. gaps는 지원에 부족할 수 있는 점 (개선 가능한 것 위주)
4. recommendations는 지원 성공률을 높이기 위한 구체적 조언
5. 한국어로 친절하게 작성

JSON만 출력하세요. 다른 텍스트는 포함하지 마세요.`
}

/**
 * AI 응답을 파싱하여 EventFitAnalysis 객체로 변환
 */
function parseAnalysisResponse(response: string): EventFitAnalysis {
  try {
    // JSON 블록 추출 (```json ... ``` 형식 처리)
    let jsonStr = response
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    // 앞뒤 공백 제거 후 파싱
    const parsed = JSON.parse(jsonStr.trim())

    return {
      fitScore: Math.min(100, Math.max(0, Math.round(parsed.fitScore || 50))),
      strengths: (parsed.strengths || []).slice(0, 3),
      gaps: (parsed.gaps || []).slice(0, 3),
      recommendations: (parsed.recommendations || []).slice(0, 3),
      summary: parsed.summary || '분석 결과를 확인해주세요.',
    }
  } catch (error) {
    console.error('Failed to parse AI response:', error, response)
    // 파싱 실패 시 기본값 반환
    return {
      fitScore: 50,
      strengths: ['프로필 정보 분석 중'],
      gaps: ['추가 정보가 필요합니다'],
      recommendations: ['프로필을 더 상세히 작성해보세요'],
      summary: '분석을 완료할 수 없습니다.',
    }
  }
}

/**
 * 사용자 프로필과 이벤트의 적합도를 AI로 분석
 */
export async function analyzeEventFit(
  profile: Profile,
  event: StartupEvent
): Promise<EventFitAnalysis> {
  const prompt = buildAnalysisPrompt({ profile, event })

  try {
    const result = await chatModel.generateContent(prompt)
    const response = result.response.text()

    return parseAnalysisResponse(response)
  } catch (error) {
    console.error('Event fit analysis error:', error)
    throw new Error('이벤트 적합도 분석 중 오류가 발생했습니다.')
  }
}

/**
 * 프로필 완성도에 따른 분석 품질 경고 메시지 생성
 */
export function getProfileCompletenessWarning(profile: Profile): string | null {
  const issues: string[] = []

  if (!profile.skills || profile.skills.length === 0) {
    issues.push('스킬')
  }
  if (!profile.interest_tags || profile.interest_tags.length === 0) {
    issues.push('관심 분야')
  }
  if (!profile.vision_summary) {
    issues.push('비전/목표')
  }
  if (!profile.desired_position) {
    issues.push('희망 포지션')
  }

  if (issues.length === 0) {
    return null
  }

  if (issues.length >= 3) {
    return '프로필 정보가 부족합니다. 더 정확한 분석을 위해 프로필을 완성해주세요.'
  }

  return `${issues.join(', ')} 정보를 추가하면 더 정확한 분석이 가능합니다.`
}

/**
 * 간단한 적합도 점수만 빠르게 계산 (AI 미사용, 규칙 기반)
 * Free 플랜 미리보기용
 */
export function calculateQuickFitScore(
  profile: Profile,
  event: StartupEvent
): { score: number; matchedTags: string[] } {
  let score = 50 // 기본 점수
  const matchedTags: string[] = []

  // 관심 태그 매칭 (최대 +30점)
  if (profile.interest_tags && event.interest_tags) {
    const matched = profile.interest_tags.filter((tag) =>
      event.interest_tags.includes(tag)
    )
    matchedTags.push(...matched)
    score += Math.min(30, matched.length * 10)
  }

  // 스킬 기반 추가 점수 (최대 +20점)
  if (profile.skills && profile.skills.length > 0) {
    // 고급 스킬이 있으면 가점
    const advancedSkills = profile.skills.filter((s) => s.level === '고급')
    score += Math.min(20, advancedSkills.length * 5 + profile.skills.length * 2)
  }

  // AI 채팅 완료 시 가점 (+10점)
  if (profile.ai_chat_completed) {
    score += 10
  }

  return {
    score: Math.min(100, Math.round(score)),
    matchedTags,
  }
}
