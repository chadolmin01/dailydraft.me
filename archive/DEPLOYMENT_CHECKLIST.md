# Draft 배포 전 최종 체크리스트

> **평가일**: 2026-03-19
> **종합 점수**: 5.5 / 10 — 클로즈드 베타 가능, 퍼블릭 런칭에는 조건부
> **평가 범위**: 보안, 아키텍처, 배포 준비도, UX 전체 코드 리뷰

---

## 평가 요약

| 영역 | 점수 | 상태 |
|------|:----:|------|
| 보안 | 7/10 | 기본 인증/헤더 양호, Rate Limit·CSP 미비 |
| 아키텍처 & 코드 품질 | 5/10 | React Query 패턴 양호, 테스트 0개·거대 컴포넌트 |
| 배포 준비도 | 5/10 | 에러 바운더리 양호, SEO·SSR·loading 미비 |
| UX & 프론트엔드 | 6/10 | 핵심 플로우 완성, 빈 페이지 4개·접근성 미흡 |

---

## CRITICAL — 배포 전 반드시 수정

### C1. Dashboard 빈 스켈레톤 (UX 치명)
- **파일**: `app/(dashboard)/dashboard/page.tsx`
- **문제**: 온보딩 완료 후 도착하는 첫 페이지가 회색 박스만 표시. 데이터 fetching 없음, hooks 없음
- **해결**: 온보딩 후 리다이렉트를 `/dashboard` → `/explore`로 변경
- **난이도**: 5분
- [ ] 수정 완료

### C2. 빈 스켈레톤 페이지 4개 노출
- **파일**: `dashboard/page.tsx`, `calendar/page.tsx`, `network/page.tsx`, `documents/page.tsx`
- **문제**: 네비게이션에 노출되지만 기능 없음 (빈 회색 박스)
- **해결**: 네비게이션에서 숨기거나 "준비 중" 안내 표시
- **난이도**: 30분
- [ ] 수정 완료

### C3. robots.ts / sitemap.ts 미존재
- **문제**: SEO 인덱싱 불가, `/admin`, `/api`, `/onboarding` 경로가 검색엔진에 노출 위험
- **해결**: `app/robots.ts`, `app/sitemap.ts` 추가
- **난이도**: 1시간
- [ ] 수정 완료

### C4. 인메모리 Rate Limit — Vercel serverless에서 무효
- **파일**: `src/lib/rate-limit/api-rate-limiter.ts`
- **문제**: `Map` 기반 Rate Limiter가 cold start마다 초기화, 사실상 보호 없음. AI 엔드포인트(onboarding/chat, help/chat 등) API 크레딧 무한 소진 가능
- **해결**: Upstash Redis로 전환 (`@upstash/redis` 이미 package.json에 존재)
- **난이도**: 2시간
- [ ] 수정 완료

### C5. View Count 엔드포인트 인증 없음
- **파일**: `api/opportunities/[id]/view/route.ts`, `api/profile/[id]/view/route.ts`
- **문제**: POST에 인증 체크 없음. IP 기반 15분 쿨다운만 있으며, 인메모리 Map이라 재배포 시 초기화
- **해결**: 최소 Rate Limit 적용 또는 인증 추가
- **난이도**: 30분
- [ ] 수정 완료

### C6. `hostname: '**'` 이미지 와일드카드
- **파일**: `next.config.ts:52`
- **문제**: 모든 HTTPS 도메인의 이미지 프록시 허용 → SSRF 벡터, 이미지 최적화 비용 남용 가능
- **해결**: 허용 도메인만 명시 (Supabase Storage, GitHub avatar 등)
- **난이도**: 15분
- [ ] 수정 완료

---

## HIGH — 배포 직전/직후 수정 권장

### H1. API 에러 응답에 내부 정보 노출
- **영향 범위**: 47개 API 라우트
- **문제**: `error.message`를 클라이언트에 직접 반환 → 테이블명, 컬럼명, 쿼리 구조 노출
- **해결**: 모든 라우트를 `ApiResponse.*` 패턴으로 통일
- **난이도**: 3시간
- [ ] 수정 완료

