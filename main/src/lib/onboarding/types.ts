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
  | 'interactive-element'

export interface Bubble {
  id: string
  role: 'ai' | 'user'
  content: string
  attachment?: BubbleAttachment
  offTopic?: boolean
  interactiveConfig?: InteractiveElementConfig
  answered?: boolean
}

// ── Interactive Elements ──

export type InteractiveElementType =
  | 'scenario-card'
  | 'this-or-that'
  | 'drag-rank'
  | 'emoji-grid'
  | 'quick-number'
  | 'spectrum-pick'

export interface InteractiveElementConfig {
  type: InteractiveElementType
  questionId: string
  measuredFields: string[]
}

export interface StructuredResponse {
  questionId: string
  type: InteractiveElementType
  value: unknown
  naturalLanguage: string
  measuredFields: string[]
  scoreMappings?: Record<string, number>
}

export interface ScenarioOption {
  id: string
  icon: string
  label: string
  description: string
  scores: Record<string, number>
}

export interface ThisOrThatOption {
  id: string
  emoji: string
  label: string
  description: string
  scores: Record<string, number>
}

export interface DragRankItem {
  id: string
  label: string
  emoji: string
}

export interface EmojiGridOption {
  id: string
  emoji: string
  label: string
}

export interface QuickNumberPreset {
  label: string
  value: number
}

export interface InteractiveQuestionBase {
  type: InteractiveElementType
  measuredFields: string[]
}

export interface ScenarioCardQuestion extends InteractiveQuestionBase {
  type: 'scenario-card'
  options: ScenarioOption[]
}

export interface ThisOrThatQuestion extends InteractiveQuestionBase {
  type: 'this-or-that'
  optionA: ThisOrThatOption
  optionB: ThisOrThatOption
}

export interface DragRankQuestion extends InteractiveQuestionBase {
  type: 'drag-rank'
  items: DragRankItem[]
}

export interface EmojiGridQuestion extends InteractiveQuestionBase {
  type: 'emoji-grid'
  options: EmojiGridOption[]
  minSelect: number
  maxSelect: number
}

export interface QuickNumberQuestion extends InteractiveQuestionBase {
  type: 'quick-number'
  presets: QuickNumberPreset[]
  unit: string
  subQuestion?: { question: string; yesLabel: string; noLabel: string }
}

export interface SpectrumPickQuestion extends InteractiveQuestionBase {
  type: 'spectrum-pick'
  leftLabel: string
  leftDescription: string
  rightLabel: string
  rightDescription: string
  points: number
}

export type InteractiveQuestion =
  | ScenarioCardQuestion
  | ThisOrThatQuestion
  | DragRankQuestion
  | EmojiGridQuestion
  | QuickNumberQuestion
  | SpectrumPickQuestion

// ── Deep Chat ──

export interface DeepChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
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
  // Interactive elements
  structuredResponses: StructuredResponse[]
  interactiveElementCount: number
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
  | { type: 'ADD_STRUCTURED_RESPONSE'; response: StructuredResponse }
  | { type: 'SET_BUBBLE_ANSWERED'; bubbleId: string }
  | { type: 'INCREMENT_INTERACTIVE_COUNT' }
