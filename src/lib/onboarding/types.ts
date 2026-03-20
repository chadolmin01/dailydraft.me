import type { LucideIcon } from 'lucide-react'

// ── Steps ──

export type Step =
  | 'greeting' | 'cta' | 'info' | 'position' | 'situation'
  | 'skills-input' | 'skills-confirm'
  | 'interests-input' | 'interests-confirm'
  | 'deep-chat-offer' | 'deep-chat'
  | 'done'

// ── Chat Bubbles ──

export type BubbleAttachment =
  | 'cta' | 'info-form' | 'position' | 'situation'
  | 'skills-input' | 'skills-confirm'
  | 'interests-input' | 'interests-confirm'
  | 'deep-chat-offer' | 'deep-chat-offer-finish'

export interface Bubble {
  id: string
  role: 'ai' | 'user'
  content: string
  attachment?: BubbleAttachment
}

// ── Deep Chat ──

export interface DeepChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface DeepChatTopic {
  id: string
  label: string
  icon: LucideIcon
  keywords: string[]
}

// ── Profile Draft ──

export interface ProfileDraft {
  name: string
  affiliationType: string
  university: string
  major: string
  locations: string[]
  position: string
  situation: string
  skills: string[]
  interests: string[]
}

// ── Reducer State ──

export interface OnboardingState {
  step: Step
  stepHistory: Step[]
  bubbles: Bubble[]
  profile: ProfileDraft
  isTyping: boolean
  isSaving: boolean
  saveError: string | null
  mounted: boolean
  deepChatTransition: boolean
  // Free-text inputs
  skillInput: string
  interestInput: string
  // Deep chat
  deepChatInput: string
  deepChatMessages: DeepChatMessage[]
  showSuggestions: boolean
  // AI activity label
  aiActivity: string | null
  // Rotating tip
  tipIndex: number
  // Dynamic suggestions from AI
  dynamicSuggestions: string[]
}

// ── Reducer Actions ──

export type OnboardingAction =
  | { type: 'SET_STEP'; step: Step }
  | { type: 'PUSH_STEP'; step: Step }
  | { type: 'GO_BACK' }
  | { type: 'ADD_BUBBLE'; bubble: Bubble }
  | { type: 'SET_BUBBLES'; bubbles: Bubble[] }
  | { type: 'REMOVE_BUBBLES_BY_ATTACHMENT'; attachment: BubbleAttachment }
  | { type: 'TRIM_BUBBLES_TO_LAST_USER' }
  | { type: 'SET_PROFILE'; profile: Partial<ProfileDraft> }
  | { type: 'TOGGLE_SKILL'; skill: string }
  | { type: 'REMOVE_SKILL'; skill: string }
  | { type: 'SET_SKILLS'; skills: string[] }
  | { type: 'TOGGLE_INTEREST'; tag: string }
  | { type: 'REMOVE_INTEREST'; tag: string }
  | { type: 'SET_INTERESTS'; interests: string[] }
  | { type: 'SET_TYPING'; isTyping: boolean }
  | { type: 'SET_SAVING'; isSaving: boolean }
  | { type: 'SET_SAVE_ERROR'; error: string | null }
  | { type: 'SET_MOUNTED' }
  | { type: 'SET_DEEP_CHAT_TRANSITION'; value: boolean }
  | { type: 'SET_SKILL_INPUT'; value: string }
  | { type: 'SET_INTEREST_INPUT'; value: string }
  | { type: 'SET_DEEP_CHAT_INPUT'; value: string }
  | { type: 'SET_DEEP_CHAT_MESSAGES'; messages: DeepChatMessage[] }
  | { type: 'ADD_DEEP_CHAT_MESSAGE'; message: DeepChatMessage }
  | { type: 'SET_SHOW_SUGGESTIONS'; value: boolean }
  | { type: 'SET_AI_ACTIVITY'; label: string | null }
  | { type: 'SET_TIP_INDEX'; index: number }
  | { type: 'SET_DYNAMIC_SUGGESTIONS'; suggestions: string[] }