### H2. CSP(Content-Security-Policy) 헤더 미설정
- **파일**: `middleware.ts`
- **문제**: 사용자 생성 콘텐츠가 있는 서비스에서 XSS 방어 필수
- **해결**: middleware에 CSP 헤더 추가
- **난이도**: 1시간
- [ ] 수정 완료

### H3. `loading.tsx` 전무
- **문제**: 페이지 전환 시 프레임워크 레벨 로딩 인디케이터 없음
- **해결**: `app/(dashboard)/loading.tsx` 등 주요 라우트 그룹에 추가
- **난이도**: 1시간
- [ ] 수정 완료

### H4. `NEXT_PUBLIC_APP_URL` 폴백 도메인 3개 혼재
- **파일**: `app/layout.tsx`, `src/lib/email/templates/weekly-digest.tsx`, `src/lib/email/send-deadline-notifications.ts`
- **문제**: `dailydraft.me`, `dailydraft.kr`, `dailydraft.vercel.app` 3개 하드코딩
- **해결**: 단일 상수로 통일
- **난이도**: 15분
- [ ] 수정 완료

### H5. 온보딩 쿠키 우회 가능
- **파일**: `middleware.ts:134-155`
- **문제**: `onboarding_completed` 쿠키를 브라우저에서 직접 설정하면 온보딩 건너뛰기 가능
- **해결**: 쿠키 값 HMAC 서명 또는 DB 체크
- **난이도**: 1시간
- [ ] 수정 완료

### H6. `(dashboard/)` vs `(dashboard)` 라우트 그룹 중복
- **파일**: `app/(dashboard/)/admin/` (3페이지)
- **문제**: `(dashboard/)` 그룹에 layout.tsx 없음 → admin 3페이지가 TopNavbar 없이 렌더링
- **해결**: `app/(dashboard/)/admin/` → `app/(dashboard)/admin/`으로 이동
- **난이도**: 15분
- [ ] 수정 완료

### H7. 접근성 미흡
- **문제**: form label `htmlFor`/`id` 연결 없음, `text-[0.625rem]`(10px) WCAG 미달, ARIA 속성 거의 없음
- **해결**: 주요 폼에 label 연결, 최소 폰트 크기 12px, 키보드 네비게이션 개선
- **난이도**: 4시간+
- [ ] 수정 완료

---

## MEDIUM — 배포 후 점진적 개선

### M1. 테스트 인프라 구축
- **현재**: Jest, Vitest, Playwright 등 테스트 프레임워크 0개, 테스트 파일 0개
- **권장**: API 라우트 통합 테스트부터 시작 (102개 라우트가 최고 리스크)
- [ ] 착수

### M2. 거대 컴포넌트 분할
| 파일 | 라인 수 |
|------|---------|
| `Onboarding.tsx` | 1,288 |
| `ProfileDetailModal.tsx` | 1,192 |
| `ProfileEditPanel.tsx` | 1,188 |
| `ProjectDetailModal.tsx` | 870 |
| `ChatInterface.tsx` | 826 |
| `LandingPage.tsx` | 778 |
- [ ] 분할 시작

### M3. API 응답 패턴 통일
- 34개 `ApiResponse.*` vs 47개 raw `NextResponse.json` 혼재
- 에러 응답 형태 불일치 → 클라이언트 파싱 혼란
- [ ] 통일 완료

### M4. 타입 정리
- `Opportunity` 타입 4종 공존 (`types.ts`, `src/types/opportunity.ts`, `useOpportunities.ts`, `ProjectDetail.tsx`)
- `as any` 10곳+, `@ts-nocheck` 6파일 (결제 webhook 포함)
- `withRetry` 유틸리티 4곳 복붙 → 공통 모듈 추출
- [ ] 정리 완료

### M5. Explore 페이지 SSR 전환
- 메인 탐색 페이지가 완전 CSR → SEO, 초기 로드 성능 저하
- `generateMetadata` 33페이지 중 1개(`/p/[id]`)만 보유
- [ ] SSR 전환

