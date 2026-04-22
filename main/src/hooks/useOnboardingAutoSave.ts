'use client'

import { useEffect, useRef, useState } from 'react'
import { saveDraftLocal, type DraftMeta } from '@/src/lib/onboarding/draft-storage'
import type { ProfileDraft } from '@/src/lib/onboarding/types'

type SyncStatus = 'idle' | 'saving' | 'saved' | 'error'

interface Options {
  /** debounce(ms) — 마지막 입력 이후 대기 시간. 기본 1200ms */
  debounceMs?: number
  /** draft 가 이 이름을 넘기 시작할 때부터 저장 (너무 이른 저장 방지) */
  minNameLength?: number
}

interface Result {
  status: SyncStatus
  lastSavedAt: string | null
  /** 강제로 지금 저장 (예: 단계 이동 직전) */
  flush: () => void
}

/**
 * `useOnboardingAutoSave` — 온보딩 중 draft 를 로컬에 자동 저장.
 *
 * 목적:
 *   - 실수로 탭 닫아도 다시 진입 시 이어서 쓸 수 있도록
 *   - 서버 저장 실패 시에도 입력값 보존
 *
 * 디자인:
 *   - 입력이 멈춘 후 debounce(ms) 지나면 localStorage 에 쓴다
 *   - 단계 이동 직전엔 flush() 로 즉시 저장
 *   - 너무 이른 저장 방지를 위해 닉네임이 설정되기 전까지는 대기
 *   - status 는 UI 에 "저장 중 / 저장됨" 인디케이터로 쓸 수 있음
 */
export function useOnboardingAutoSave(
  draft: ProfileDraft,
  meta: Partial<DraftMeta> = {},
  options: Options = {},
): Result {
  const { debounceMs = 1200, minNameLength = 0 } = options
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 메타는 래퍼로 저장해서 의존성 배열 안정화
  const metaRef = useRef(meta)
  metaRef.current = meta

  const flush = () => {
    // 실제 쓰기
    const nameLen = (draft.name ?? '').trim().length
    if (nameLen < minNameLength && !draft.source) return
    setStatus('saving')
    const ok = saveDraftLocal(draft, metaRef.current)
    if (ok) {
      const stamp = new Date().toISOString()
      setStatus('saved')
      setLastSavedAt(stamp)
    } else {
      setStatus('error')
    }
  }

  useEffect(() => {
    // 의미 있는 값이 있어야 저장
    if (!draft || (!draft.name?.trim() && !draft.source)) return
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setStatus('saving')
    timeoutRef.current = setTimeout(() => {
      flush()
    }, debounceMs)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
    // draft 를 JSON 으로 직렬화해서 deep-compare 대신 lightweight 체크
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(draft), debounceMs])

  // 페이지 이탈 시 강제 저장
  useEffect(() => {
    const handler = () => {
      if (draft?.name?.trim() || draft?.source) {
        saveDraftLocal(draft, metaRef.current)
      }
    }
    window.addEventListener('beforeunload', handler)
    window.addEventListener('pagehide', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
      window.removeEventListener('pagehide', handler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(draft)])

  return { status, lastSavedAt, flush }
}
