'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { renderMarkdown } from '@/src/lib/markdown'
import { IconButton } from './IconButton'

/**
 * 챗 메시지 말풍선. 라이트 패널.
 * 색 구분:
 *  - user (내 말풍선)        : ink 솔리드 + canvas 텍스트. 우측 정렬.
 *  - assistant (상대 말풍선) : surface-soft 채움 + ink 텍스트. 좌측 정렬.
 * 호버 시 시간 + 복사 버튼.
 */

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  text: string
  createdAt?: string
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

  const body = isUser ? (
    <p className="whitespace-pre-wrap break-words text-body-sm leading-relaxed">{text}</p>
  ) : (
    <div
      className="chat-markdown text-body-sm text-ink"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
    />
  )

  return (
    <div className={`chat-bubble-in flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}>
      <div
        className={
          isUser
            ? 'max-w-[85%] rounded-2xl rounded-br-md bg-ink text-canvas px-4 py-2.5 shadow-sm'
            : 'max-w-[92%] rounded-2xl rounded-bl-md bg-surface-soft text-ink px-4 py-3 border border-hairline'
        }
      >
        {body}
      </div>
      <div
        className={`flex items-center gap-1 mt-1 px-1 h-5 text-caption text-muted-soft opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ${
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
