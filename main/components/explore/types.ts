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
  viewsCount: number
  interestCount: number
}

export interface TalentCard {
  id: string
  name: string
  role: string
  tags: string[]
  status: 'OPEN' | 'BUSY' | 'ADVISOR' | string
  visionSummary?: string | null
  locations?: string | null
  avatarUrl?: string | null
  matchScore?: number | null
  matchReason?: string | null
  badges?: string[] | null
  interestCount: number
  university?: string | null
  affiliationType?: string | null
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
export type ActiveTab = 'projects' | 'people' | 'clubs'

export interface ClubCard {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  category: string | null
  member_count: number
}
export type PeopleRoleFilter = 'all' | 'developer' | 'designer' | 'pm' | 'marketer' | 'data'
export type ProjectRoleFilter = 'all' | 'developer' | 'designer' | 'pm' | 'marketer' | 'data'
export type PeopleSortBy = 'latest' | 'ai' | 'popular'

export interface ActiveFilterChip {
  key: string        // 'type:side_project', 'role:디자이너' etc.
  label: string      // '함께 만들기', '디자이너 구함' etc.
  onRemove: () => void
}

export type { UserRecommendation }
