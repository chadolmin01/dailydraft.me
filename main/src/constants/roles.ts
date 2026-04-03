/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  ROLES & POSITIONS — 단일 진실의 원천 (Single Source of Truth)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 *  "포지션"과 "역할"은 다른 개념:
 *
 *  POSITIONS (세분화, profiles.desired_position)
 *    → 유저가 온보딩에서 고르는 자기 포지션
 *    → 예: 'frontend', 'backend', 'fullstack', 'design' ...
 *
 *  PROJECT_ROLES (묶음, opportunities.needed_roles)
 *    → 프로젝트가 모집하는 역할
 *    → 예: 'developer', 'designer', 'pm' ...
 *    → 하나의 역할에 여러 포지션이 매핑됨 (developer ← frontend, backend, fullstack)
 *
 *  DB에는 slug만 저장됩니다. 라벨 변경 시 DB 영향 없음.
 *
 *  사용처:
 *    - 온보딩: PositionStep (POSITIONS)
 *    - 프로젝트 생성: 모집 역할 선택 (PROJECT_ROLES)
 *    - Explore 필터: 역할 필터 (ROLE_FILTER_GROUPS)
 *    - AI 매칭: 포지션↔역할 매핑
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { Code2, Palette, Lightbulb, Megaphone, Users, BarChart3 } from 'lucide-react'

/* ── 포지션: 유저 프로필용 (세분화) ─────────────────────────── */

export interface PositionDef {
  /** DB 저장용 slug */
  slug: string
  /** UI 라벨 */
  label: string
  /** 이 포지션이 속하는 상위 역할 slug */
  roleGroup: string
}

/**
 * 온보딩에서 선택 가능한 포지션 목록.
 * profiles.desired_position에 slug가 저장됨.
 */
export const POSITIONS: PositionDef[] = [
  { slug: 'frontend',  label: '프론트엔드 개발', roleGroup: 'developer' },
  { slug: 'backend',   label: '백엔드 개발',    roleGroup: 'developer' },
  { slug: 'fullstack', label: '풀스택 개발',    roleGroup: 'developer' },
  { slug: 'design',    label: 'UI/UX 디자인',  roleGroup: 'designer' },
  { slug: 'pm',        label: 'PM / 기획',     roleGroup: 'pm' },
  { slug: 'marketing', label: '마케팅',         roleGroup: 'marketer' },
  { slug: 'data',      label: '데이터분석',      roleGroup: 'data' },
  { slug: 'other',     label: '기타',           roleGroup: 'other' },
]

/* ── 프로젝트 역할: 모집용 (묶음) ──────────────────────────── */

export interface ProjectRoleDef {
  /** DB 저장용 slug (opportunities.needed_roles에 저장) */
  slug: string
  /** 프로젝트 생성 UI 라벨 */
  label: string
  /** Explore 필터 라벨 (예: '개발자 구함') */
  filterLabel: string
  /** lucide-react 아이콘 */
  icon: React.ElementType
  /**
   * 이 역할에 매핑되는 포지션 slug 목록.
   * Explore 필터에서 people 탭 매칭에 사용.
   */
  positionSlugs: string[]
}

/**
 * 프로젝트가 모집할 수 있는 역할 목록.
 * opportunities.needed_roles에 slug 배열로 저장됨.
 *
 * positionSlugs: 이 역할에 해당하는 POSITIONS의 slug.
 * People 탭 필터에서 desired_position과 매칭할 때 사용.
 */
export const PROJECT_ROLES: ProjectRoleDef[] = [
  { slug: 'developer',  label: '개발자',    filterLabel: '개발자 구함',  icon: Code2,     positionSlugs: ['frontend', 'backend', 'fullstack'] },
  { slug: 'designer',   label: '디자이너',  filterLabel: '디자이너 구함', icon: Palette,   positionSlugs: ['design'] },
  { slug: 'pm',         label: '기획자',    filterLabel: '기획자 구함',  icon: Lightbulb, positionSlugs: ['pm'] },
  { slug: 'marketer',   label: '마케터',    filterLabel: '마케터 구함',  icon: Megaphone, positionSlugs: ['marketing'] },
  { slug: 'data',       label: '데이터',    filterLabel: '데이터 구함',  icon: BarChart3, positionSlugs: ['data'] },
]

/* ── 헬퍼 ──────────────────────────────────────────────────── */

/** slug → PositionDef 빠른 조회 */
export const POSITION_MAP = new Map(POSITIONS.map(p => [p.slug, p]))

/** slug → ProjectRoleDef 빠른 조회 */
export const PROJECT_ROLE_MAP = new Map(PROJECT_ROLES.map(r => [r.slug, r]))

/** 포지션 slug → label */
export function positionLabel(slug: string): string {
  return POSITION_MAP.get(slug)?.label ?? slug
}

/** 프로젝트 역할 slug → label */
export function projectRoleLabel(slug: string): string {
  return PROJECT_ROLE_MAP.get(slug)?.label ?? slug
}

/** 포지션 slug → 상위 역할 slug */
export function positionToRole(positionSlug: string): string {
  return POSITION_MAP.get(positionSlug)?.roleGroup ?? 'other'
}

/** People category icon (Explore 사이드바용) */
export const PEOPLE_CATEGORY_ICONS: Record<string, React.ElementType> = Object.fromEntries(
  [['all', Users], ...PROJECT_ROLES.map(r => [r.slug, r.icon])]
)

/**
 * 마이그레이션용: 기존 한글 → slug 변환 맵.
 *
 * needed_roles (프로젝트):
 *   '개발자' → 'developer', '디자이너' → 'designer' ...
 *
 * desired_position (프로필):
 *   '프론트엔드 개발' → 'frontend', 'UI/UX 디자인' → 'design' ...
 */
export const LEGACY_ROLE_TO_SLUG: Record<string, string> = {
  // needed_roles (opportunities)
  '개발자':    'developer',
  '디자이너':  'designer',
  '기획자':    'pm',
  '마케터':    'marketer',
  'PM':       'pm',
  '데이터분석': 'data',
  // desired_position (profiles)
  '프론트엔드 개발': 'frontend',
  '백엔드 개발':    'backend',
  '풀스택 개발':    'fullstack',
  'UI/UX 디자인':  'design',
  'PM / 기획':     'pm',
  '마케팅':         'marketing',
  '기타':           'other',
}

/** 런타임 하위 호환: 한글이 들어오면 slug로, 이미 slug면 그대로 */
export function normalizeRole(role: string): string {
  return LEGACY_ROLE_TO_SLUG[role] ?? role
}
