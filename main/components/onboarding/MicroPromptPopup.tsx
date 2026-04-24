'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { useDwellTime } from '@/src/hooks/useDwellTime'
import { MicroPromptCard } from './MicroPromptCard'

interface Props {
  /** 체류 임계값 (기본 30초). */
  thresholdMs?: number
  /** 특정 경로에서만 노출할 때 지정. 예: `/p/abc` 같은 실제 pathname */
  pathname: string
}

/**
 * `<MicroPromptPopup>` — 프로젝트·클럽 상세 페이지 등 읽기 중심 경로에서
 * 지정한 시간(기본 30초) 체류 시 하단 우측에 슬라이드 업 배너로 등장.
 *
 * 동작:
 *   - useDwellTime 으로 "탭 활성·30초 체류" 감지
 *   - 로그인 + AI 인터뷰 미완료 유저에게만
 *   - 경로별 sessionStorage 로 dismiss 기록 (같은 경로 재진입 시 재노출 안 됨)
 *   - MicroPromptCard 자체가 이미 답한 질문·쿨다운 필터링
 *
 * 접근성:
 *   - role="dialog" + aria-modal="false" (블록하지 않음)
 *   - Escape 키로 닫기
 *   - 초기 autoFocus 없음 (읽기 흐름 방해 안 함)
 */
export function MicroPromptPopup({ thresholdMs = 30_000, pathname }: Props) {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const reached = useDwellTime({ thresholdMs })
  const [visible, setVisible] = useState(false)

  const storageKey = `micro-prompt-popup-dismissed:${pathname}`

  useEffect(() => {
    if (!reached) return
    if (!user) return
    if (profile?.ai_chat_completed) return
    try {
      if (sessionStorage.getItem(storageKey) === '1') return
    } catch {}
    setVisible(true)
  }, [reached, user, profile, storageKey])

  // Esc 키로 닫기
  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const handleDismiss = () => {
    setVisible(false)
    try {
      sessionStorage.setItem(storageKey, '1')
    } catch {}
  }

  const handleComplete = () => {
    // 응답 후 부드럽게 닫기 (MicroPromptCard 자체 1.2초 지연 이후)
    setVisible(false)
    try {
      sessionStorage.setItem(storageKey, '1')
    } catch {}
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="매칭 정확도 향상 질문 — 닫으시려면 Esc"
      className="fixed z-120 bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[340px] pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="shadow-2xl rounded-2xl overflow-hidden">
        <MicroPromptCard
          slot="popup"
          dismissible
          onDismiss={handleDismiss}
          onComplete={handleComplete}
        />
      </div>
    </div>
  )
}
