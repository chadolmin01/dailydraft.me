/**
 * Explore 페이지 전용 상수.
 * 카테고리/역할/유형 등 공통 상수는 @/src/constants에서 파생.
 */
import { LayoutGrid, Users, Sparkles, Star, Flame, Clock, FolderOpen, User, Code2, TrendingUp, Building2 } from 'lucide-react'
import { PROJECT_CATEGORIES } from '@/src/constants/categories'
import { PROJECT_ROLES, PEOPLE_CATEGORY_ICONS } from '@/src/constants/roles'
import { PROJECT_TYPES } from '@/src/constants/project'

/* ── 카테고리/역할: @/src/constants 에서 파생 ─────────────── */

/** Explore 사이드바 아이콘 맵 (slug → icon) */
export const CATEGORY_ICONS: Record<string, React.ElementType> = Object.fromEntries(
  [['all', LayoutGrid], ...PROJECT_CATEGORIES.map(c => [c.slug, c.icon])]
)

export { PEOPLE_CATEGORY_ICONS }

/** 유형 필터 (전체 + PROJECT_TYPES) */
export const TYPE_FILTERS = [
  { id: 'all', label: '전체' },
  ...PROJECT_TYPES.map(t => ({ id: t.value, label: t.label })),
]

/**
 * 프로젝트 역할 필터.
 * DB가 slug로 통일됨 → id=slug, 키워드 매칭 불필요.
 */
export const PROJECT_ROLE_FILTERS = [
  { id: 'all', label: '전체' },
  ...PROJECT_ROLES.map(r => ({ id: r.slug, label: r.filterLabel })),
]

/**
 * 사람 역할 필터.
 * positionSlugs: 이 역할에 해당하는 포지션 slug 목록 (desired_position 매칭용).
 */
export const PEOPLE_ROLE_FILTERS = [
  { id: 'all', label: '전체' },
  ...PROJECT_ROLES.map(r => ({ id: r.slug, label: r.label, positionSlugs: r.positionSlugs })),
]

/* ── Explore 전용 상수 (변경 없음) ────────────────────────── */

export const TABS = [
  { id: 'projects', label: '프로젝트', icon: LayoutGrid },
  { id: 'people', label: '사람', icon: Users },
  { id: 'clubs', label: '클럽', icon: Building2 },
] as const

export const CLUBS_PAGE_SIZE = 20

export const SORT_OPTIONS = [
  { id: 'ai', label: 'AI 추천', icon: Sparkles, beta: false },
  { id: 'trending', label: '트렌딩', icon: Flame, beta: false },
  { id: 'latest', label: '최신', icon: Clock, beta: false },
  { id: 'popular', label: '인기', icon: Star, beta: false },
] as const

export const PEOPLE_SORT_OPTIONS = [
  { id: 'ai', label: 'AI 추천', icon: Sparkles, beta: false },
  { id: 'latest', label: '최신', icon: Clock, beta: false },
  { id: 'popular', label: '인기', icon: TrendingUp, beta: false },
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
