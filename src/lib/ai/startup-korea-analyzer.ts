/**
 * 해외 스타트업 한국 시장 적합성 심층 분석기
 * Gemini AI를 사용하여 스타트업을 분석하고 한국 시장 진출 가능성을 평가
 */

import { chatModel } from './gemini-client'
import type { StartupIdea, StartupKoreaAnalysis, FounderType } from '../startups/types'

interface AnalysisInput {
  startup: StartupIdea
}

/**
 * 스타트업 분석을 위한 프롬프트 생성
 */
function buildAnalysisPrompt(input: AnalysisInput): string {
  const { startup } = input

  const startupInfo = {
    name: startup.name,
    tagline: startup.tagline || '없음',
    description: startup.description || '없음',
    categories: startup.category?.join(', ') || '없음',
    website: startup.website_url || '없음',
    upvotes: startup.upvotes || 0,
    source: startup.source,
    fundingStage: startup.funding_stage || '미공개',
  }

  return `당신은 해외 스타트업을 한국 시장에 로컬라이징하는 것을 전문으로 하는 스타트업 분석가입니다.
다음 해외 스타트업을 분석하고 한국 시장 적합성을 평가해주세요.

## 스타트업 정보
- 이름: ${startupInfo.name}
- 한 줄 소개: ${startupInfo.tagline}
- 상세 설명: ${startupInfo.description}
- 카테고리: ${startupInfo.categories}
- 웹사이트: ${startupInfo.website}
- 인기도 (upvotes): ${startupInfo.upvotes}
- 출처: ${startupInfo.source}
- 펀딩 단계: ${startupInfo.fundingStage}

## 분석 요청
다음 JSON 형식으로 분석 결과를 제공해주세요:

{
  "korean_summary": "<한국어로 2줄 이내 서비스 요약. 무엇을 하는 서비스인지 명확하게.>",
  "problem": "<이 서비스가 해결하는 핵심 문제. 한국어로 50자 이내.>",
  "business_model": "<추정되는 수익 모델. 예: SaaS 구독, 광고, 마켓플레이스 수수료 등. 50자 이내.>",
  "korea_exists": <true 또는 false - 한국에 유사한 서비스가 이미 존재하는지>,
  "korea_competitors": [<한국의 유사 서비스 이름들. 최대 3개. 없으면 빈 배열.>],
  "korea_fit_score": <0-100 정수. 한국 시장 적합도 점수>,
  "korea_fit_reason": "<적합도 점수의 이유. 한국어로 100자 이내.>",
  "suggested_localization": "<한국 진출 시 필요한 현지화 포인트. 한국어로 100자 이내.>",
  "target_founder_type": [<추천 파운더 유형. 아래 4가지 중 선택. 최대 2개.>],
  "difficulty": "<'easy' | 'medium' | 'hard' - 한국 시장 진출 난이도>",
  "tags": [<관련 태그들. 영어로. 최대 5개.>]
}

## 파운더 유형 설명
- "Blitz Builder": 빠른 MVP 구축과 실행력이 중요한 아이디어
- "Market Sniper": 시장 분석과 타겟팅이 핵심인 아이디어
- "Tech Pioneer": 기술적 차별화가 필요한 아이디어
- "Community Builder": 커뮤니티 구축과 네트워크 효과가 중요한 아이디어

## 점수 기준
- 90-100: 한국에 경쟁자가 없고, 즉시 진출 가능
- 70-89: 경쟁이 있지만 차별화 여지 충분
- 50-69: 경쟁 치열하거나 현지화 난이도 높음
- 30-49: 한국 시장 수요 불확실
- 0-29: 한국 시장 적합하지 않음

JSON만 출력하세요. 다른 텍스트는 포함하지 마세요.`
}

/**
 * AI 응답을 파싱하여 StartupKoreaAnalysis 객체로 변환
 */
