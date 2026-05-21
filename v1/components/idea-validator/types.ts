// Idea Validator — Core Types

export type PersonaRole = 'Developer' | 'Designer' | 'VC'

export const DEFAULT_PERSONAS: PersonaRole[] = ['Developer', 'Designer', 'VC']

export const PERSONA_INFO: Record<PersonaRole, { nameKo: string; role: string; color: string; icon: string }> = {
  Developer: { nameKo: '개발자', role: '기술 전문가', color: '#3B82F6', icon: '💻' },
  Designer: { nameKo: '디자이너', role: 'UX/UI 전문가', color: '#8B5CF6', icon: '🎨' },
  VC: { nameKo: '투자자', role: '벤처 캐피탈리스트', color: '#10B981', icon: '💰' },
}

// Scorecard
export const SCORECARD_CATEGORIES = [
  'problemDefinition', 'solution', 'marketAnalysis', 'revenueModel',
  'differentiation', 'logicalConsistency', 'feasibility', 'feedbackReflection',
] as const

export type ScorecardCategory = typeof SCORECARD_CATEGORIES[number]

export const CATEGORY_INFO: Record<ScorecardCategory, { nameKo: string; max: number }> = {
  problemDefinition: { nameKo: '문제 정의', max: 15 },
  solution: { nameKo: '솔루션', max: 15 },
  marketAnalysis: { nameKo: '시장 분석', max: 10 },
  revenueModel: { nameKo: '수익 모델', max: 10 },
  differentiation: { nameKo: '차별화', max: 10 },
  logicalConsistency: { nameKo: '논리 일관성', max: 15 },
  feasibility: { nameKo: '실현 가능성', max: 15 },
  feedbackReflection: { nameKo: '피드백 반영', max: 10 },
}

export interface CategoryScore {
  current: number
  max: number
  filled: boolean
}

export type Scorecard = Record<ScorecardCategory, CategoryScore> & { totalScore: number }

export interface CategoryUpdate {
  category: string
  delta: number
  reason: string
}

// Discussion
export interface DiscussionTurn {
  persona: string
  message: string
  replyTo?: string | null
  tone: 'agree' | 'disagree' | 'question' | 'suggestion' | 'neutral'
}

export interface PersonaResponse {
  role: string
  name: string
  content: string
  tone?: string
  perspectives?: { perspectiveId: string; perspectiveLabel: string; content: string; suggestedActions?: string[] }[]
}

export interface AnalysisMetrics {
  score?: number
  keyRisks: string[]
  keyStrengths: string[]
  summary: string
}

// Chat
export interface ChatMessage {
  id: string
  isUser: boolean
  text?: string
  persona?: string
  personaMessage?: string
  discussion?: DiscussionTurn[]
  responses?: PersonaResponse[]
  metrics?: AnalysisMetrics
  scorecard?: Scorecard
  categoryUpdates?: CategoryUpdate[]
  timestamp: number
  isStreaming?: boolean
  streamPhase?: 'opinion' | 'synthesizing' | 'discussion' | 'final'
}

// SSE Event Types
export type SSEEventType = 'opinion' | 'synthesizing' | 'discussion' | 'final' | 'warning' | 'error'

export interface SSEEvent {
  type: SSEEventType
  data: Record<string, unknown>
}

// Default empty scorecard
export function createEmptyScorecard(): Scorecard {
  const scorecard = { totalScore: 0 } as Scorecard
  for (const cat of SCORECARD_CATEGORIES) {
    scorecard[cat] = { current: 0, max: CATEGORY_INFO[cat].max, filled: false }
  }
  return scorecard
}
