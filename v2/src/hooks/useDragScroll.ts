import { useRef, useEffect, useCallback } from 'react'

/**
 * 가로 스크롤 컨테이너에 마우스 드래그 스크롤을 추가하는 훅.
 * ref를 반환하여 컨테이너 div에 연결하면 됨.
 *
 * - 마우스 클릭 + 드래그로 좌우 스크롤
 * - 드래그 중에는 자식 클릭 이벤트 차단 (카드 클릭 오작동 방지)
 * - 터치 디바이스에서는 기본 스와이프 그대로 사용
 */
export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const state = useRef({ isDown: false, startX: 0, scrollLeft: 0, moved: false })

  const onMouseDown = useCallback((e: MouseEvent) => {
    const el = ref.current
    if (!el) return
    state.current = {
      isDown: true,
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      moved: false,
    }
    el.classList.add('dragging')
  }, [])

  const onMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current
    if (!el || !state.current.isDown) return
    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    const walk = x - state.current.startX
    if (Math.abs(walk) > 3) state.current.moved = true
    el.scrollLeft = state.current.scrollLeft - walk
  }, [])

  const onMouseUp = useCallback(() => {
    const el = ref.current
    if (!el) return
    state.current.isDown = false
    el.classList.remove('dragging')
  }, [])

  // 드래그 후 클릭 차단 — 카드 클릭 오작동 방지
  const onClick = useCallback((e: MouseEvent) => {
    if (state.current.moved) {
      e.preventDefault()
      e.stopPropagation()
      state.current.moved = false
    }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    el.addEventListener('click', onClick, true)

    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      el.removeEventListener('click', onClick, true)
    }
  }, [onMouseDown, onMouseMove, onMouseUp, onClick])

  return ref
}
