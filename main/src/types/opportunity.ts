import type { Skill } from './profile'

export type OpportunityType = 'team_building' | 'project_join'
export type LocationType = 'remote' | 'hybrid' | 'onsite'
export type TimeCommitment = 'part_time' | 'full_time'
export type CompensationType = 'equity' | 'salary' | 'unpaid' | 'hybrid'
export type OpportunityStatus = 'active' | 'closed' | 'filled'

export interface ProjectLink {
  type: 'github' | 'notion' | 'website' | 'other'
  url: string
  label?: string
}

export interface Opportunity {
  id: string
  creator_id: string
  type: OpportunityType
  title: string
  description: string
  needed_roles: string[]
  needed_skills: Skill[]
  interest_tags: string[]
  location_type: LocationType | null
  location: string | null
  time_commitment: TimeCommitment | null
  compensation_type: CompensationType | null
  compensation_details: string | null
  project_links: ProjectLink[]
  demo_images: string[]
  vision_embedding: number[] | null
  status: OpportunityStatus
  views_count: number
  applications_count: number
  created_at: string
  updated_at: string
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

export interface OpportunityWithMatch extends Opportunity {
  match_score?: number
  match_reason?: string
}
