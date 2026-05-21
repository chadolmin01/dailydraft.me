'use client'

import React from 'react'
import type { ChatMessage, DiscussionTurn } from './types'
import { PERSONA_INFO, type PersonaRole } from './types'

interface MessageBubbleProps {
  message: ChatMessage
}

function getPersonaStyle(persona: string) {
  const info = PERSONA_INFO[persona as PersonaRole]
  return info || { nameKo: persona, color: '#6B7280', icon: '🤖' }
}

function DiscussionTurnBubble({ turn }: { turn: DiscussionTurn }) {
  const style = getPersonaStyle(turn.persona)
  const toneLabel: Record<string, string> = {
    agree: '동의',
    disagree: '반박',
    question: '질문',
    suggestion: '제안',
    neutral: '',
  }

  return (
    <div className="flex gap-3 items-start">
      <div
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm"
        style={{ backgroundColor: `${style.color}15` }}
      >
        {style.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium" style={{ color: style.color }}>
            {style.nameKo}
          </span>
          {turn.replyTo && (
            <span className="text-[10px] text-txt-tertiary">
              → {getPersonaStyle(turn.replyTo).nameKo}
            </span>
          )}
          {toneLabel[turn.tone] && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-txt-tertiary font-mono">
              {toneLabel[turn.tone]}
            </span>
          )}
        </div>
        <p className="text-sm text-txt-secondary leading-relaxed">{turn.message}</p>
      </div>
    </div>
  )
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  // User message
  if (message.isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-md bg-txt-primary text-surface-card text-sm">
          {message.text}
        </div>
      </div>
    )
  }

  // Persona opinion
  if (message.persona && message.personaMessage) {
    const style = getPersonaStyle(message.persona)
    return (
      <div className="flex gap-3 items-start">
        <div
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm"
          style={{ backgroundColor: `${style.color}15` }}
        >
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium mb-1 block" style={{ color: style.color }}>
            {style.nameKo}
          </span>
          <p className="text-sm text-txt-secondary leading-relaxed">{message.personaMessage}</p>
        </div>
      </div>
    )
  }

  // Discussion turns
  if (message.discussion && message.discussion.length > 0) {
    return (
      <div className="space-y-4 py-2">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-mono uppercase text-txt-tertiary tracking-wider">토론</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        {message.discussion.map((turn, i) => (
          <DiscussionTurnBubble key={i} turn={turn} />
        ))}
      </div>
    )
  }

  // Streaming / synthesizing indicator
  if (message.isStreaming || message.streamPhase === 'synthesizing') {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-txt-tertiary animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-txt-tertiary animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-txt-tertiary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-xs text-txt-tertiary">{message.text || '종합 중...'}</span>
      </div>
    )
  }

  // Final summary (inline in chat)
  if (message.streamPhase === 'final' && message.metrics) {
    return (
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase text-txt-tertiary tracking-wider">종합 평가</span>
        </div>
        <p className="text-sm text-txt-primary leading-relaxed">{message.metrics.summary}</p>
        {message.metrics.keyStrengths && message.metrics.keyStrengths.length > 0 && (
          <div>
            <span className="text-[10px] font-mono uppercase text-green-600 dark:text-green-400">강점</span>
            <ul className="mt-1 space-y-0.5">
              {message.metrics.keyStrengths.map((s, i) => (
                <li key={i} className="text-xs text-txt-secondary flex gap-1.5">
                  <span className="text-green-500 shrink-0">+</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {message.metrics.keyRisks && message.metrics.keyRisks.length > 0 && (
          <div>
            <span className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400">리스크</span>
            <ul className="mt-1 space-y-0.5">
              {message.metrics.keyRisks.map((r, i) => (
                <li key={i} className="text-xs text-txt-secondary flex gap-1.5">
                  <span className="text-amber-500 shrink-0">!</span> {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  // Plain text (warning, etc.)
  if (message.text) {
    return (
      <div className="text-sm text-txt-secondary py-1">{message.text}</div>
    )
  }

  return null
}
