// Category definitions for Explore page filters

export const FALLBACK_CATEGORIES = [
  { id: 'all', label: '전체', count: 0 },
  { id: 'AI/ML', label: 'AI / ML', count: 0 },
  { id: 'SaaS', label: 'SaaS', count: 0 },
  { id: 'Fintech', label: 'Fintech', count: 0 },
  { id: 'HealthTech', label: 'Health', count: 0 },
  { id: 'Social', label: 'Community', count: 0 },
] as const

export const FALLBACK_TRENDING_TAGS: { tag: string; count: number }[] = []
