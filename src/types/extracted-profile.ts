export interface ExtractedProfile {
  role: string
  experience_level: string | null
  preferred_market: 'B2B' | 'B2C' | 'B2B2C' | null
  decision_style: string | null
  skills: string[]
  tools: string[]
  personality_tags: string[]
  collaboration_preference: string | null
  extraction_version: string
  extracted_at: string
}

export interface ProfileExtractionRequest {
  conversationHistory: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

export interface ProfileExtractionResponse {
  success: boolean
  profile?: ExtractedProfile
  confidence?: number
  error?: string
}
