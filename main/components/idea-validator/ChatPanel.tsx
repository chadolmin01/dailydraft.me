'use client'

import React, { useRef, useEffect, useState } from 'react'
import type { ChatMessage } from './types'
import type { Phase } from './hooks/useValidationReducer'
import MessageBubble from './MessageBubble'

interface ChatPanelProps {
  messages: ChatMessage[]
  isStreaming: boolean
  phase: Phase
  error: string | null
  onSubmit: (text: string) => void
  onReset: () => void
}

export default function ChatPanel({ messages, isStreaming, phase, error, onSubmit, onReset }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when not streaming
  useEffect(() => {
    if (!isStreaming) inputRef.current?.focus()
  }, [isStreaming])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    onSubmit(trimmed)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="h-full flex flex-col bg-surface-card">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold text-txt-primary">아이디어 검증</h1>
          <p className="text-xs text-txt-tertiary font-mono mt-0.5">
            {phase === 'input' ? 'IDEA INPUT' : phase === 'analyzing' ? 'ANALYZING...' : 'DISCUSSION'}
          </p>
        </div>
        {phase !== 'input' && (
          <button
            onClick={onReset}
            className="text-xs text-txt-tertiary hover:text-txt-primary transition-colors font-mono"
          >
            새로 시작
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <div className="text-4xl mb-4">💡</div>
              <h2 className="text-xl font-semibold text-txt-primary mb-2">아이디어를 들려주세요</h2>
              <p className="text-sm text-txt-secondary leading-relaxed">
                3명의 전문가(개발자, 디자이너, 투자자)가 실시간 토론으로 당신의 아이디어를 검증합니다.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {[
                  '대학생 팀빌딩 플랫폼',
                  'AI 기반 독서 습관 앱',
                  '로컬 맛집 공유 서비스',
                ].map(example => (
                  <button
                    key={example}
                    onClick={() => { setInput(example); inputRef.current?.focus() }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border text-txt-secondary hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming indicator */}
        {isStreaming && messages.length > 0 && !messages.at(-1)?.isStreaming && (
          <div className="flex items-center gap-2 text-xs text-txt-tertiary">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-txt-tertiary animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-txt-tertiary animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-txt-tertiary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-border">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={phase === 'input' ? '아이디어를 입력하세요...' : '추가 설명이나 답변을 입력하세요...'}
            disabled={isStreaming}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-transparent px-4 py-3 text-sm text-txt-primary placeholder:text-txt-tertiary focus:outline-hidden focus:ring-1 focus:ring-txt-tertiary/30 disabled:opacity-50"
            style={{ minHeight: '44px', maxHeight: '120px' }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 120) + 'px'
            }}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="shrink-0 h-11 w-11 rounded-xl bg-txt-primary text-surface-card flex items-center justify-center disabled:opacity-30 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}
