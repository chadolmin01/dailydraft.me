'use client'

import React from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import type { Bubble, BubbleAttachment, Step } from '@/src/lib/onboarding/types'
import { ATTACHMENT_TO_STEP } from '@/src/lib/onboarding/constants'

interface OnboardingChatProps {
  bubbles: Bubble[]
  isTyping: boolean
  isSaving: boolean
  saveError: string | null
  aiActivity: string | null
  step: Step
  chatEndRef: React.RefObject<HTMLDivElement | null>
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  onRetrySave: () => void
  /** Render function for attachment content */
  renderAttachment: (bubble: Bubble) => React.ReactNode
}

function isActiveBubble(bubbles: Bubble[], id: string, attachment: BubbleAttachment | undefined, step: Step): boolean {
  if (!attachment) return false
  const last = [...bubbles].reverse().find(b => b.attachment === attachment)
  if (last?.id !== id) return false
  return ATTACHMENT_TO_STEP[attachment] === step
}

export const OnboardingChat: React.FC<OnboardingChatProps> = ({
  bubbles, isTyping, isSaving, saveError, aiActivity, step,
  chatEndRef, scrollContainerRef, onRetrySave, renderAttachment,
}) => {
  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-5 py-6 space-y-1">
        {bubbles.map((bubble, i) => {
          const isAi = bubble.role === 'ai'
          const prev = bubbles[i - 1]
          const showAvatar = isAi && (!prev || prev.role !== 'ai')
          const isGrouped = isAi && prev?.role === 'ai'
          const active = isActiveBubble(bubbles, bubble.id, bubble.attachment, step)

          return (
            <div key={bubble.id}>
              {prev && prev.role !== bubble.role && <div className="h-4" />}
              <div className={`flex ${isAi ? 'justify-start' : 'justify-end'} ${isGrouped ? 'mt-1' : ''}`}>
                {isAi && (
                  <div className="w-8 mr-2 shrink-0 flex flex-col items-center">
                    {showAvatar ? (
                      <div className="w-7 h-7 bg-black flex items-center justify-center mt-0.5">
                        <span className="text-white text-[10px] font-black">D</span>
                      </div>
                    ) : <div className="w-7" />}
                  </div>
                )}
                <div className={`flex flex-col ${isAi ? 'items-start' : 'items-end'} max-w-[80%] sm:max-w-[72%]`}>
                  <div className={`ob-bubble text-[14px] leading-[1.6] whitespace-pre-wrap px-4 py-2.5 ${isAi ? 'bg-surface-card text-txt-primary border border-border shadow-md' : 'bg-surface-inverse text-txt-inverse'}`}>
                    {bubble.content}
                  </div>
                  {active && (
                    <div className="ob-form w-full">
                      {renderAttachment(bubble)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {isTyping && (
          <div className="flex justify-start mt-1">
            <div className="w-8 mr-2 shrink-0" />
            <div className="ob-bubble bg-surface-card rounded-xl border border-border px-4 py-3 shadow-md">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-[5px]">
                  <div className="w-[7px] h-[7px] bg-txt-disabled ob-dot" style={{ animationDelay: '0ms' }} />
                  <div className="w-[7px] h-[7px] bg-txt-disabled ob-dot" style={{ animationDelay: '200ms' }} />
                  <div className="w-[7px] h-[7px] bg-txt-disabled ob-dot" style={{ animationDelay: '400ms' }} />
                </div>
                {aiActivity && (
                  <span className="text-[11px] text-brand font-medium font-mono flex items-center gap-1">
                    <Sparkles size={10} />
                    {aiActivity}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {isSaving && step === 'done' && (
          <div className="flex justify-start mt-2">
            <div className="w-8 mr-2 shrink-0" />
            <div className="ob-bubble flex items-center gap-2 bg-surface-card rounded-xl border border-border px-4 py-2.5 shadow-md">
              <Loader2 size={14} className="animate-spin text-txt-disabled" />
              <span className="text-[13px] text-txt-tertiary font-mono">프로필 저장 중...</span>
            </div>
          </div>
        )}

        {saveError && (
          <div className="flex justify-start mt-2">
            <div className="w-8 mr-2 shrink-0" />
            <div className="ob-bubble bg-status-danger-bg border border-status-danger-text/20 px-4 py-2.5">
              <p className="text-[13px] text-status-danger-text font-medium">{saveError}</p>
              <button onClick={onRetrySave} className="text-[12px] text-status-danger-text underline underline-offset-2 mt-1 hover:text-status-danger-text/80">다시 시도</button>
            </div>
          </div>
        )}

        <div ref={chatEndRef} className="h-4" />
      </div>
    </div>
  )
}
