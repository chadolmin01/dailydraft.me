/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  PROJECT CATEGORIES — 단일 진실의 원천 (Single Source of Truth)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 *  DB에는 slug(영문 ID)만 저장됩니다.
 *  한글 라벨은 이 파일에서만 관리하며, 라벨을 변경해도 DB에 영향 없음.
 *
 *  저장 예시:
 *    profiles.interest_tags  = ['ai-ml', 'edu', 'commerce']
 *    opportunities.interest_tags = ['web-app', 'social']
 *
 *  사용처:
 *    - 온보딩: 관심 분야 선택 (InterestsStep)
 *    - 프로젝트 생성/수정: 카테고리 태그 칩 (projects/new, projects/[id]/edit)
 *    - Explore: 분야 필터 (FilterSheet, ExploreSidebar)
 *
 *  새 카테고리 추가 시:
 *    1. 이 배열에 항목 추가
 *    2. 끝. 모든 UI가 자동 반영됨.
 *
 *  카테고리 삭제 시:
 *    1. 이 배열에서 제거
 *    2. DB 마이그레이션으로 기존 데이터 정리
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import {
  Sparkles, Code2, Users, GraduationCap, ShoppingBag,
  Video, Star, Zap, Gamepad2, Leaf, BarChart3, Palette,
  Cpu, Trophy, FolderOpen,
} from 'lucide-react'

export interface CategoryDef {
  /** DB 저장용 영문 slug. 절대 변경 금지 — 변경 시 DB 마이그레이션 필요 */
  slug: string
  /** UI 표시용 한글 라벨. 자유롭게 변경 가능 */
  label: string
  /** lucide-react 아이콘 */
  icon: React.ElementType
}

/**
 * 전체 카테고리 목록.
 * slug는 DB에 저장되므로 함부로 바꾸지 말 것.
 * label, icon은 언제든 변경 가능.
 */
export const PROJECT_CATEGORIES: CategoryDef[] = [
  { slug: 'ai-ml',     label: 'AI/ML',         icon: Sparkles },
  { slug: 'web-app',   label: '웹/앱 개발',     icon: Code2 },
  { slug: 'social',    label: '소셜/커뮤니티',   icon: Users },
  { slug: 'edu',       label: '교육/에듀테크',   icon: GraduationCap },
  { slug: 'commerce',  label: '커머스/F&B',     icon: ShoppingBag },
  { slug: 'content',   label: '콘텐츠/미디어',   icon: Video },
  { slug: 'fintech',   label: '핀테크',         icon: Star },
  { slug: 'health',    label: '헬스케어',        icon: Zap },
  { slug: 'game',      label: '게임/엔터',       icon: Gamepad2 },
  { slug: 'esg',       label: '환경/ESG',       icon: Leaf },
  { slug: 'data',      label: '데이터분석',      icon: BarChart3 },
  { slug: 'design-ux', label: '디자인/UX',      icon: Palette },
  { slug: 'hardware',  label: '하드웨어/IoT',    icon: Cpu },
  { slug: 'contest',   label: '공모전/해커톤',   icon: Trophy },
  { slug: 'portfolio', label: '포트폴리오',      icon: FolderOpen },
]

/* ── 헬퍼 ──────────────────────────────────────────────────── */

/** slug → CategoryDef 빠른 조회 맵 */
export const CATEGORY_MAP = new Map(
  PROJECT_CATEGORIES.map(c => [c.slug, c])
)

/** slug → label 변환. 못 찾으면 slug 그대로 반환 */
export function categoryLabel(slug: string): string {
  return CATEGORY_MAP.get(slug)?.label ?? slug
}

/** slug → icon 변환. 못 찾으면 기본 아이콘 반환 */
export function categoryIcon(slug: string): React.ElementType {
  return CATEGORY_MAP.get(slug)?.icon ?? FolderOpen
}

/** label 배열만 추출 (온보딩 빠른 선택 등) */
export const CATEGORY_SLUGS = PROJECT_CATEGORIES.map(c => c.slug)
export const CATEGORY_LABELS = PROJECT_CATEGORIES.map(c => c.label)

/**
 * 마이그레이션용: 기존 한글 태그 → 새 slug 변환 맵.
 * DB 마이그레이션 SQL과 동일한 매핑이어야 함.
 * 마이그레이션 완료 후에도 유지 — 혹시 모를 하위 호환에 사용.
 */
export const LEGACY_TAG_TO_SLUG: Record<string, string> = {
  'AI/ML':          'ai-ml',
  '웹/앱 개발':      'web-app',
  '소셜/커뮤니티':    'social',
  '교육/에듀테크':    'edu',
  '에듀테크':        'edu',
  '커머스/F&B':      'commerce',
  '커머스':          'commerce',
  '콘텐츠/미디어':    'content',
  '핀테크':          'fintech',
  '헬스케어':        'health',
  '게임/엔터':       'game',
  '게임':           'game',
  '환경/ESG':       'esg',
  '데이터분석':      'data',
  '디자인/UX':      'design-ux',
  '하드웨어/IoT':    'hardware',
  '공모전/해커톤':    'contest',
  '포트폴리오':      'portfolio',
}

/** 런타임 하위 호환: 한글 태그가 들어오면 slug로 변환, 이미 slug면 그대로 */
export function normalizeTag(tag: string): string {
  return LEGACY_TAG_TO_SLUG[tag] ?? tag
}
