/**
 * 라우트 타이틀 중앙 레지스트리.
 *
 * 목적: Next.js metadata의 async 반영으로 인한 브라우저 탭 타이틀 flicker 해소.
 * - SEO용 server metadata는 루트 layout + 공개 동적 라우트(`/p/[id]`, `/u/[id]`, `/clubs/[slug]`)에만 유지
 * - 사용자 시점 즉시 동기화는 이 파일 + `<TitleSync />` 컴포넌트 담당
 *
 * 새 라우트 추가 시: ROUTE_TITLES 에 한 줄만 추가 (페이지별 export metadata 불필요).
 */

/**
 * pathname → 타이틀.
 * 키는 Next.js 라우트 경로. `:slug` 같은 동적 세그먼트는 포함시키지 않고, longest-prefix 매칭으로 해결.
 */
export const ROUTE_TITLES: Record<string, string> = {
  // 핵심 네비
  '/dashboard': '홈',
  '/explore': '발견',
  '/network': '사람',
  '/clubs': '클럽',
  '/projects': '프로젝트',
  '/profile': '프로필',
  '/messages': '메시지',
  '/notifications': '알림',
  '/more': '더보기',
  '/feed': '공개 피드',

  // 관리자
  '/admin': '관리자',
  '/admin/activity': '활동 로그 · 관리자',
  '/admin/error-logs': '에러 로그 · 관리자',
  '/admin/institutions': '기관 관리 · 관리자',
  '/admin/invite-codes': '초대 코드 · 관리자',
  '/admin/opportunities': '프로젝트 관리 · 관리자',
  '/admin/users': '유저 관리 · 관리자',

  // 기관 관리자
  '/institution': '기관 관리',
  '/institution/announce': '공지 · 기관',
  '/institution/business-plans': '사업계획서 · 기관',
  '/institution/members': '멤버 · 기관',
  '/institution/reports': '보고서 · 기관',
  '/institution/teams': '팀 · 기관',

  // 온보딩
  '/onboarding': '시작하기',
  '/onboarding/interview': 'AI 인터뷰',

  // 페르소나
  '/profile/persona': '개인 페르소나 · 출시 예고',
  '/admin/audit': '감사 로그 · 관리자',

  // 생성 플로우
  '/projects/new': '새 프로젝트',
  '/clubs/new': '새 클럽',

  // 클럽 운영 서브 (클럽 slug 이후 경로 — longest-prefix 매칭이 파싱해서 해당 텍스트를 반환)
  // 예: /clubs/abc/settings → '/clubs/:slug/settings' 대신 전체 경로 매칭이 안 되므로
  // /clubs/ prefix 는 '클럽' 이 기본값. 아래는 /:slug 뒤 공통 경로별 오버라이드는
  // 기술적으로 불가능하므로, 대신 /:slug 페이지는 각자의 server metadata 가 책임진다.

  // 기타 앱 내부
  '/drafts': '초안',
  '/business-plan': '사업계획서',
  '/calendar': '캘린더',
  '/documents': '문서',
  '/workflow': '워크플로우',
  '/validated-ideas': '검증된 아이디어',
  '/connect/discord': 'Discord 연결',
  '/design': '디자인 토큰',

  // 공개 (비로그인)
  '/': 'Draft',
  '/landing': 'Draft',
  '/login': '로그인',
  '/guide': '가이드',
  '/recruit': 'Draft 1기 모집',
  '/idea-validator': '아이디어 검증',

  // 법적 고지 (PIPA 준수)
  '/privacy': '개인정보처리방침',
  '/terms': '이용약관',
  '/me/data': '내 데이터 관리',
  '/status': '시스템 상태',
}

const SORTED_ROUTES = Object.keys(ROUTE_TITLES).sort((a, b) => b.length - a.length)

/**
 * pathname → 타이틀.
 * 1. 정확 매칭 우선
 * 2. 없으면 longest-prefix 매칭 (`/clubs/abc/settings` → `/clubs`)
 * 3. 여전히 없으면 기본값 'Draft'
 *
 * SEO용 동적 페이지(`/p/[id]`, `/u/[id]`, `/clubs/[slug]`)는 server metadata 가 더 구체적인
 * 타이틀을 제공하므로 여기서는 prefix 매칭 결과로 만족 (예: `/clubs`). 클라이언트 sync 가
 * 서버 metadata 보다 나중에 실행되면 document.title 를 덮어쓸 수 있으니, 동적 페이지는
 * TitleSync skip 하도록 pathname 필터를 추가로 적용.
 */
export function resolveTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  for (const route of SORTED_ROUTES) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return ROUTE_TITLES[route]
    }
  }
  return 'Draft'
}

/**
 * 해당 pathname 이 SEO 동적 metadata 를 가진 페이지인지. TitleSync 가 타이틀 덮어쓰기를
 * 피해야 하는 경우. (서버가 생성한 동적 OG/SEO 타이틀을 보존)
 */
const DYNAMIC_SEO_PREFIXES = ['/p/', '/u/', '/embed/']
export function hasDynamicSeoMetadata(pathname: string): boolean {
  if (DYNAMIC_SEO_PREFIXES.some(p => pathname.startsWith(p))) return true
  // /clubs/:slug 는 동적 metadata 있지만 /clubs/:slug/settings 같은 내부 라우트는 없음.
  // 정확히 세그먼트 개수로 구분: /clubs/{slug} = 2 segments.
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'clubs' && parts.length === 2 && parts[1] !== 'new') return true
  return false
}
