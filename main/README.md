# Draft

> 동아리의 세대를 잇는 인프라  
> 대학 창업동아리·학회·프로젝트 그룹의 운영을 자동화하는 B2B2C SaaS.

**Production**: [dailydraft.me](https://dailydraft.me)

---

## 핵심 가치

Discord 일상 메시지를 **자동으로 구조화된 기억**으로 전환하여:
- 주간 업데이트·Instagram·LinkedIn·Threads 포스트·분기 실적 보고서를 **페르소나 엔진이 초안 생성**
- 담당자는 **검토·발행만** 수행 — 학생 입력 부하 0
- **기수가 바뀌어도 조직의 기억은 남음**

## 기술 스택

- **Frontend**: Next.js 15 App Router · TypeScript · Tailwind CSS · React Query
- **Backend**: Supabase (Postgres · RLS · Auth · Storage · Edge Functions)
- **AI**: Gemini Flash-Lite · Anthropic Claude · 자체 페르소나 엔진 (3계층 상속)
- **Integration**: Discord Bot · LinkedIn API · Instagram Graph · Threads Graph · Resend
- **Observability**: PostHog · Vercel Analytics
- **Deployment**: Vercel (Production) · Supabase (DB)

## 개발 환경

### 필수 도구
- Node 22 (`.nvmrc` 참조)
- pnpm 10
- Supabase CLI (DB 마이그레이션)

### 시작
```bash
cd main
pnpm install
cp .env.example .env.local   # 환경 변수 채우기
pnpm dev                      # http://localhost:3000
```

### 주요 스크립트
```bash
pnpm dev                 # 개발 서버 (Turbopack)
pnpm build               # 프로덕션 빌드
pnpm check:access        # 접근 manifest 커버리지 검증 (CI)
pnpm db:types            # Supabase 스키마 → 타입 재생성
pnpm db:types:check      # 타입 drift 감지 (CI)
pnpm test:e2e            # Playwright E2E
```

## 프로젝트 구조

```
main/
├── app/                 # Next.js App Router
│   ├── (dashboard)/     # 로그인 필요 라우트 그룹
│   │   ├── dashboard/   # 홈 (내 활동 허브)
│   │   ├── explore/     # 발견 피드
│   │   ├── network/     # 사람 탐색
│   │   ├── clubs/       # 클럽 카탈로그·운영
│   │   ├── projects/    # 프로젝트
│   │   ├── profile/     # 내 프로필 편집
│   │   ├── admin/       # 플랫폼 관리자 (권한 필수)
│   │   └── institution/ # 기관 관리자 (권한 필수)
│   ├── u/[id]/          # 공개 프로필
│   ├── p/[id]/          # 공개 프로젝트
│   ├── feed/            # 공개 활동 피드 (SEO)
│   ├── api/             # Route Handlers
│   └── layout.tsx       # 루트 레이아웃 (metadata·TitleSync)
├── components/
│   ├── ui/              # 기본 UI 컴포넌트
│   ├── dashboard/       # 대시보드 전용
│   ├── explore/         # 탐색 전용
│   ├── network/         # 네트워크 전용
│   ├── club/            # 클럽 전용
│   ├── bundles/         # 페르소나 엔진 번들 UI
│   └── ...
├── src/
│   ├── hooks/           # 커스텀 훅 (React Query·Supabase)
│   ├── lib/
│   │   ├── supabase/    # 서버·클라이언트 인스턴스
│   │   ├── personas/    # 페르소나 엔진 (어댑터·퍼블리셔)
│   │   ├── access/      # 라우트 접근 manifest
│   │   └── routes/      # 라우트 타이틀 레지스트리
│   └── types/           # DB 생성 타입
└── supabase/
    └── migrations/      # DB 마이그레이션 (타임스탬프 14자리)
```

## 설계 원칙

### 라우트 역할 (MECE)
- `/dashboard` = "내 것" (오늘 할 일·내 프로젝트)
- `/explore` = "남의 것" (추천 피드)
- `/network` = 사람 카탈로그
- `/clubs` = 클럽 카탈로그
- `/feed` = 공개 SEO 진입점 (비로그인 가능)

### 디자인 토큰
- 모든 색은 CSS 변수 (`--brand`, `--surface-bg` 등) 경유. 직접 색상값 hex 금지.
- 컨테이너 폭: `max-w-[1400px] + px-4 sm:px-6 lg:px-8`.
- 브랜드: Electric Indigo `#5E6AD2`.

### 보안
- Supabase RLS 전 테이블 적용
- API 라우트 `withErrorCapture` 로 PostHog 에러 자동 캡처
- 익명 엔드포인트 rate limit (H5 대응)
- 보안 헤더 (X-Frame-Options, Referrer-Policy, Permissions-Policy)

### 접근성 (WCAG 2.1 AA 목표)
- Skip link (`app/layout.tsx`)
- `prefers-reduced-motion` 전역 지원
- focus-visible 아웃라인

## 기여

내부 팀 전용 저장소. 외부 기여는 현재 받지 않습니다.  
취약점 신고: [SECURITY.md](./SECURITY.md) 참조.

## 관련 문서

- [ACCESS_POLICY.md](./docs/ACCESS_POLICY.md) — 라우트 접근 tier
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) — 배포 점검

---

© 2026 Draft · dailydraft.me
