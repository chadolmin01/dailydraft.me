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
  /** 각 포인트(1~N)에 대한 한줄 코멘트. 선택 시 표시. */
  comments?: string[]
}

export type InteractiveQuestion =
  | ScenarioCardQuestion
  | ThisOrThatQuestion
  | DragRankQuestion
  | EmojiGridQuestion
  | QuickNumberQuestion
  | SpectrumPickQuestion

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
  // Phase 1-a: 학생 신원 (이메일 도메인으로 감지 + 학번 수기).
  // 재학생 경로에서만 채워지며, 비-학생/졸업생은 비움.
  studentId?: string
  department?: string
  universityId?: string
  entranceYear?: number
}
