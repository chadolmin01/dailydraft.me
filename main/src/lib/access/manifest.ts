/**
 * Access Manifest — 모든 라우트의 접근 정책 단일 진실.
 *
 * 원칙:
 * 1. 새 페이지 (app 하위 page.tsx) 만들 때 반드시 여기 등록.
 * 2. middleware 와 UI 가 이 파일 import 해서 일관된 정책 적용.
 * 3. "로그아웃 시 보이는 것" = 상수처럼 동작. 실시간 데이터 fetch 금지.
 *
 * Tier 정의:
 * - public: 로그아웃 OK. SEO 크롤러·공유 링크 대상. 실데이터 fetch 금지, 정적/denormalized 만.
 * - auth: 로그인 필수. middleware 에서 /login 리다이렉트.
 * - club-admin: 특정 클럽 owner/admin. middleware 는 로그인만 체크, page 에서 role 체크.
 * - platform-admin: 앱 관리자 (app_metadata.is_admin). page + API 이중 체크.
 * - institution-admin: 기관 관리자 권한. 별도 플로우.
 * - hidden: MVP 모드에서 숨김. middleware 가 /explore 리다이렉트.
 * - dev: 개발 전용. production 에서 404.
 *
 * @see docs/ACCESS_POLICY.md — 각 tier 규칙과 체크리스트
 */

export type AccessTier =
  | 'public'
  | 'auth'
  | 'club-admin'
  | 'platform-admin'
  | 'institution-admin'
  | 'hidden'
  | 'dev'

export interface RouteRule {
  pattern: string // Next.js 경로 패턴. :slug 같은 동적 세그먼트 사용
  tier: AccessTier
  note?: string // 설명이 필요한 경우
}

/**
 * 모든 라우트를 여기에 등록. 정규식 대신 단순 prefix 매칭 규칙:
 *   - `:<name>` 는 한 segment 와일드카드 (/clubs/:slug)
 *   - `*` 는 다중 segment (/admin/*)
 *   - 매칭은 긴 패턴 우선 (/clubs/:slug/settings 이 /clubs/:slug 보다 먼저 매칭)
 */
