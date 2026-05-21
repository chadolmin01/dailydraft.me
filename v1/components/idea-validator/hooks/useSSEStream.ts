import { useRef, useCallback } from 'react'
import type { Action } from './useValidationReducer'
import type { Scorecard } from '../types'

interface StreamOptions {
  idea: string
  conversationHistory: string[]
  currentScorecard: Scorecard
  turnNumber: number
}

export function useSSEStream(dispatch: React.Dispatch<Action>) {
  const abortRef = useRef<AbortController | null>(null)

  const startStream = useCallback(async (options: StreamOptions) => {
    // Abort previous stream if any
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/idea-validator/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: options.idea,
          conversationHistory: options.conversationHistory,
          currentScorecard: options.currentScorecard,
          turnNumber: options.turnNumber,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'API 요청 실패' }))
        dispatch({ type: 'SET_ERROR', error: errData.error || `HTTP ${res.status}` })
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        dispatch({ type: 'SET_ERROR', error: '스트리밍 응답을 읽을 수 없습니다' })
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            dispatch({ type: 'FINISH' })
            return
          }

          try {
            const event = JSON.parse(data)
            switch (event.type) {
              case 'opinion':
                dispatch({
                  type: 'STREAM_OPINION',
                  persona: event.data.persona,
                  message: event.data.message,
                })
                break
              case 'synthesizing':
                dispatch({ type: 'STREAM_SYNTHESIZING' })
                break
              case 'discussion':
                dispatch({ type: 'STREAM_DISCUSSION', turn: event.data })
                break
              case 'final':
                dispatch({ type: 'STREAM_FINAL', data: event.data })
                break
              case 'warning':
                dispatch({ type: 'SET_WARNING', warning: event.data.warning })
                break
              case 'error':
                dispatch({ type: 'SET_ERROR', error: event.data.message })
                break
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      dispatch({ type: 'SET_ERROR', error: (err as Error).message || '알 수 없는 오류' })
    }
  }, [dispatch])

  const abort = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return { startStream, abort }
}
