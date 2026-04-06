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
    const count = pendingBackCount
    pendingBackCount = 0
    window.history.go(-count)
  }
}

function cancelPendingBacks() {
  if (backFlushTimer) {
    clearTimeout(backFlushTimer)
    backFlushTimer = null
  }
  pendingBackCount = 0
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

  // 단일 글로벌 ESC 핸들러 — 스택 최상단만 닫음
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && handlerStack.length > 0) {
      e.preventDefault()
      e.stopImmediatePropagation()
      window.history.back()
    }
  }, true) // capture phase — 다른 ESC 핸들러보다 먼저 실행

  window.addEventListener('popstate', (event) => {
    const state = event.state
    const isModalEntry = state && typeof state === 'object' && BACK_KEY in state

    if (!isModalEntry && handlerStack.length === 0) {
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

  const stableIdRef = useRef<string | null>(null)
  if (stableIdRef.current === null) {
    stableIdRef.current = modalId || `modal_${++idCounter}_${Date.now()}`
  }
  const resolvedId = modalId || stableIdRef.current

  useEffect(() => {
    if (isOpen && entryIdRef.current === null) {
      // Strict Mode 대응: 이전 cleanup에서 예약된 back이 있으면 취소
      // (simulated unmount → remount 시나리오)
      cancelPendingBacks()

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
        const currentState = window.history.state
        if (currentState && typeof currentState === 'object' && currentState[BACK_KEY]) {
          scheduleBack()
        }
      }
    }
  }, [])
}