function parseAnalysisResponse(response: string): StartupKoreaAnalysis {
  try {
    // JSON 블록 추출 (```json ... ``` 형식 처리)
    let jsonStr = response
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    const parsed = JSON.parse(jsonStr.trim())

    // Founder type 유효성 검사
    const validFounderTypes: FounderType[] = [
      'Blitz Builder',
      'Market Sniper',
      'Tech Pioneer',
      'Community Builder',
    ]
    const targetFounderType = (parsed.target_founder_type || [])
      .filter((t: string) => validFounderTypes.includes(t as FounderType))
      .slice(0, 2) as FounderType[]

    // difficulty 유효성 검사
    const validDifficulties = ['easy', 'medium', 'hard'] as const
    const difficulty = validDifficulties.includes(parsed.difficulty)
      ? parsed.difficulty
      : 'medium'

    return {
      korean_summary: parsed.korean_summary || '분석 결과를 확인해주세요.',
      problem: parsed.problem || '정보 없음',
      business_model: parsed.business_model || '정보 없음',
      korea_exists: Boolean(parsed.korea_exists),
      korea_competitors: (parsed.korea_competitors || []).slice(0, 3),
      korea_fit_score: Math.min(100, Math.max(0, Math.round(parsed.korea_fit_score || 50))),
      korea_fit_reason: parsed.korea_fit_reason || '분석 결과를 확인해주세요.',
      suggested_localization: parsed.suggested_localization || '추가 분석이 필요합니다.',
      target_founder_type: targetFounderType.length > 0
        ? targetFounderType
        : ['Blitz Builder'],
      difficulty,
      tags: (parsed.tags || []).slice(0, 5),
    }
  } catch (error) {
    console.error('Failed to parse startup analysis response:', error, response)
    // 파싱 실패 시 기본값 반환
    return {
      korean_summary: '분석을 완료할 수 없습니다.',
      problem: '정보 없음',
      business_model: '정보 없음',
      korea_exists: false,
      korea_competitors: [],
      korea_fit_score: 50,
      korea_fit_reason: '분석 오류가 발생했습니다.',
      suggested_localization: '수동 분석이 필요합니다.',
      target_founder_type: ['Blitz Builder'],
      difficulty: 'medium',
      tags: [],
    }
  }
}

/**
 * 스타트업의 한국 시장 적합성을 AI로 분석
 */
export async function analyzeStartupKoreaFit(
  startup: StartupIdea
): Promise<StartupKoreaAnalysis> {
  const prompt = buildAnalysisPrompt({ startup })

  try {
    const result = await chatModel.generateContent(prompt)
    const response = result.response.text()

    return parseAnalysisResponse(response)
  } catch (error) {
    console.error('Startup Korea analysis error:', error)
    throw new Error('스타트업 한국 적합도 분석 중 오류가 발생했습니다.')
  }
}

/**
 * 최종 점수 계산 (가중치 기반)
 * 최종 점수 = (korea_fit_score × 0.4) + (upvotes_normalized × 0.3) +
 *             (no_competitor_bonus × 0.2) + (easy_difficulty_bonus × 0.1)
 */
export function calculateFinalScore(
  startup: StartupIdea,
  analysis: StartupKoreaAnalysis
): number {
  // 1. 한국 적합도 점수 (40%)
  const koreaFitComponent = analysis.korea_fit_score * 0.4

  // 2. Upvotes 정규화 (30%) - log10 정규화, 최대 30점
  // upvotes: 0 -> 0, 10 -> 10, 100 -> 20, 1000 -> 30
  const upvotesNormalized = startup.upvotes > 0
    ? Math.min(30, Math.log10(startup.upvotes) * 10)
    : 0
  const upvotesComponent = upvotesNormalized

  // 3. 경쟁자 없음 보너스 (20%)
  const noCompetitorBonus = !analysis.korea_exists ? 20 : 0

  // 4. 난이도 보너스 (10%)
  const difficultyBonus = analysis.difficulty === 'easy'
    ? 10
    : analysis.difficulty === 'medium'
      ? 5
      : 0

  const finalScore = koreaFitComponent + upvotesComponent + noCompetitorBonus + difficultyBonus

  return Math.round(Math.min(100, Math.max(0, finalScore)))
}

/**
 * 배치 분석 (여러 스타트업을 순차 처리)
 * Rate limit 고려: 4초 간격
 */
export async function analyzeStartupBatch(
  startups: StartupIdea[],
  onProgress?: (current: number, total: number, name: string) => void
): Promise<Map<string, { analysis: StartupKoreaAnalysis; finalScore: number }>> {
  const results = new Map<string, { analysis: StartupKoreaAnalysis; finalScore: number }>()

  for (let i = 0; i < startups.length; i++) {
    const startup = startups[i]

    try {
      onProgress?.(i + 1, startups.length, startup.name)

      const analysis = await analyzeStartupKoreaFit(startup)
      const finalScore = calculateFinalScore(startup, analysis)

      results.set(startup.id, { analysis, finalScore })

      // Rate limit: 4초 대기 (마지막 항목 제외)
      if (i < startups.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 4000))
      }
    } catch (error) {
      console.error(`Failed to analyze startup ${startup.name}:`, error)
      // 실패 시 기본값으로 저장
      results.set(startup.id, {
        analysis: {
          korean_summary: '분석 실패',
          problem: '정보 없음',
          business_model: '정보 없음',
          korea_exists: false,
          korea_competitors: [],
          korea_fit_score: 50,
          korea_fit_reason: '분석 중 오류가 발생했습니다.',
          suggested_localization: '수동 분석이 필요합니다.',
          target_founder_type: ['Blitz Builder'],
          difficulty: 'medium',
          tags: [],
        },
        finalScore: 50,
      })
    }
  }

  return results
}
