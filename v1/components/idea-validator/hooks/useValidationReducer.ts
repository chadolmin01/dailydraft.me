import { useReducer, useCallback } from 'react'
import {
  ChatMessage,
  Scorecard,
  DiscussionTurn,
  PersonaResponse,
  AnalysisMetrics,
  CategoryUpdate,
  createEmptyScorecard,
} from '../types'

export type Phase = 'input' | 'analyzing' | 'discussion' | 'result'

export interface State {
  phase: Phase
  idea: string
  messages: ChatMessage[]
  scorecard: Scorecard
  turnNumber: number
  isStreaming: boolean
  error: string | null
  conversationHistory: string[]
}

export type Action =
  | { type: 'SUBMIT_IDEA'; idea: string }
  | { type: 'STREAM_OPINION'; persona: string; message: string }
  | { type: 'STREAM_SYNTHESIZING' }
  | { type: 'STREAM_DISCUSSION'; turn: DiscussionTurn }
  | { type: 'STREAM_FINAL'; data: { responses: PersonaResponse[]; metrics: AnalysisMetrics; scorecard: Scorecard; categoryUpdates: CategoryUpdate[] } }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'SET_WARNING'; warning: string }
  | { type: 'USER_REPLY'; text: string }
  | { type: 'FINISH' }
  | { type: 'RESET' }

function createId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SUBMIT_IDEA':
      return {
        ...state,
        phase: 'analyzing',
        idea: action.idea,
        isStreaming: true,
        error: null,
        messages: [
          ...state.messages,
          { id: createId(), isUser: true, text: action.idea, timestamp: Date.now() },
        ],
      }

    case 'STREAM_OPINION': {
      // Add opinion as a persona message
      const opinionMsg: ChatMessage = {
        id: createId(),
        isUser: false,
        persona: action.persona,
        personaMessage: action.message,
        timestamp: Date.now(),
        streamPhase: 'opinion',
      }
      return {
        ...state,
        phase: 'analyzing',
        messages: [...state.messages, opinionMsg],
      }
    }

    case 'STREAM_SYNTHESIZING':
      return {
        ...state,
        messages: [
          ...state.messages,
          { id: createId(), isUser: false, text: 'AI가 토론을 종합하고 있습니다...', timestamp: Date.now(), isStreaming: true, streamPhase: 'synthesizing' },
        ],
      }

    case 'STREAM_DISCUSSION': {
      // Remove synthesizing message if present, then add discussion turn
      const filtered = state.messages.filter(m => m.streamPhase !== 'synthesizing')
      const existingDiscussion = filtered.find(m => m.streamPhase === 'discussion' && !m.isUser)
      if (existingDiscussion) {
        // Append to existing discussion message
        return {
          ...state,
          phase: 'discussion',
          messages: filtered.map(m =>
            m.id === existingDiscussion.id
              ? { ...m, discussion: [...(m.discussion || []), action.turn] }
              : m
          ),
        }
      }
      // Create new discussion message
      return {
        ...state,
        phase: 'discussion',
        messages: [
          ...filtered,
          { id: createId(), isUser: false, discussion: [action.turn], timestamp: Date.now(), streamPhase: 'discussion' },
        ],
      }
    }

    case 'STREAM_FINAL': {
      const { responses, metrics, scorecard, categoryUpdates } = action.data
      // Add final summary message
      const finalMsg: ChatMessage = {
        id: createId(),
        isUser: false,
        responses,
        metrics,
        scorecard,
        categoryUpdates,
        timestamp: Date.now(),
        streamPhase: 'final',
      }
      return {
        ...state,
        phase: 'discussion',
        scorecard,
        messages: [...state.messages, finalMsg],
        turnNumber: state.turnNumber + 1,
        isStreaming: false,
      }
    }

    case 'SET_ERROR':
      return { ...state, error: action.error, isStreaming: false }

    case 'SET_WARNING':
      return {
        ...state,
        isStreaming: false,
        messages: [
          ...state.messages,
          { id: createId(), isUser: false, text: action.warning, timestamp: Date.now() },
        ],
      }

    case 'USER_REPLY':
      return {
        ...state,
        phase: 'analyzing',
        isStreaming: true,
        error: null,
        messages: [
          ...state.messages,
          { id: createId(), isUser: true, text: action.text, timestamp: Date.now() },
        ],
        conversationHistory: [
          ...state.conversationHistory,
          `사용자: ${action.text}`,
        ],
      }

    case 'FINISH':
      return { ...state, phase: 'result', isStreaming: false }

    case 'RESET':
      return createInitialState()

    default:
      return state
  }
}

function createInitialState(): State {
  return {
    phase: 'input',
    idea: '',
    messages: [],
    scorecard: createEmptyScorecard(),
    turnNumber: 1,
    isStreaming: false,
    error: null,
    conversationHistory: [],
  }
}

export function useValidationReducer() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)

  const submitIdea = useCallback((idea: string) => {
    dispatch({ type: 'SUBMIT_IDEA', idea })
  }, [])

  const userReply = useCallback((text: string) => {
    dispatch({ type: 'USER_REPLY', text })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  return { state, dispatch, submitIdea, userReply, reset }
}
