'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { ScenarioCard } from '@/components/onboarding/interactive/ScenarioCard'
import type {
  InteractiveQuestion,
  ScenarioCardQuestion,
  ScenarioOption,
} from '@/src/lib/onboarding/types'

/**
 * Ambient micro-prompt slot.
 *
 * 로딩 스켈레톤 위/사이드 카드에 붙이는 "게임형" 1문항 UI.
 * (onboarding_progressive_collection.md Phase 1-b)
 *
 * 제약:
 * - 인증 유저에게만 (서버 응답이 알아서 null 주면 자동 숨김)
 * - next_available_at 쿨다운 중엔 서버가 null 반환 → 슬롯 안 렌더
 * - 답하거나 스킵/X 누르면 즉시 숨김 (다음 로딩 때까지 쉼)
 * - 페이지 로딩 끝나면 슬롯 같이 사라짐 (Suspense fallback에 렌더되므로 자연스러움)
 *
 * 실패해도 앱 동작에 영향 없음 (silent fail).
 */

interface FetchedPrompt {
  id: string
  sourceKey: string
  prompt: string
  config: InteractiveQuestion
}

type SlotState =
  | { phase: 'idle' }                           // 초기/미인증/쿨다운 (미렌더)
  | { phase: 'loading' }                        // fetch 중 (미렌더)
  | { phase: 'ready'; prompt: FetchedPrompt }   // 질문 노출
  | { phase: 'submitting' }                     // 응답 전송 중
  | { phase: 'done' }                           // 완료/스킵 — 즉시 사라짐

interface MicroPromptSlotProps {
  /** 노출 컨텍스트 (이벤트 분석/디버깅용). 예: 'loading_skeleton', 'sidebar_card' */
  context?: string
  /** 외곽 wrapper 스타일 */
  className?: string
}

export function MicroPromptSlot({ context = 'loading_skeleton', className = '' }: MicroPromptSlotProps) {
  const [state, setState] = useState<SlotState>({ phase: 'idle' })
  const [mountedLongEnough, setMountedLongEnough] = useState(false)

  // 로딩이 충분히 길 때만 (300ms+) 질문 노출.
  // 빠른 로딩에선 슬롯이 안 보이고 끝 → 플래시 방지.
  useEffect(() => {
    const t = setTimeout(() => setMountedLongEnough(true), 300)
    return () => clearTimeout(t)
  }, [])

  // 마운트 시 한 번 fetch. 실패해도 앱엔 영향 X.
  useEffect(() => {
    let cancelled = false
    setState({ phase: 'loading' })

    fetch('/api/micro-prompts/next', { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (cancelled) return
        const payload = json?.data ?? json
        const fetched = payload?.prompt as FetchedPrompt | null

        if (fetched && fetched.config?.type === 'scenario-card') {
          setState({ phase: 'ready', prompt: fetched })
        } else {
          // 현재는 scenario-card만 지원. 다른 타입 들어오면 idle 처리.
          setState({ phase: 'idle' })
        }
      })
      .catch(() => {
        if (cancelled) return
        setState({ phase: 'idle' })
      })

    return () => { cancelled = true }
  }, [])

  const submit = useCallback(
    async (action: 'answered' | 'skipped' | 'dismissed', response?: unknown, questionId?: string) => {
      setState({ phase: 'submitting' })
      try {
        await fetch('/api/micro-prompts/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            questionId,
            action,
            response: response ?? null,
            context,
          }),
        })
      } catch {
        // Silent fail — UX 막지 않음
      }
      setState({ phase: 'done' })
    },
    [context],
  )

  const handleSelect = useCallback(
    (option: ScenarioOption) => {
      if (state.phase !== 'ready') return
      submit('answered', option, state.prompt.id)
    },
    [state, submit],
  )

  const handleDismiss = useCallback(() => {
    if (state.phase !== 'ready') return
    submit('dismissed', null, state.prompt.id)
  }, [state, submit])

  if (state.phase !== 'ready') return null
  if (!mountedLongEnough) return null  // 플래시 방지 — 300ms 이상 로딩일 때만 노출

  const scenarioConfig = state.prompt.config as ScenarioCardQuestion

  return (
    <div
      className={`bg-surface-card border border-border rounded-2xl p-5 ${className}`}
      style={{ animation: 'ob-reveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) both' }}
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-txt-tertiary">
            프로필 보강 · 1탭이면 됩니다
          </p>
          <h3 className="text-[15px] font-bold text-txt-primary mt-1">
            {state.prompt.prompt}
          </h3>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-txt-tertiary hover:text-txt-secondary hover:bg-surface-sunken transition-colors shrink-0"
          aria-label="닫기"
        >
          <X size={14} />
        </button>
      </div>

      <ScenarioCard
        options={scenarioConfig.options}
        onChange={handleSelect}
      />
    </div>
  )
}
