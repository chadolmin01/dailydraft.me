import { PROJECT_CATEGORIES } from '@/src/constants/categories'

/** Explore 필터용 카테고리 (slug 기반, @/src/constants에서 파생) */
export const FALLBACK_CATEGORIES = [
  { id: 'all', label: '전체', count: 0 },
  ...PROJECT_CATEGORIES.map(c => ({ id: c.slug, label: c.label, count: 0 })),
]

export const FALLBACK_TRENDING_TAGS: { tag: string; count: number }[] = []