export const ACCESS_MANIFEST: RouteRule[] = [
  // ── public ────────────────────────────────────────────────
  { pattern: '/', tier: 'public', note: '랜딩. 로그인 시 middleware 가 /dashboard 리다이렉트' },
  { pattern: '/landing', tier: 'public' },
  { pattern: '/login', tier: 'public' },
  { pattern: '/guide', tier: 'public' },
  { pattern: '/offline', tier: 'public', note: 'PWA offline fallback' },
  { pattern: '/explore', tier: 'public', note: '공개 프로필/프로젝트/클럽 탐색' },
  { pattern: '/feed', tier: 'public', note: '공개 클럽 활동 피드 (SEO/바이럴 진입점)' },
  { pattern: '/p/:id', tier: 'public', note: '공개 프로젝트 상세 (공유 링크용)' },
  { pattern: '/u/:id', tier: 'public', note: '공개 프로필. profile.id 기반. ProfileDetailModal 대체' },
  { pattern: '/clubs/:slug', tier: 'public', note: '공개 클럽 상세. 현재 멤버카운트는 denorm 미구현 → anon 에겐 0 으로 보임 (TODO)' },
  { pattern: '/clubs/:slug/join', tier: 'public', note: '초대 코드로 가입. middleware 는 pass, page 에서 로그인 유도' },
  { pattern: '/embed/clubs/:slug', tier: 'public', note: '외부 사이트 임베드 위젯 (iframe)' },
  { pattern: '/recruit', tier: 'public' },
  { pattern: '/privacy', tier: 'public', note: 'PIPA 준수 개인정보처리방침' },
  { pattern: '/terms', tier: 'public', note: '서비스 이용약관' },
  { pattern: '/status', tier: 'public', note: '공개 시스템 상태 페이지 (health polling)' },
  { pattern: '/idea-validator', tier: 'hidden', note: 'MVP 모드 숨김' },

  // ── auth ──────────────────────────────────────────────────
  { pattern: '/dashboard', tier: 'auth', note: 'Triage Home' },
  { pattern: '/onboarding', tier: 'auth' },
  { pattern: '/onboarding/interview', tier: 'auth' },
  { pattern: '/profile', tier: 'auth' },
  { pattern: '/profile/edit', tier: 'auth' },
  { pattern: '/profile/persona', tier: 'auth', note: '개인 페르소나 출시 예고 페이지 (2026 여름 출시)' },
  { pattern: '/me/data', tier: 'auth', note: '정보주체 권리 관리 (PIPA 35/36조 — 열람·내려받기·삭제)' },
  { pattern: '/messages', tier: 'auth' },
  { pattern: '/notifications', tier: 'auth' },
  { pattern: '/drafts', tier: 'auth', note: '초안 목록 (주간 업데이트 등)' },
  { pattern: '/drafts/:draftId', tier: 'auth' },
  { pattern: '/more', tier: 'auth' },
  { pattern: '/network', tier: 'auth', note: '사람 탐색 (GNB 에선 제거, 라우트는 활성)' },
  { pattern: '/design', tier: 'auth', note: '디자인 토큰 참조 페이지' },
  { pattern: '/connect/discord', tier: 'auth' },
  { pattern: '/clubs', tier: 'auth', note: '내 클럽 목록' },
  { pattern: '/clubs/new', tier: 'auth', note: '신규 클럽 생성' },
  { pattern: '/projects', tier: 'auth' },
  { pattern: '/projects/new', tier: 'auth' },
  { pattern: '/projects/:id', tier: 'auth' },
  { pattern: '/projects/:id/edit', tier: 'auth' },
  { pattern: '/projects/:id/settings/persona', tier: 'auth', note: '프로젝트 페르소나 (리드만 편집·클럽 ops 열람)' },

  // ── club-admin ────────────────────────────────────────────
  // middleware 는 '로그인 필요' 수준까지만 체크. club 소속/역할 체크는 page 에서.
  { pattern: '/clubs/:slug/settings', tier: 'club-admin' },
  { pattern: '/clubs/:slug/settings/discord', tier: 'club-admin' },
  { pattern: '/clubs/:slug/settings/github', tier: 'club-admin' },
  { pattern: '/clubs/:slug/settings/persona', tier: 'club-admin' },
  { pattern: '/clubs/:slug/bundles/new', tier: 'club-admin' },
  { pattern: '/clubs/:slug/bundles/:bundleId', tier: 'auth', note: '번들 열람은 멤버 가능' },
  { pattern: '/clubs/:slug/bundles', tier: 'club-admin', note: '콘텐츠 허브로 redirect' },
  { pattern: '/clubs/:slug/contents', tier: 'club-admin', note: '콘텐츠 스튜디오 허브 (탭: 캘린더·내 덱·기획·자동화·성과)' },
  { pattern: '/clubs/:slug/decks', tier: 'club-admin', note: '콘텐츠 허브로 redirect' },
  { pattern: '/clubs/:slug/automations', tier: 'club-admin', note: '콘텐츠 허브로 redirect' },
  { pattern: '/clubs/:slug/automations/settings', tier: 'club-admin', note: '콘텐츠 허브로 redirect' },
  { pattern: '/clubs/:slug/content-planning', tier: 'club-admin', note: '콘텐츠 허브로 redirect' },
  { pattern: '/clubs/:slug/analytics', tier: 'club-admin', note: '콘텐츠 허브로 redirect' },
  { pattern: '/clubs/:slug/operator', tier: 'club-admin', note: '운영자 대시보드 (팀·제출 현황)' },
  { pattern: '/clubs/:slug/reports', tier: 'club-admin', note: '클럽 리포트/통계' },
  { pattern: '/clubs/:slug/certificate', tier: 'club-admin', note: '활동 증명서 발급' },
  { pattern: '/clubs/:slug/cohorts/:cohort/archive', tier: 'auth', note: '기수별 아카이브 — 멤버 열람' },

  // ── platform-admin ────────────────────────────────────────
  { pattern: '/admin', tier: 'platform-admin' },
  { pattern: '/admin/activity', tier: 'platform-admin' },
  { pattern: '/admin/error-logs', tier: 'platform-admin' },
  { pattern: '/admin/institutions', tier: 'platform-admin' },
  { pattern: '/admin/invite-codes', tier: 'platform-admin' },
  { pattern: '/admin/opportunities', tier: 'platform-admin' },
  { pattern: '/admin/users', tier: 'platform-admin' },
  { pattern: '/admin/audit', tier: 'platform-admin', note: '감사 로그 뷰어 (audit_logs 테이블)' },

  // ── institution-admin ─────────────────────────────────────
  { pattern: '/institution', tier: 'institution-admin' },
  { pattern: '/institution/announce', tier: 'institution-admin' },
  { pattern: '/institution/business-plans', tier: 'institution-admin' },
  { pattern: '/institution/members', tier: 'institution-admin' },
  { pattern: '/institution/reports', tier: 'institution-admin' },
  { pattern: '/institution/teams', tier: 'institution-admin' },

  // ── hidden (MVP 모드) ─────────────────────────────────────
  { pattern: '/business-plan', tier: 'hidden' },
  { pattern: '/calendar', tier: 'hidden' },
  { pattern: '/documents', tier: 'hidden' },
  { pattern: '/network', tier: 'hidden' },
  { pattern: '/usage', tier: 'hidden' },
  { pattern: '/workflow', tier: 'hidden' },
  { pattern: '/validated-ideas', tier: 'hidden' },
  { pattern: '/project', tier: 'hidden', note: 'legacy /project/* 플로우' },
  { pattern: '/project/ideate', tier: 'hidden' },
  { pattern: '/project/plan', tier: 'hidden' },

  // ── dev ────────────────────────────────────────────────────
  { pattern: '/dev/onboarding', tier: 'dev' },
]

