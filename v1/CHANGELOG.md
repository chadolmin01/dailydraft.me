# Changelog

All notable changes to Draft are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Security
- SECURITY.md 신고 절차 문서화 (#23)
- 보안 헤더 전수 적용: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (#21)
- RLS 하드닝 C2/C3/C6/C7 (profiles/error_logs/direct_messages/personas) 마이그레이션 (#16)
- H1 UPDATE 정책 WITH CHECK 미러링 (cross-org pivot 차단) (#16)
- 5개 익명 엔드포인트 Rate Limit (H5): client-error-log, cohort-waitlist, micro-prompts, universities (#16)

### Added
- Institution-level SNS 자동화 설계 문서 (Phase A~D 로드맵)
- 아산 두어스 2026 배치 지원 기록
- CONTRIBUTING.md — 에이전트·개발자 온보딩 가이드 (#25)
- README.md — 프로젝트 소개 (#24)
- /api/og/default — 기본 OG 이미지 (Electric Indigo) (#18)
- /network — 사람 탐색 독립 라우트 (#16)
- /admin·/institution 전용 error.tsx (#23)
- (dashboard)/not-found.tsx 맥락화 404 (#21)
- JSON-LD 구조화 데이터 /p/[id]·/u/[id] (#21)
- Admin·Institution 하위 라우트별 구체 타이틀 (#26)
- 동적 sitemap.ts (profiles·projects·clubs) (#20)
- 학생 신원 필드 (profiles.student_id/department/university_id/entrance_year) (#16)
- 마이크로 프롬프트 엔진 (ambient 수집) (#16)
- /api/universities/by-email (학교 이메일 자동 감지) (#16)
- Threads 전용 콘텐츠 어댑터 + 500자 체인 분할 (#19)

### Changed
- 브랜드 컬러: Toss Blue `#3182F6` → Electric Indigo `#5E6AD2` (Linear 톤) (#16)
- 컨테이너 폭 전 라우트 1400px 통일 (#16)
- Surface depth 3-tier (canvas/card/sunken) (#16)
- PWA manifest brand 정렬 + viewport themeColor 다크 모드 (#20)
- /feed 시간 버킷 그룹핑 + stats strip (#18)
- /p/[id] ISR revalidate=300 (#20)
- Next.js Image 포맷 AVIF·WebP 우선 + 24h 캐시 (#22)
- /dashboard 역할 재정의 (내 활동 허브), /explore 는 발견 피드 (MECE) (#16)
- LinkedIn·Instagram 프롬프트에 마크다운 금지 규칙 (#19)

### Fixed
- 브라우저 탭 타이틀 flicker — TitleSync 컴포넌트 + ROUTE_TITLES 중앙 레지스트리 (#17)
- /feed·/network layout shift — 전용 loading 스켈레톤 (#18·#20)
- global-error.tsx 브루탈리즘 잔재 → Toss 톤 리프레시 (#20)
- SEO canonical URL 누락 — /u/[id]·/p/[id]·/feed·/clubs/[slug]·/recruit·/landing (#21)

### Accessibility
- prefers-reduced-motion 전역 지원 — WCAG 2.3.3 (#22)
- 아이콘 전용 버튼 aria-label 보충 (4개 모달 닫기·제거 버튼) (#20)

### Docs
- SECURITY.md — responsible disclosure (#23)
- README.md — 프로젝트 소개·구조·설계 원칙 (#24)
- CONTRIBUTING.md — 기여 가이드·AI 에이전트 규칙 (#25)
- docs/ACCESS_POLICY.md — 라우트 접근 tier (기존)

### Internal
- CI: verify-db-types — migration 포함 PR 의 generated.ts drift 감지 (#16)
- access manifest 전수 등록 (73개 라우트 커버) (#16·#20)
- .nvmrc — Node 22 고정 (#23)

---

## [2026-04-19] 이전

이전 기록은 `git log` 참조.
주요 마일스톤:
- GitHub DevSync (Discord 포럼 자동 포스트·Ghostwriter 주간 초안 반영)
- Operator Dashboard (팀 현황·미제출 집계)
- 클럽 자동 프로비저닝 (Discord 서버·역할·채널 일괄 생성)
- 페르소나 엔진 R1~R3 (3계층 상속·13슬롯·외부 발행)
- 주간 업데이트 Ghostwriter
- 콘텐츠 스튜디오 허브 통합

---

**업데이트 규칙**: 머지 직후 [Unreleased] 에 한 줄 추가. 분기·정식 릴리즈 때 버전 태그.
