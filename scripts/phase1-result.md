# Phase 1 배포 전 체크리스트 결과

**실행 일시**: 2026-03-19
**브랜치**: deploy/phase1-fixes

## 작업 결과

| # | 작업 | 성공/실패 | 수정된 파일 | 주요 변경 | 빌드 결과 |
|---|------|-----------|-------------|-----------|-----------|
| 1 | Rate Limit Redis 전환 | 성공 | 13개 파일 | @upstash/ratelimit 설치, redis-rate-limiter.ts 생성, AI 엔드포인트 7개 + view API 2개에 적용 | PASS |
| 2 | 이미지 hostname 수정 | 성공 | next.config.ts | hostname: '**' 와일드카드 제거, 허용 도메인만 유지 (Supabase, Google, GitHub, Kakao, Naver) | PASS |
| 3 | CSP 헤더 추가 | 성공 | middleware.ts | addSecurityHeaders에 Content-Security-Policy 추가 (default-src, script-src, style-src, img-src, font-src, connect-src, frame-ancestors) | PASS |
| 4 | 온보딩 리다이렉트 변경 | 성공 | app/guide/page.tsx, app/(dashboard)/admin/invite-codes/page.tsx | /dashboard → /explore 리다이렉트 변경 | PASS |
| 5 | 빈 페이지 네비게이션 숨김 | 이미 완료됨 | 변경 없음 | Sidebar에서 dashboard/calendar/documents/network 이미 주석 처리됨, TopNavbar에도 해당 링크 없음, middleware에서 hiddenRoutes로 /explore 리다이렉트 처리 완료 | N/A |
| 6 | robots.ts 업데이트 | 성공 | app/robots.ts | Allow: /, /explore, /p/*, Disallow: /admin, /api, /onboarding, /dev, /project/build, /project/ideate | PASS |
| 7 | sitemap.ts 업데이트 | 성공 | app/sitemap.ts | 정적 4페이지 + 동적 /p/[id] (Supabase opportunities 조회) | PASS |
| 8 | 폴백 도메인 통일 | 성공 | send-deadline-notifications.ts, weekly-digest.tsx | dailydraft.vercel.app, dailydraft.kr → dailydraft.me 통일 | PASS |
| 9 | (dashboard/) 라우트 그룹 수정 | 성공 | 3개 파일 이동 | (dashboard/)/admin → (dashboard)/admin으로 이동 (page.tsx, opportunities/page.tsx, users/page.tsx) | PASS |

## 커밋 목록

```
0df0897 phase1: (dashboard/) 라우트 그룹을 (dashboard)로 통합 완료
1f5e58c phase1: NEXT_PUBLIC_APP_URL 폴백 도메인 통일 완료
904f599 phase1: sitemap.ts 동적 페이지 추가 완료
bf27ff2 phase1: robots.ts 업데이트 완료
b57362f phase1: 온보딩 리다이렉트 /dashboard → /explore 변경 완료
b6e2ce5 phase1: CSP 헤더 추가 완료
862e0d3 phase1: 이미지 hostname 와일드카드(**) 제거 완료
1987284 phase1: Rate Limit → Upstash Redis 전환 완료
```

## 최종 빌드 상태

**상태: PASS**

- 모든 페이지 정적/동적 빌드 성공
- Middleware: 83.3 kB
- First Load JS shared: 102 kB
- 에러: 없음
- 경고: 없음

## 실패 항목 상세

없음 (전 항목 성공)

## 배포 전 필요 환경변수 (Vercel)

Rate Limit 기능 정상 작동을 위해 Vercel에 아래 환경변수 설정 필요:

- `UPSTASH_REDIS_REST_URL` — Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis REST Token

> Redis 미설정 시 rate limit이 graceful degradation되어 요청을 차단하지 않음 (로그 경고만 출력)
