// Category definitions for Explore page filters

export const FALLBACK_CATEGORIES = [
  { id: 'all', label: '전체', count: 0 },
  { id: 'AI/ML', label: 'AI/ML', count: 0 },
  { id: '웹/앱 개발', label: '웹/앱 개발', count: 0 },
  { id: '핀테크', label: '핀테크', count: 0 },
  { id: '헬스케어', label: '헬스케어', count: 0 },
  { id: '소셜/커뮤니티', label: '소셜/커뮤니티', count: 0 },
] as const

export const FALLBACK_TRENDING_TAGS: { tag: string; count: number }[] = []
