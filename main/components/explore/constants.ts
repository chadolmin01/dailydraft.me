import { LayoutGrid, Users, Sparkles, Zap, Star, Flame, Clock, FolderOpen, User, Code2, TrendingUp, Palette, ClipboardList, Megaphone, GraduationCap, ShoppingBag, Video, Gamepad2, Leaf } from 'lucide-react'

export const CATEGORY_ICONS: Record<string, React.ElementType> = {
  all: LayoutGrid,
  'AI/ML': Sparkles,
  '웹/앱 개발': Code2,
  '핀테크': Star,
  '헬스케어': Zap,
  '소셜/커뮤니티': Users,
  '교육/에듀테크': GraduationCap,
  '커머스/F&B': ShoppingBag,
  '콘텐츠/미디어': Video,
  '게임/엔터': Gamepad2,
  '환경/ESG': Leaf,
}

export const PEOPLE_CATEGORY_ICONS: Record<string, React.ElementType> = {
  all: Users,
  developer: Code2,
  designer: Palette,
  pm: ClipboardList,
  marketer: Megaphone,
}

export const TABS = [
  { id: 'projects', label: '프로젝트', icon: LayoutGrid },
  { id: 'people', label: '사람', icon: Users },
] as const

export const SORT_OPTIONS = [
  { id: 'ai', label: 'AI 추천', icon: Sparkles, beta: false },
  { id: 'trending', label: '트렌딩', icon: Flame, beta: false },
  { id: 'latest', label: '최신', icon: Clock, beta: false },
  { id: 'popular', label: '인기', icon: Star, beta: false },
] as const

export const TYPE_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'side_project', label: '함께 만들기' },
  { id: 'startup', label: '창업 준비' },
  { id: 'study', label: '함께 배우기' },
] as const

export const PEOPLE_ROLE_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'developer', label: '개발자', keywords: ['개발', 'developer', 'engineer', 'frontend', 'backend', 'fullstack', 'ios', 'android', 'web'] },
  { id: 'designer', label: '디자이너', keywords: ['디자인', 'designer', 'ux', 'ui', 'graphic', '그래픽'] },
  { id: 'pm', label: '기획자', keywords: ['기획', 'pm', 'product', 'planner', '매니저', 'manager'] },
  { id: 'marketer', label: '마케터', keywords: ['마케팅', 'marketer', 'marketing', 'growth', '그로스'] },
] as const

export const PROJECT_ROLE_FILTERS = [
  { id: 'all', label: '전체' },
  { id: '개발자', label: '개발자 구함', keywords: ['개발', '프론트엔드', '백엔드', '풀스택'] },
  { id: '디자이너', label: '디자이너 구함', keywords: ['디자이너', '디자인', 'UX', 'UI'] },
  { id: '기획자', label: '기획자 구함', keywords: ['기획', 'PM', 'PO'] },
  { id: '마케터', label: '마케터 구함', keywords: ['마케팅', '마케터'] },
  { id: '데이터분석', label: '데이터 구함', keywords: ['데이터', '분석'] },
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
