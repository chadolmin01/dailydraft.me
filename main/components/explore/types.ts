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
  /** AI 매치 점수 0~100. 비로그인/추천 부족 시 null. */
  matchScore?: number | null
  /** 매치 이유 텍스트 — tooltip 등에서 노출. */
  matchReason?: string | null
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
  /** 4차원 점수 breakdown — 왜 이 점수인지 설명용. 매칭 투명성 ↑ */
  matchDetails?: { skill: number; interest: number; situation: number; teamfit: number } | null
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
  /** 공식 등록 뱃지 (university credential 등). 공개 목록 카드에 "{학교명} 공식 등록" 노출용. */
  badges?: Array<{
    type: string
    university: { name: string; short_name: string | null } | null
  }>
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
