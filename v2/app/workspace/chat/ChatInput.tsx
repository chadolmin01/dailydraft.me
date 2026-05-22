'use client'

import { useEffect, useRef } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { IconButton } from './IconButton'

/**
 * 채팅 입력창 (라이트). pill 형태, send 버튼 우측 임베드.
 * - Enter 전송, Shift+Enter 줄바꿈, IME 조합 중 Enter 무시
 * - 자동 높이 (최대 7줄)
 * - send pending 중 → stop 버튼으로 전환
 * - 4000자 초과 표시
 */

interface ChatInputProps {
  value: string
  onChange: (next: string) => void
  onSubmit: () => void
  onCancel?: () => void
  pending: boolean
  disabled: boolean
  placeholder: string
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
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 입력 길이 변경 시 자동 높이 — 최대 7줄.
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    const max = parseFloat(getComputedStyle(ta).lineHeight) * 7 + 16
    ta.style.height = `${Math.min(ta.scrollHeight, max)}px`
  }, [value])

  const trimmed = value.trim()
  const canSend = trimmed.length > 0 && !pending && !disabled
  const overLimit = value.length > MAX_LEN

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!canSend || overLimit) return
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-4 pt-3 border-t border-hairline">
      <div
        className={`relative flex items-end gap-2 rounded-3xl border bg-canvas px-3 py-2 transition-colors shadow-sm ${
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
          className="flex-1 bg-transparent border-none outline-none resize-none text-body-md text-ink placeholder:text-muted-soft disabled:opacity-50 py-1.5 px-1 max-h-48 overflow-y-auto scrollbar-hide"
        />
        {pending && onCancel ? (
          <IconButton
            variant="solid"
            size="md"
            label="응답 중단"
            onClick={onCancel}
            className="mb-0.5"
          >
            <Square size={14} strokeWidth={2.5} fill="currentColor" />
          </IconButton>
        ) : (
          <IconButton
            variant="solid"
            size="md"
            label="보내기"
            type="submit"
            disabled={!canSend || overLimit}
            className="mb-0.5"
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </IconButton>
        )}
      </div>
      <div className="flex items-center justify-between mt-2 px-2 text-caption text-muted-soft">
        <span className="opacity-70">Enter 로 보내기 · Shift+Enter 줄바꿈</span>
        {value.length > 200 ? (
          <span className={`tabular ${overLimit ? 'text-ink' : 'opacity-70'}`}>
            {value.length} / {MAX_LEN}
          </span>
        ) : null}
      </div>
    </form>
  )
}
