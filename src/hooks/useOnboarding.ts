import { useReducer, useMemo } from 'react'
import type { OnboardingState, OnboardingAction, ProfileDraft } from '@/src/lib/onboarding/types'
import { DEEP_CHAT_TOPICS, DEEP_CHAT_SUGGESTIONS, ONBOARDING_TIPS } from '@/src/lib/onboarding/constants'

const INITIAL_PROFILE: ProfileDraft = {
  name: '', affiliationType: 'student', university: '', major: '',
  locations: [], position: '', situation: '',
  skills: [], interests: [],
}

const INITIAL_STATE: OnboardingState = {
  step: 'greeting',
  stepHistory: [],
  bubbles: [],
  profile: INITIAL_PROFILE,
  isTyping: false,
  isSaving: false,
  saveError: null,
  mounted: false,
  deepChatTransition: false,
  skillInput: '',
  interestInput: '',
  deepChatInput: '',
  deepChatMessages: [],
  showSuggestions: true,
  aiActivity: null,
  tipIndex: 0,
}

function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step }

    case 'PUSH_STEP':
      return {
        ...state,
        stepHistory: [...state.stepHistory, state.step],
        step: action.step,
      }

    case 'GO_BACK': {
      if (state.stepHistory.length === 0) return state
      const prevStep = state.stepHistory[state.stepHistory.length - 1]
      // Trim bubbles to remove the last user message and everything after
      let lastUserIdx = -1
      for (let i = state.bubbles.length - 1; i >= 0; i--) {
        if (state.bubbles[i].role === 'user') { lastUserIdx = i; break }
      }
      const trimmedBubbles = lastUserIdx === -1 ? state.bubbles : state.bubbles.slice(0, lastUserIdx)
      return {
        ...state,
        step: prevStep,
        stepHistory: state.stepHistory.slice(0, -1),
        bubbles: trimmedBubbles,
      }
    }

    case 'ADD_BUBBLE':
      return { ...state, bubbles: [...state.bubbles, action.bubble] }

    case 'SET_BUBBLES':
      return { ...state, bubbles: action.bubbles }

    case 'REMOVE_BUBBLES_BY_ATTACHMENT':
      return {
        ...state,
        bubbles: state.bubbles.filter(b => b.attachment !== action.attachment),
      }

    case 'TRIM_BUBBLES_TO_LAST_USER': {
      let idx = -1
      for (let i = state.bubbles.length - 1; i >= 0; i--) {
        if (state.bubbles[i].role === 'user') { idx = i; break }
      }
      return { ...state, bubbles: idx === -1 ? state.bubbles : state.bubbles.slice(0, idx) }
    }

    case 'SET_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.profile } }

    case 'TOGGLE_SKILL': {
      const skills = state.profile.skills.includes(action.skill)
        ? state.profile.skills.filter(s => s !== action.skill)
        : [...state.profile.skills, action.skill]
      return { ...state, profile: { ...state.profile, skills } }
    }

    case 'REMOVE_SKILL':
      return {
        ...state,
        profile: { ...state.profile, skills: state.profile.skills.filter(s => s !== action.skill) },
      }

    case 'SET_SKILLS':
      return { ...state, profile: { ...state.profile, skills: action.skills } }

    case 'TOGGLE_INTEREST': {
      const interests = state.profile.interests.includes(action.tag)
        ? state.profile.interests.filter(t => t !== action.tag)
        : [...state.profile.interests, action.tag]
      return { ...state, profile: { ...state.profile, interests } }
    }

    case 'REMOVE_INTEREST':
      return {
        ...state,
        profile: { ...state.profile, interests: state.profile.interests.filter(t => t !== action.tag) },
      }

    case 'SET_INTERESTS':
      return { ...state, profile: { ...state.profile, interests: action.interests } }

    case 'SET_TYPING':
      return { ...state, isTyping: action.isTyping }

    case 'SET_SAVING':
      return { ...state, isSaving: action.isSaving }

    case 'SET_SAVE_ERROR':
      return { ...state, saveError: action.error }

    case 'SET_MOUNTED':
      return { ...state, mounted: true }

    case 'SET_DEEP_CHAT_TRANSITION':
      return { ...state, deepChatTransition: action.value }

    case 'SET_SKILL_INPUT':
      return { ...state, skillInput: action.value }

    case 'SET_INTEREST_INPUT':
      return { ...state, interestInput: action.value }

    case 'SET_DEEP_CHAT_INPUT':
      return { ...state, deepChatInput: action.value }

    case 'SET_DEEP_CHAT_MESSAGES':
      return { ...state, deepChatMessages: action.messages }

    case 'ADD_DEEP_CHAT_MESSAGE':
      return { ...state, deepChatMessages: [...state.deepChatMessages, action.message] }

    case 'SET_SHOW_SUGGESTIONS':
      return { ...state, showSuggestions: action.value }

    case 'SET_AI_ACTIVITY':
      return { ...state, aiActivity: action.label }

    case 'SET_TIP_INDEX':
      // -1 sentinel = auto-increment (avoids stale closure from setInterval)
      return { ...state, tipIndex: action.index === -1 ? (state.tipIndex + 1) % ONBOARDING_TIPS.length : action.index }

    default:
      return state
  }
}

/** Derived values computed from state */
export function useDerivedState(state: OnboardingState) {
  const coveredTopics = useMemo(() => {
    const allText = state.deepChatMessages.map(m => m.content).join(' ')
    return DEEP_CHAT_TOPICS.filter(topic =>
      topic.keywords.some(kw => allText.includes(kw))
    ).map(t => t.id)
  }, [state.deepChatMessages])

  const userMsgCount = useMemo(
    () => state.deepChatMessages.filter(m => m.role === 'user').length,
    [state.deepChatMessages],
  )

  const currentSuggestions = useMemo(() => {
    const idx = Math.min(userMsgCount, Object.keys(DEEP_CHAT_SUGGESTIONS).length - 1)
    return DEEP_CHAT_SUGGESTIONS[idx] || []
  }, [userMsgCount])

  const canGoBack = !['greeting', 'cta', 'info', 'deep-chat', 'done'].includes(state.step)
    && !state.isTyping && !state.isSaving && state.stepHistory.length > 0

  return { coveredTopics, userMsgCount, currentSuggestions, canGoBack }
}

export function useOnboarding() {
  return useReducer(onboardingReducer, INITIAL_STATE)
}
