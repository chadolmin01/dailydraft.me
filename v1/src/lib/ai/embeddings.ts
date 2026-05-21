import { embeddingModel } from './gemini-client'

/**
 * Generate embedding vector from text using Gemini
 * @param text Text to embed
 * @returns 2000-dimensional vector (truncated from 3072 for pgvector compatibility)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(text)
    const embedding = result.embedding

    // Gemini의 embedding은 values 배열에 있음
    if (!embedding || !embedding.values) {
      throw new Error('No embedding values returned')
    }

    // gemini-embedding-001은 3072차원, pgvector ivfflat 인덱스 제한이 2000차원
    const MAX_DIMENSIONS = 2000
    return embedding.values.slice(0, MAX_DIMENSIONS)
  } catch (error) {
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate embedding from profile data
 * @param profile Profile data
 * @returns Embedding vector
 */
export async function generateProfileEmbedding(profile: {
  visionSummary?: string
  skills?: Array<{ name: string; level: string }>
  interestTags?: string[]
  desiredPosition?: string
}): Promise<number[]> {
  const parts: string[] = []

  if (profile.visionSummary) {
    parts.push(`Vision: ${profile.visionSummary}`)
  }

  if (profile.skills && profile.skills.length > 0) {
    const skillsText = profile.skills.map((s) => `${s.name} (${s.level})`).join(', ')
    parts.push(`Skills: ${skillsText}`)
  }

  if (profile.interestTags && profile.interestTags.length > 0) {
    parts.push(`Interests: ${profile.interestTags.join(', ')}`)
  }

  if (profile.desiredPosition) {
    parts.push(`Position: ${profile.desiredPosition}`)
  }

  const text = parts.join('\n')
  return generateEmbedding(text)
}

/**
 * Generate embedding from opportunity data
 * @param opportunity Opportunity data
 * @returns Embedding vector
 */
export async function generateOpportunityEmbedding(opportunity: {
  title: string
  description: string
  neededRoles?: string[]
  neededSkills?: Array<{ name: string; level: string }>
  interestTags?: string[]
}): Promise<number[]> {
  const parts: string[] = []

  parts.push(`Title: ${opportunity.title}`)
  parts.push(`Description: ${opportunity.description}`)

  if (opportunity.neededRoles && opportunity.neededRoles.length > 0) {
    parts.push(`Needed Roles: ${opportunity.neededRoles.join(', ')}`)
  }

  if (opportunity.neededSkills && opportunity.neededSkills.length > 0) {
    const skillsText = opportunity.neededSkills.map((s) => `${s.name} (${s.level})`).join(', ')
    parts.push(`Needed Skills: ${skillsText}`)
  }

  if (opportunity.interestTags && opportunity.interestTags.length > 0) {
    parts.push(`Tags: ${opportunity.interestTags.join(', ')}`)
  }

  const text = parts.join('\n')
  return generateEmbedding(text)
}

/**
 * Generate embedding from startup event data
 * @param event Event data
 * @returns Embedding vector
 */
export async function generateEventEmbedding(event: {
  title: string
  organizer: string
  event_type: string
  description: string | null
  interest_tags: string[]
}): Promise<number[]> {
  const parts: string[] = []

  parts.push(`Title: ${event.title}`)
  parts.push(`Organizer: ${event.organizer}`)
  parts.push(`Type: ${event.event_type}`)

  if (event.description) {
    const truncated = event.description.substring(0, 1000)
    parts.push(`Description: ${truncated}`)
  }

  if (event.interest_tags.length > 0) {
    parts.push(`Tags: ${event.interest_tags.join(', ')}`)
  }

  const text = parts.join('\n')
  return generateEmbedding(text)
}
