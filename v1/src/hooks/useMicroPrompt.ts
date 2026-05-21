'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * `useMicroPrompt` — Ambient 1문항 위젯을 끼워 넣는 지점에서 사용.
 *
 * 동작:
 *   1. 마운트 시 `/api/onboarding/micro-prompts` 로 유저가 이미 답한 질문·최근 응답 수 조회
 *   2. `shouldShow(questionId)` — 이미 답했거나 최근 24h 내 응답 수가 쿨다운 한도 초과면 false
 *   3. `submit(questionId, response, slot?)` — 응답 저장 (upsert, 실패 조용히 무시)
 *
 * 실패·비로그인·마이그레이션 미적용 등은 모두 "위젯 안 보이게" 처리 → UX 영향 0.
 */

interface MicroPromptState {
  answered: Set<string>
  recentCount: number
  /** 질문별 실제 응답 값 — 인터뷰 페이지 등에서 재사용 */
  responses: Record<string, unknown>
  loaded: boolean
}

const MAX_RECENT_PER_DAY = 2 // 하루 최대 2개 micro-prompt 로 제한 (과도 수집 방지)

export function useMicroPrompt() {
  const [state, setState] = useState<MicroPromptState>({
    answered: new Set(),
    recentCount: 0,
    responses: {},
    loaded: false,
  })

  useEffect(() => {
    let cancelled = false
    fetch('/api/onboarding/micro-prompts', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled || !data) return
        const payload = data.data ?? data
        setState({
          answered: new Set<string>(payload.answered ?? []),
          recentCount: payload.recentCount ?? 0,
          responses: (payload.responses as Record<string, unknown>) ?? {},
          loaded: true,
        })
      })
      .catch(() => {
        if (!cancelled) setState(s => ({ ...s, loaded: true }))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const shouldShow = useCallback(
    (questionId: string) => {
      if (!state.loaded) return false
      if (state.answered.has(questionId)) return false
      if (state.recentCount >= MAX_RECENT_PER_DAY) return false
      return true
    },
    [state],
  )

  const submit = useCallback(
    async (questionId: string, response: unknown, slot?: string) => {
      try {
        const res = await fetch('/api/onboarding/micro-prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId, response, slot }),
        })
        if (res.ok) {
          setState(s => ({
            ...s,
            answered: new Set([...s.answered, questionId]),
            recentCount: s.recentCount + 1,
            responses: { ...s.responses, [questionId]: response },
          }))
        }
      } catch {
        // 네트워크 실패 조용히 무시 — ambient 위젯은 실패해도 UI 영향 없어야 함
      }
    },
    [],
  )

  return { shouldShow, submit, state }
}
