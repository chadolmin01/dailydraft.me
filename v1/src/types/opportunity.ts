import type { Tables } from './database'

// Re-export the DB Opportunity type as the canonical Opportunity type
export type Opportunity = Tables<'opportunities'>

// Narrowed union types for use in UI forms and validation
export type OpportunityType = 'side_project' | 'startup' | 'study'
export type LocationType = 'remote' | 'hybrid' | 'onsite'
export type TimeCommitment = 'part_time' | 'full_time'
export type CompensationType = 'equity' | 'salary' | 'unpaid' | 'hybrid'
export type OpportunityStatus = 'active' | 'closed' | 'filled'

export interface ProjectLink {
  type: 'github' | 'notion' | 'website' | 'other'
  url: string
  label?: string
}

// Opportunity with creator profile info (joined query)
export interface OpportunityWithCreator extends Opportunity {
  creator?: {
    id: string
    nickname: string
    user_id: string
    skills?: unknown
    location?: string | null
    contact_email?: string | null
    desired_position?: string | null
    university?: string | null
    interest_tags?: string[] | null
  } | null
  club?: {
    id: string
    slug: string
    name: string
    logo_url: string | null
  } | null
}

// Opportunity with AI match scoring
export interface OpportunityWithMatch extends Opportunity {
  match_score?: number
  match_reason?: string
}

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected'

export interface PortfolioLink {
  type: 'github' | 'linkedin' | 'website' | 'behance' | 'other'
  url: string
  label?: string
}

export interface Application {
  id: string
  opportunity_id: string
  applicant_id: string
  intro: string
  why_apply: string
  portfolio_links: PortfolioLink[]
  match_score: number | null
  match_reason: string | null
  status: ApplicationStatus
  created_at: string
  updated_at: string
}

export interface AcceptedConnection {
  id: string
  application_id: string
  opportunity_creator_id: string
  applicant_id: string
  connected_at: string
}
