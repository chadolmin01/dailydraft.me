import type { UserRecommendation } from '@/src/hooks/useUserRecommendations'

export interface ProjectCard {
  id: string
  title: string
  desc: string
  roles: string[]
  tags: string[]
  coverImage: string | null
  daysLeft: number
  updatedAt?: string
  status: string | null
  matchLabel?: string | null
  badges?: string[] | null
}

export interface TalentCard {
  id: string
  name: string
  role: string
  tags: string[]
  status: 'OPEN' | 'BUSY' | 'ADVISOR' | string
  visionSummary?: string | null
  location?: string | null
  avatarUrl?: string | null
  matchScore?: number | null
  matchReason?: string | null
  badges?: string[] | null
}

export interface CategoryItem {
  id: string
  label: string
  count: number
  icon: React.ElementType
}

export interface TrendingTag {
  tag: string
  count: number
}

export type SortBy = 'latest' | 'popular' | 'trending' | 'ai'
export type TypeFilter = 'all' | 'side_project' | 'startup' | 'study'
export type SearchScope = 'all' | 'projects' | 'people' | 'skills'
export type ActiveTab = 'projects' | 'people'
export type PeopleRoleFilter = 'all' | 'developer' | 'designer' | 'pm' | 'marketer'
export type PeopleSortBy = 'latest' | 'ai' | 'popular'

export type { UserRecommendation }
