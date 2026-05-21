/**
 * Session Analytics Tracker
 * 익명화된 세션 데이터를 수집하여 proprietary data flywheel 구축
 */

import { createClient } from '@/src/lib/supabase/client'

// 세션 데이터 타입
export interface SessionData {
  sessionId: string
  level: 'SKETCH' | 'MVP' | 'DEFENSE'
  ideaText: string
  turns: TurnData[]
  fromStartupIdea?: boolean
  startupSource?: string
}

export interface TurnData {
  turn: number
  scores?: {
    score?: number
    vcScore?: number
    developerScore?: number
    designerScore?: number
  }
  adviceShown: number
  adviceReflected: number
  reflectedCategories: string[]
  personaEngagement: Record<string, number>
}

// 카테고리 키워드 매핑
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '앱': ['앱', 'app', '모바일', 'mobile', 'ios', 'android'],
  '웹': ['웹', 'web', '사이트', 'site', '플랫폼'],
  '교육': ['교육', '학습', '강의', '튜터', '스터디', '학원', '온라인 강의'],
  'B2C': ['소비자', '일반인', '개인', '사용자', 'b2c', '고객'],
  'B2B': ['기업', '회사', 'b2b', '비즈니스', '솔루션', 'saas'],
  'AI': ['ai', '인공지능', 'gpt', '머신러닝', 'ml', '딥러닝', 'llm', '챗봇'],
  '커머스': ['쇼핑', '판매', '이커머스', '마켓', '스토어', '결제'],
  '헬스케어': ['건강', '의료', '헬스', '운동', '피트니스', '병원'],
  '핀테크': ['금융', '결제', '투자', '은행', '핀테크', '가상화폐', '송금'],
  '소셜': ['소셜', 'sns', '커뮤니티', '네트워크', '채팅', '메신저'],
  '콘텐츠': ['콘텐츠', '미디어', '영상', '음악', '웹툰', '뉴스'],
  '생산성': ['생산성', '협업', '노션', '업무', '프로젝트', '일정'],
}

/**
 * 아이디어 텍스트에서 카테고리 추출 (원문 저장 안함)
 */
function extractCategories(text: string): string[] {
  const categories: string[] = []
  const lowerText = text.toLowerCase()

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
      categories.push(category)
    }
  }

  return categories.length > 0 ? categories : ['기타']
}

/**
 * 세션 해시 생성 (충돌 방지를 위해 entropy 높임)
 */
function generateSessionHash(sessionId: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const input = `${sessionId}-${timestamp}-${random}`

  // 간단한 해시 (crypto.subtle 사용 가능하면 더 강력한 해시 사용)
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32bit integer 변환
  }

  return `ses_${Math.abs(hash).toString(36)}_${random}`
}

/**
 * 세션 종료 시 데이터 전송 (완료 또는 이탈)
 */
export async function trackSessionEnd(
  data: SessionData,
  completed: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // 비로그인 사용자는 추적하지 않음 (RLS 정책)
      return { success: false, error: 'Not authenticated' }
    }

    // 카테고리 추출 (원문 저장 안함)
    const categories = extractCategories(data.ideaText)

    // 점수 히스토리 구성
    const scoreHistory = data.turns
      .filter(t => t.scores)
      .map(t => ({
        turn: t.turn,
        scores: t.scores
      }))

    // 최종 점수
    const lastTurnWithScore = [...data.turns].reverse().find(t => t.scores)
    const finalScore = lastTurnWithScore?.scores || null

    // 반영된 카테고리 집계
    const allReflectedCategories = [...new Set(
      data.turns.flatMap(t => t.reflectedCategories)
    )]

    // 조언 통계
    const totalAdviceShown = data.turns.reduce((sum, t) => sum + t.adviceShown, 0)
    const totalAdviceReflected = data.turns.reduce((sum, t) => sum + t.adviceReflected, 0)

    // 페르소나 참여도 집계
    const personaEngagement: Record<string, number> = {}
    for (const turn of data.turns) {
      for (const [persona, count] of Object.entries(turn.personaEngagement)) {
        personaEngagement[persona] = (personaEngagement[persona] || 0) + count
      }
    }

    // DB 삽입
    const { error } = await (supabase as any).from('session_analytics').insert({
      session_hash: generateSessionHash(data.sessionId),
      validation_level: data.level,
      total_turns: data.turns.length,
      completed,
      dropped_at_turn: completed ? null : data.turns.length,
      idea_category: categories,
      idea_word_count: data.ideaText.trim().split(/\s+/).length,
      score_history: scoreHistory,
      final_score: finalScore,
      advice_shown: totalAdviceShown,
      advice_reflected: totalAdviceReflected,
      reflected_categories: allReflectedCategories,
      persona_engagement: personaEngagement,
      from_startup_idea: data.fromStartupIdea || false,
      startup_source: data.startupSource || null
    })

    if (error) {
      console.error('[SessionTracker] Insert error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[SessionTracker] Unexpected error:', err)
    return { success: false, error: String(err) }
  }
}

/**
 * 세션 추적 훅을 위한 유틸리티
 */
export function createSessionTracker(initialData: Omit<SessionData, 'turns'>) {
  const turns: TurnData[] = []

  return {
    addTurn(turnData: TurnData) {
      turns.push(turnData)
    },

    async complete() {
      return trackSessionEnd({ ...initialData, turns }, true)
    },

    async abandon() {
      return trackSessionEnd({ ...initialData, turns }, false)
    },

    getTurns() {
      return [...turns]
    }
  }
}
