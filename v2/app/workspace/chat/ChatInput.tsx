'use client'

import { useEffect, useRef } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { IconButton } from './IconButton'
import { ModelPicker } from './ModelPicker'
import { CHAT_MODELS } from '@/src/lib/anthropic/client'

/**
 * 채팅 입력창 (라이트). Cursor 스타일 — pill + send 임베드 + 아래 모델 picker.
 * - Enter 전송, Shift+Enter 줄바꿈, IME 조합 중 Enter 무시
 * - 자동 높이 (최대 7줄), 정상 글자 높이에 맞춰 vertical padding 슬림화
 * - send pending 중 → stop 버튼으로 전환
 */

interface ChatInputProps {
  value: string
  onChange: (next: string) => void
  onSubmit: () => void
  onCancel?: () => void
  pending: boolean
  disabled: boolean
  placeholder: string
  selectedModel: string
  onChangeModel: (id: string) => void
  /** Claude CLI 의 path 표시처럼 입력창 바로 위에 작게 노출. null 이면 숨김. */
  contextLabel?: string | null
}

const MAX_LEN = 4000

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  pending,
  disabled,
  placeholder,
  selectedModel,
  onChangeModel,
  contextLabel,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    const max = parseFloat(getComputedStyle(ta).lineHeight) * 7 + 12
    ta.style.height = `${Math.min(ta.scrollHeight, max)}px`
  }, [value])

  // "/" 단축키로 챗 입력에 포커스 — GitHub/Slack 스타일.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      const tag = target?.tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return
      e.preventDefault()
      textareaRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const trimmed = value.trim()
  const canSend = trimmed.length > 0 && !pending && !disabled
  const overLimit = value.length > MAX_LEN

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!canSend || overLimit) return
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-3 pt-2 border-t border-hairline">
      {/* Claude CLI 의 path 표시처럼 — 입력 바로 위에 현재 폴더 작게. */}
      {contextLabel ? (
        <p className="px-1 mb-1 text-caption text-muted-soft truncate font-mono">
          <span className="opacity-60">~/</span>{contextLabel}
        </p>
      ) : null}
      {/* pill: 슬림화 — px-3 py-1 (이전 py-2) + textarea py-1 (이전 py-1.5).
          글씨 높이에 맞춰 컴팩트. */}
      <div
        className={`relative flex items-end gap-2 rounded-2xl border bg-canvas px-3 py-1 transition-colors shadow-sm ${
          overLimit ? 'border-muted' : 'border-hairline focus-within:border-ink'
        }`}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder={placeholder}
          rows={1}
          maxLength={MAX_LEN + 200}
          disabled={disabled && !pending}
          className="flex-1 bg-transparent border-none outline-none resize-none text-body-md text-ink placeholder:text-muted-soft disabled:opacity-50 py-1 px-1 max-h-48 overflow-y-auto scrollbar-hide leading-snug"
        />
        {pending && onCancel ? (
          <IconButton
            variant="solid"
            size="sm"
            label="응답 중단"
            onClick={onCancel}
            className="mb-0.5"
          >
            <Square size={12} strokeWidth={2.5} fill="currentColor" />
          </IconButton>
        ) : (
          <IconButton
            variant="solid"
            size="sm"
            label="보내기"
            type="submit"
            disabled={!canSend || overLimit}
            className="mb-0.5"
          >
            <ArrowUp size={14} strokeWidth={2.5} />
          </IconButton>
        )}
      </div>
      {/* Cursor 스타일 하단 줄: 모델 picker (좌) + 단축키 + 글자수 (우) */}
      <div className="flex items-center justify-between mt-1.5 px-1 text-caption text-muted-soft">
        <ModelPicker models={CHAT_MODELS} value={selectedModel} onChange={onChangeModel} />
        <span className="flex items-center gap-2 opacity-70">
          {value.length > 200 ? (
            <span className={`tabular ${overLimit ? 'text-ink' : ''}`}>
              {value.length} / {MAX_LEN}
            </span>
          ) : null}
          <span>
            <kbd className="px-1 rounded bg-surface-card text-ink/80 text-[10px] font-mono">/</kbd>{' '}
            포커스 · <kbd className="px-1 rounded bg-surface-card text-ink/80 text-[10px] font-mono">⏎</kbd> 전송
          </span>
        </span>
      </div>
    </form>
  )
}
