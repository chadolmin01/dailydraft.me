'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { renderMarkdown } from '@/src/lib/markdown'
import { IconButton } from './IconButton'

/**
 * 챗 메시지 말풍선.
 * - user: 우측 정렬, 밝은 채움 (elevated). 꼬리 라운드 우하단 작음.
 * - assistant: 좌측 정렬, 살짝 어두운 카드. 꼬리 라운드 좌하단 작음.
 * 호버 시 복사 버튼 + 타임스탬프 표시.
 */

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  text: string
  createdAt?: string
  onRetry?: () => void
}

function formatTime(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ role, text, createdAt }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  const isUser = role === 'user'
  const time = formatTime(createdAt)

  // user: 단순 텍스트 (whitespace 보존). assistant: markdown 렌더.
  const body = isUser ? (
    <p className="whitespace-pre-wrap break-words text-body-sm leading-relaxed">{text}</p>
  ) : (
    <div
      className="chat-markdown text-body-sm text-on-dark"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
    />
  )

  return (
    <div className={`chat-bubble-in flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}>
      <div
        className={
          isUser
            ? 'max-w-[85%] rounded-2xl rounded-br-md bg-surface-dark-elevated text-on-dark px-4 py-2.5 shadow-sm'
            : 'max-w-[92%] rounded-2xl rounded-bl-md bg-surface-dark-soft text-on-dark px-4 py-3 border border-hairline-dark'
        }
      >
        {body}
      </div>
      <div
        className={`flex items-center gap-1 mt-1 px-1 h-5 text-caption text-on-dark-soft opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ${
          isUser ? 'flex-row-reverse' : ''
        }`}
      >
        {time ? <span className="tabular">{time}</span> : null}
        <IconButton
          variant="ghost"
          size="sm"
          label={copied ? '복사됨' : '복사'}
          onClick={handleCopy}
          className="h-5 w-5"
        >
          {copied ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={2} />}
        </IconButton>
      </div>
    </div>
  )
}