### M6. 미구현 기능 정리
| 기능 | 상태 |
|------|------|
| Settings 페이지 | 메뉴에 비활성 표시, 페이지 없음 |
| DOCX 내보내기 | `// TODO: Implement DOCX generation` |
| Project Ideate | "Coming Soon" 표시 |
| `alert()` 에러 핸들링 | `project/plan/page.tsx:153` |
- [ ] 처리 완료

### M7. 기타 보안 개선
| 항목 | 설명 |
|------|------|
| CSRF bypass | `Origin` 헤더 없는 요청 허용 (cURL 등) |
| View count 비원자적 증가 | read-modify-write 경쟁 조건 |
| Admin client 비일관 초기화 | `coffee-chat/notify`에서 옵션 없이 생성 |
| `@ts-nocheck` on 결제 webhook | 타입 안전성 해제된 보안 민감 코드 |
| Notification limit 무제한 | `?limit=999999` 가능 |
- [ ] 처리 완료

---

## 긍정적 평가 (잘 되어 있는 부분)

### 보안
- API 라우트에서 `getUser()` 서버 검증 일관 적용
- PKCE OAuth, admin 권한 검증, field whitelist
- 보안 헤더 (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- Cron job `CRON_SECRET` 인증, webhook 서명 검증
- 에러 로깅 시 민감정보 자동 sanitize

### 아키텍처
- React Query + query key factory 패턴
- TypeScript strict mode
- Supabase SSR 패턴 (middleware auth refresh)
- 에러 바운더리 (error.tsx, global-error.tsx, not-found.tsx)
- 에러 로깅 시스템 (DB 저장 + digest)

### UX
- 핵심 유저 플로우 완성도 높음 (가입→온보딩→탐색→프로필→프로젝트→메시징→알림)
- 디자인 시스템 일관적 (모노크롬 브루탈리즘, CSS 변수 기반)
- 모바일 대응 양호 (TopNavbar 햄버거, 메시지 모바일 뷰, Explore 모바일 필터)
- 모달 접근성 우수 (focus trap, ESC, aria-modal, scroll lock)
- 스켈레톤/로딩/에러/빈 상태 UI 컴포넌트 갖춤

### 성능
- ProjectDetailModal, react-easy-crop dynamic import 적용
- framer-motion → CSS 애니메이션 전환 완료
- next/font, next/image 적절히 사용
- React Query staleTime, retry 적절히 설정

---

## 배포 액션 플랜

### Phase 1: 배포 차단 이슈 해결 (1일)
1. [ ] 온보딩 리다이렉트 `/dashboard` → `/explore` 변경 (5분)
2. [ ] 빈 페이지 4개 네비게이션에서 숨김 (30분)
3. [ ] `robots.ts` + `sitemap.ts` 추가 (1시간)
4. [ ] `hostname: '**'` → 허용 도메인만 지정 (15분)
5. [ ] `NEXT_PUBLIC_APP_URL` 폴백 도메인 통일 (15분)
6. [ ] `(dashboard/)` → `(dashboard)` 라우트 그룹 수정 (15분)
7. [ ] `.env` 값 `\n` 제거 확인 (5분)

### Phase 2: 보안 강화 (2~3일)
1. [ ] Upstash Redis Rate Limit 전환 (2시간)
2. [ ] View count 엔드포인트 Rate Limit 적용 (30분)
3. [ ] API 에러 응답 통일 (ApiResponse 패턴) (3시간)
4. [ ] CSP 헤더 추가 (1시간)
5. [ ] 온보딩 쿠키 서명 (1시간)

### Phase 3: 품질 개선 (1~2주)
1. [ ] `loading.tsx` 주요 라우트 그룹에 추가
2. [ ] Explore SSR 전환 + 페이지별 메타데이터
3. [ ] 테스트 인프라 구축 (API 통합 테스트)
4. [ ] 거대 컴포넌트 분할 (Onboarding, ProfileDetailModal 등)
5. [ ] 타입 정리 (Opportunity 통합, withRetry 추출)
6. [ ] 접근성 개선 (label 연결, 최소 폰트 크기, ARIA)

---

> **결론**: Phase 1 완료 후 클로즈드 베타 배포 가능. Phase 2까지 완료 시 퍼블릭 런칭 가능.