// 긴 패턴 우선 매칭을 위한 정렬 (segment 개수 기준 내림차순).
const SORTED_RULES = [...ACCESS_MANIFEST].sort((a, b) => {
  const depthA = a.pattern.split('/').length
  const depthB = b.pattern.split('/').length
  if (depthA !== depthB) return depthB - depthA
  // 동일 depth 면 동적 세그먼트 적은 쪽 우선 (/:slug 보다 /new 가 먼저)
  const dynA = (a.pattern.match(/:\w+/g) ?? []).length
  const dynB = (b.pattern.match(/:\w+/g) ?? []).length
  return dynA - dynB
})

/**
 * pathname 에 해당하는 AccessTier 반환. 매칭 없으면 undefined.
 *
 * 매칭 규칙:
 * - `:<name>` 는 한 segment 와일드카드
 * - 마지막 `*` 는 나머지 전체
 * - 그 외는 정확 매칭
 */
export function resolveAccessTier(pathname: string): AccessTier | undefined {
  for (const rule of SORTED_RULES) {
    if (matchPattern(rule.pattern, pathname)) return rule.tier
  }
  return undefined
}

function matchPattern(pattern: string, pathname: string): boolean {
  // 정확 매칭 빠른 경로
  if (pattern === pathname) return true

  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = pathname.split('/').filter(Boolean)

  // 마지막 `*` 처리
  if (patternParts[patternParts.length - 1] === '*') {
    const prefix = patternParts.slice(0, -1)
    if (pathParts.length < prefix.length) return false
    return prefix.every((p, i) => p.startsWith(':') || p === pathParts[i])
  }

  if (patternParts.length !== pathParts.length) return false
  return patternParts.every((p, i) => p.startsWith(':') || p === pathParts[i])
}
