/**
 * Ambient micro-prompt 질문 뱅크.
 *
 * 설계 원칙 (onboarding_progressive_collection.md):
 * - 기존 interactive-questions.ts의 scenario-card를 재활용 (컴포넌트 0 수정)
 * - 세션당 1-2개, 1탭 완료 지향
 * - 응답은 profiles 컬럼(personality, interests 등)에 점진 매핑
 *
 * 앰비언트 전용 메타:
 * - priority: 낮을수록 먼저 노출 (1=가장 기본, 5=심화)
 * - sourceKey: INTERACTIVE_QUESTIONS 키 (렌더할 때 참조)
 * - applyResponse: 응답 → profiles 테이블 업데이트 payload
 */

import { INTERACTIVE_QUESTIONS } from '@/src/lib/onboarding/interactive-questions'
import type { InteractiveQuestion } from '@/src/lib/onboarding/types'

export interface MicroPrompt {
  id: string              // interactive-questions.ts key 또는 독자 key
  sourceKey: string       // INTERACTIVE_QUESTIONS[sourceKey] 로 위젯 설정 로드
  priority: number        // 1-5, 낮을수록 먼저
  prompt: string          // 유저에게 보일 질문 (합쇼체)
  profileField: string    // 저장 대상 profiles 컬럼 (예: 'personality.team_role')
  applyResponse: (responseValue: unknown) => Record<string, unknown>  // profiles 업데이트 payload
}

/**
 * 초기 질문 셋 — 재활용 중심.
 * Phase 1-b에선 scenario-card 2종부터. 2-b 이후 this-or-that/emoji-grid 확장.
 */
export const MICRO_PROMPTS: MicroPrompt[] = [
  {
    id: 'scenario_collaboration',
    sourceKey: 'scenario_collaboration',
    priority: 1,
    prompt: '팀 작업 중 문제가 생겼을 때 어떤 편이세요?',
    profileField: 'personality.collaboration_style',
    applyResponse: (value) => {
      // scenario-card 응답: ScenarioOption 객체 (id 포함)
      const optionId = typeof value === 'object' && value !== null && 'id' in value
        ? (value as { id: string }).id
        : String(value)
      // collaboration_style → personality.communication 점수 반영 (solo=1, organize=3, share=5)
      const score = optionId === 'share' ? 5 : optionId === 'organize' ? 3 : 1
      return {
        personality_patch: { communication: score, collaboration_style: optionId },
      }
    },
  },
  {
    id: 'scenario_decision',
    sourceKey: 'scenario_decision',
    priority: 2,
    prompt: '결정을 내릴 때 어떤 스타일이세요?',
    profileField: 'personality.decision_style',
    applyResponse: (value) => {
      const optionId = typeof value === 'object' && value !== null && 'id' in value
        ? (value as { id: string }).id
        : String(value)
      const score = optionId === 'fast' ? 5 : optionId === 'consult' ? 3 : 1
      return {
        personality_patch: { risk: score, decision_style: optionId },
      }
    },
  },
]

/** sourceKey로 INTERACTIVE_QUESTIONS 위젯 설정 조회 */
export function getQuestionConfig(sourceKey: string): InteractiveQuestion | null {
  return (INTERACTIVE_QUESTIONS as Record<string, InteractiveQuestion>)[sourceKey] ?? null
}

/** 아직 응답하지 않은 질문 중 가장 priority 낮은 것 선택 */
export function pickNextPrompt(answeredIds: Set<string>): MicroPrompt | null {
  const remaining = MICRO_PROMPTS.filter(q => !answeredIds.has(q.id))
  if (remaining.length === 0) return null
  remaining.sort((a, b) => a.priority - b.priority)
  return remaining[0]
}

/** 쿨다운 계산: 스킵/거부 액션별 다음 가능 시각 반환 */
export function computeCooldown(
  action: 'answered' | 'skipped' | 'dismissed',
  consecutiveSkips: number,
): { nextAvailableAt: Date; resetConsecutive: boolean } {
  const now = Date.now()
  if (action === 'answered') {
    // 답하면 24h 쿨다운 + 연속 카운트 리셋
    return {
      nextAvailableAt: new Date(now + 24 * 60 * 60 * 1000),
      resetConsecutive: true,
    }
  }
  // skip/dismiss: 누적에 따라 지수적 증가
  const newConsecutive = consecutiveSkips + 1
  const hours = action === 'dismissed' ? 24 : 6  // dismiss는 강한 거부
  const multiplier = newConsecutive >= 3 ? 7 * 24 / hours : 1  // 3회+ → 7일
  const nextMs = hours * multiplier * 60 * 60 * 1000
  return {
    nextAvailableAt: new Date(now + nextMs),
    resetConsecutive: false,
  }
}
