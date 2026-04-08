'use client'

import { useRef } from 'react'

// 세션 동안 이미 한 번 등장한 카드 ID를 기억 — 필터/모달로 인한 재마운트 시 stagger 애니메이션 중복 재생 방지
const seenKeys = new Set<string>()

/**
 * 카드의 진입 stagger 애니메이션을 "세션당 1회"로 제한.
 * 처음 마운트되는 ID에는 'stagger-item' 클래스를, 이미 본 ID에는 빈 문자열을 반환.
 * 결과는 인스턴스 생애 동안 고정 (re-render에도 흔들리지 않음).
 */
export function useStaggerOnce(key: string): string {
  const classRef = useRef<string | null>(null)
  if (classRef.current === null) {
    classRef.current = staggerOnceClass(key)
  }
  return classRef.current
}

/**
 * 훅을 쓸 수 없는 컨텍스트(예: .map() 안의 인라인 렌더링)에서 사용.
 * 동작은 useStaggerOnce와 동일하지만 인스턴스 lock이 없어 re-render 시 빈 문자열을 반환할 수 있음.
 * CSS animation은 이미 forwards로 끝났으므로 시각적 차이는 없음.
 */
export function staggerOnceClass(key: string): string {
  if (typeof window === 'undefined') return 'stagger-item'
  if (seenKeys.has(key)) return ''
  seenKeys.add(key)
  return 'stagger-item'
}
