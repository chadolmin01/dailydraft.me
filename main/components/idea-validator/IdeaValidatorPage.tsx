'use client'

import React, { useEffect, useCallback } from 'react'
import { useValidationReducer } from './hooks/useValidationReducer'
import { useSSEStream } from './hooks/useSSEStream'
import ChatPanel from './ChatPanel'
import ScorecardPanel from './ScorecardPanel'
import ResultSummary from './ResultSummary'

interface IdeaValidatorPageProps {
  /** workflow 페이지에서 사용할 때: 검증 완료 시 호출 */
  onComplete?: (result: { id: string; projectIdea: string }) => void
  /** workflow 페이지에서 사용할 때: 상단 네비 숨김 */
  embedded?: boolean
}

export default function IdeaValidatorPage({ onComplete, embedded }: IdeaValidatorPageProps = {}) {
  const { state, dispatch, submitIdea, userReply, reset } = useValidationReducer()
  const { startStream, abort } = useSSEStream(dispatch)

  // Trigger stream when idea is submitted or user replies
  useEffect(() => {
    if (state.isStreaming && state.messages.length > 0) {
      const lastUserMsg = [...state.messages].reverse().find(m => m.isUser)
      if (lastUserMsg?.text) {
        startStream({
          idea: lastUserMsg.text,
          conversationHistory: state.conversationHistory,
          currentScorecard: state.scorecard,
          turnNumber: state.turnNumber,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isStreaming, state.messages.length])

  const handleSubmit = useCallback((text: string) => {
    if (state.phase === 'input') {
      submitIdea(text)
    } else {
      userReply(text)
    }
  }, [state.phase, submitIdea, userReply])

  const handleReset = useCallback(() => {
    abort()
    reset()
  }, [abort, reset])

  // When in embedded/workflow mode and phase is 'result', auto-fire onComplete
  const handleWorkflowComplete = useCallback(() => {
    if (onComplete) {
      onComplete({
        id: `iv-${Date.now()}`,
        projectIdea: state.idea,
      })
    }
  }, [onComplete, state.idea])

  // Result phase
  if (state.phase === 'result') {
    return (
      <ResultSummary
        idea={state.idea}
        scorecard={state.scorecard}
        messages={state.messages}
        onReset={handleReset}
        onComplete={onComplete ? handleWorkflowComplete : undefined}
      />
    )
  }

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Chat Panel - Main Area */}
      <div className="flex-1 min-w-0">
        <ChatPanel
          messages={state.messages}
          isStreaming={state.isStreaming}
          phase={state.phase}
          error={state.error}
          onSubmit={handleSubmit}
          onReset={handleReset}
        />
      </div>

      {/* Scorecard Panel - Sidebar */}
      {state.phase !== 'input' && (
        <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-border">
          <ScorecardPanel
            scorecard={state.scorecard}
            turnNumber={state.turnNumber}
            latestUpdates={
              state.messages
                .filter(m => m.categoryUpdates)
                .at(-1)?.categoryUpdates || []
            }
          />
        </div>
      )}
    </div>
  )
}
