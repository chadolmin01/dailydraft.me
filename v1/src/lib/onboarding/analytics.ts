'use client'

import posthog from 'posthog-js'

/**
 * 온보딩 단계별 퍼널 이벤트.
 *
 * 목적: 어느 단계에서 이탈이 많은지, 경로별(invite/matching/operator/exploring)
 * 완주율이 어떻게 다른지를 실시간 관찰. 개선 라운드 근거 데이터.
 *
 * 이벤트 네이밍 컨벤션: `onboarding_<action>_<step>`
 * 예: `onboarding_step_viewed`, `onboarding_step_completed`.
 *
 * 실패는 조용히 무시 — PostHog 다운이 UX 를 깨뜨려선 안 됨.
 */

export type OnboardingEvent =
  | 'onboarding_step_viewed' // 단계 화면 진입
  | 'onboarding_step_completed' // 단계 내 모든 필수 값 입력 + 다음 버튼 클릭
  | 'onboarding_step_skipped' // 상단 "건너뛰기" 링크 사용
  | 'onboarding_step_back' // 이전 화면으로 돌아감
  | 'onboarding_recovery_offered' // 복구 배너가 노출됨
  | 'onboarding_recovery_accepted' // 복구 수락
  | 'onboarding_recovery_declined' // 복구 거절 (새로 시작)
  | 'onboarding_source_chosen' // source 선택 (invite/matching/operator/exploring)
  | 'onboarding_error' // 저장·네트워크 에러 발생
  | 'onboarding_interview_started' // /onboarding/interview 진입
  | 'onboarding_interview_completed' // 7문항 완료
  | 'onboarding_interview_skipped' // "지금은 건너뛰기" 사용

export interface OnboardingEventProps {
  step?: string
  source?: string | null
  value?: string | number | boolean | null
  errorKind?: string
  durationMs?: number
}

export function trackOnboardingEvent(
  event: OnboardingEvent,
  props: OnboardingEventProps = {},
): void {
  if (typeof window === 'undefined') return
  try {
    posthog.capture(event, {
      ...props,
      timestamp: new Date().toISOString(),
    })
  } catch {
    // ignore
  }
}

/**
 * 단계 체류 시간 측정기. `begin()` 호출 시점부터 `end()` 까지 ms.
 *
 * 사용:
 *   const timer = createStepTimer()
 *   timer.begin('info')
 *   // ... 단계 완료 시
 *   timer.end('info') // → trackOnboardingEvent 에 durationMs 포함해서 전달
 */
export function createStepTimer() {
  let startedStep: string | null = null
  let startedAt = 0
  return {
    begin(step: string) {
      startedStep = step
      startedAt = performance.now()
    },
    end(step: string): number | null {
      if (startedStep !== step || !startedAt) return null
      const ms = Math.round(performance.now() - startedAt)
      startedStep = null
      startedAt = 0
      return ms
    },
  }
}
