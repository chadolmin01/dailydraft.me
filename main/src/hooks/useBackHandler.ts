'use client'
import { useEffect, useRef, useCallback } from 'react'

const BACK_KEY = '__modal_back'

// 중앙 스택: { id, close } — LIFO (마지막이 먼저 닫힘)
type StackEntry = { id: string; close: () => void }
const handlerStack: StackEntry[] = []
let listenerAttached = false
// 동기 cleanup에서 예약된 history.back() 수 — popstate에서 소비
let pendingBackCount = 0
// 동시 다중 back() 호출 방지 (batching)
let backFlushTimer: ReturnType<typeof setTimeout> | null = null

function flushPendingBacks() {
  backFlushTimer = null
  if (pendingBackCount > 0) {
    // 한 번만 back() 호출 — 나머지는 popstate에서 skip
    const count = pendingBackCount
    pendingBackCount = 0
    // history.go(-N) 으로 한번에 N개 sentinel 제거
    window.history.go(-count)
  }
}

function scheduleBack() {
  pendingBackCount++
  if (!backFlushTimer) {
    backFlushTimer = setTimeout(flushPendingBacks, 0)
  }
}

function ensureGlobalListener() {
  if (listenerAttached) return
  listenerAttached = true
  window.addEventListener('popstate', (event) => {
    // sentinel entry인지 확인
    const state = event.state
    const isModalEntry = state && typeof state === 'object' && BACK_KEY in state

    if (!isModalEntry && handlerStack.length === 0) {
      // 일반 네비게이션 — 간섭하지 않음
      return
    }

    if (handlerStack.length > 0) {
      const top = handlerStack.pop()!
      top.close()
    }
  })
}

let idCounter = 0

export function useBackHandler(isOpen: boolean, onClose: () => void, modalId?: string) {
  const entryIdRef = useRef<string | null>(null)
  const closingFromBackRef = useRef(false)
  const onCloseRef = useRef(onClose)

  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  const stableClose = useCallback(() => {
    closingFromBackRef.current = true
    onCloseRef.current()
  }, [])

  useEffect(() => { ensureGlobalListener() }, [])

  // modalId가 없으면 인스턴스별 고유 ID 생성 (하드코딩 충돌 방지)
  const stableIdRef = useRef<string | null>(null)
  if (stableIdRef.current === null) {
    stableIdRef.current = modalId || `modal_${++idCounter}_${Date.now()}`
  }
  const resolvedId = modalId || stableIdRef.current

  useEffect(() => {
    if (isOpen && entryIdRef.current === null) {
      const id = resolvedId
      entryIdRef.current = id
      handlerStack.push({ id, close: stableClose })
      window.history.pushState({ [BACK_KEY]: id }, '')
    }
    if (!isOpen && entryIdRef.current !== null) {
      const id = entryIdRef.current
      entryIdRef.current = null
      const idx = handlerStack.findIndex(e => e.id === id)
      if (idx !== -1) handlerStack.splice(idx, 1)
      if (!closingFromBackRef.current) {
        // sentinel 제거: history state 확인 후 안전하게 back
        const currentState = window.history.state
        if (currentState && typeof currentState === 'object' && currentState[BACK_KEY]) {
          scheduleBack()
        }
      }
      closingFromBackRef.current = false
    }
  }, [isOpen, stableClose, resolvedId])

  // 언마운트 시 sentinel 정리
  useEffect(() => {
    return () => {
      if (entryIdRef.current !== null) {
        const id = entryIdRef.current
        entryIdRef.current = null
        const idx = handlerStack.findIndex(e => e.id === id)
        if (idx !== -1) handlerStack.splice(idx, 1)
        // 라우트 변경으로 인한 언마운트인지 확인
        const currentState = window.history.state
        if (currentState && typeof currentState === 'object' && currentState[BACK_KEY]) {
          scheduleBack()
        }
      }
    }
  }, [])
}
