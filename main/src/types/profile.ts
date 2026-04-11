export type CurrentSituation = 'solo' | 'has_project' | 'want_to_join' | 'exploring'

export interface Skill {
  name: string
  level?: string // deprecated, kept for backward compatibility with existing DB data
}

export interface Personality {
  risk?: number // 안정←→도전 (1-5)
  time?: number // 주당 투자 시간 (1-5)
  communication?: number // 조용히 작업←→수시 공유 (1-5)
  planning?: number // 계획부터←→실행부터 (1-5)
  quality?: number // 완성도←→속도 (1-5)
  teamRole?: number // 팔로워←→리더 (1-5)
  decision?: number // @deprecated — planning으로 대체, 기존 데이터 호환용
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
  locations: string[] | null
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
