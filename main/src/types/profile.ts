export type CurrentSituation = 'solo' | 'has_project' | 'want_to_join'

export interface Skill {
  name: string
  level: '초급' | '중급' | '고급'
}

export interface Personality {
  risk?: number // 위험 감수 수준 (1-10)
  time?: number // 시간 투자 가능량 (1-10)
  communication?: number // 커뮤니케이션 스타일 (1-10)
  decision?: number // 의사결정 스타일 (1-10)
}

export interface Profile {
  id: string
  user_id: string
  current_situation: CurrentSituation | null
  nickname: string
  age_range: string | null
  university: string | null
  major: string | null
  graduation_year: number | null
  location: string | null
  skills: Skill[]
  interest_tags: string[]
  desired_position: string | null
  personality: Personality
  vision_summary: string | null
  vision_embedding: number[] | null
  ai_chat_completed: boolean
  ai_chat_transcript: ChatMessage[]
  contact_email: string | null
  contact_kakao: string | null
  profile_visibility: 'public' | 'private'
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}
