import { LayoutGrid, Users, Sparkles, Zap, Star, Flame, Clock, FolderOpen, User, Code2 } from 'lucide-react'

export const CATEGORY_ICONS: Record<string, React.ElementType> = {
  all: LayoutGrid,
  'AI/ML': Sparkles,
  SaaS: Zap,
  Fintech: Star,
  HealthTech: Zap,
  Social: Users,
}

export const TABS = [
  { id: 'projects', label: '프로젝트', icon: LayoutGrid },
  { id: 'people', label: '사람', icon: Users },
] as const

export const SORT_OPTIONS = [
  { id: 'trending', label: '트렌딩', icon: Flame },
  { id: 'latest', label: '최신', icon: Clock },
  { id: 'popular', label: '인기', icon: Star },
] as const

export const TYPE_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'side_project', label: '사이드프로젝트' },
  { id: 'startup', label: '스타트업' },
  { id: 'study', label: '스터디' },
] as const

export const SEARCH_SCOPES = [
  { id: 'all', label: '전체', icon: LayoutGrid, desc: '모든 결과' },
  { id: 'projects', label: '프로젝트', icon: FolderOpen, desc: '제목·설명' },
  { id: 'people', label: '사람', icon: User, desc: '이름·포지션' },
  { id: 'skills', label: '기술 스택', icon: Code2, desc: '기술·역할' },
] as const

export const HERO_SLIDE_COUNT = 3
export const PAGE_SIZE = 12
export const PEOPLE_PAGE_SIZE = 12

export function getUpdateBadge(updatedAt: string | undefined): string | null {
  if (!updatedAt) return null
  const daysAgo = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
  if (daysAgo <= 7) return daysAgo === 0 ? '오늘 업데이트' : `${daysAgo}일 전 업데이트`
  return null
}

export function getMatchColorClass(score: number): string {
  if (score >= 80) return 'bg-status-success-bg text-status-success-text'
  if (score >= 60) return 'bg-tag-default-bg text-tag-default-text'
  return 'bg-surface-sunken text-txt-tertiary'
}
