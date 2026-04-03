'use client'

import React from 'react'
import { Send, Lightbulb, Undo2 } from 'lucide-react'
import { DEEP_CHAT_TOPICS } from '@/src/lib/onboarding/constants'

interface DeepChatFooterProps {
  deepChatInput: string
  isTyping: boolean
  userMsgCount: number
  showSuggestions: boolean
  currentSuggestions: string[]
  coveredTopics: string[]
  hasMessages: boolean
  canUndo: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  onInputChange: (v: string) => void
  onSend: () => void
  onSuggestionClick: (text: string) => void
  onUndo: () => void
}

export const DeepChatFooter: React.FC<DeepChatFooterProps> = ({
  deepChatInput, isTyping, userMsgCount,
  showSuggestions, currentSuggestions, coveredTopics, hasMessages,
  canUndo, inputRef, onInputChange, onSend, onSuggestionClick, onUndo,
}) => {
  return (
    <div className="border-t border-border bg-surface-card/80 backdrop-blur-md">
      {/* Suggestions */}
      {showSuggestions && !isTyping && currentSuggestions.length > 0 && hasMessages && (
        <div className="px-4 pt-2.5 pb-0">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb size={10} className="text-txt-disabled" />
              <span className="text-[10px] text-txt-disabled">Quick Reply</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestionClick(suggestion)}
                  className="ob-chip text-[12px] px-3 py-1.5 bg-surface-card rounded-lg border border-border text-txt-primary hover:bg-black hover:text-white transition-all"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Input */}
      <div className="px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            {canUndo && (
              <button
                onClick={onUndo}
                className="w-10 h-10 flex items-center justify-center text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken rounded-lg transition-colors shrink-0"
                title="이전 답변 되돌리기"
              >
                <Undo2 size={16} />
              </button>
            )}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={deepChatInput}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={userMsgCount === 0 ? '첫 번째 질문에 답해보세요...' : '이어서 이야기해주세요...'}
                className="w-full pl-4 pr-11 py-3 bg-surface-card rounded-lg border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-surface-inverse focus:bg-white transition-all placeholder:text-txt-tertiary"
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !isTyping && onSend()}
              />
              <button
                onClick={onSend}
                disabled={isTyping || !deepChatInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-txt-secondary hover:text-black transition-colors disabled:opacity-30"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
          {/* Topic progress bar */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              {DEEP_CHAT_TOPICS.slice(0, 6).map(topic => {
                const covered = coveredTopics.includes(topic.id)
                return (
                  <div key={topic.id} title={topic.label} className={`w-1.5 h-1.5 transition-all duration-500 ${covered ? 'bg-brand' : 'bg-border'}`} />
                )
              })}
              <span className="text-[10px] font-mono text-txt-disabled ml-1.5">
                {coveredTopics.length}/{DEEP_CHAT_TOPICS.length} topics
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Default Footer (non-deep-chat steps) ──

interface DefaultFooterProps {
  canGoBack: boolean
  onGoBack: () => void
}

export const DefaultFooter: React.FC<DefaultFooterProps> = ({ canGoBack, onGoBack }) => {
  return (
    <div className="px-4 py-3 border-t border-border bg-surface-card/60 backdrop-blur-sm">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {canGoBack ? (
          <button
            onClick={onGoBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-txt-secondary border border-border rounded-lg hover:bg-surface-sunken hover:text-txt-primary transition-all active:scale-[0.97]"
          >
            <Undo2 size={13} />
            이전으로
          </button>
        ) : (
          <span className="text-[10px] text-txt-tertiary">Draft Onboarding</span>
        )}
        <span className="text-[10px] text-txt-tertiary font-mono">나중에 프로필에서 수정 가능</span>
      </div>
    </div>
  )
}
