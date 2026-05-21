# Draft 기여 가이드

내부 팀 + AI 에이전트 온보딩용. 외부 PR 은 현재 받지 않습니다.

## 기본 원칙

### 1. 단일 PR 원칙 (PR 분할 규율)
- 한 기능·한 수정을 **하나의 PR** 로 제출.
- 주제별 분할 금지 (`feat/a` / `feat/b` / `fix/c` 같은 인위적 분할 시 의존성 그래프 깨짐).
- 의존 관계가 있는 변경은 반드시 같은 PR 안에서.
- 기준: `Group A 단독 체크아웃 시 next build 통과하는가?` → No 면 단일 PR.

### 2. 자동 커밋 금지
- 사용자가 `커밋` `푸쉬` 명시적으로 말하기 전까지 커밋 금지.
- AI 에이전트는 작업 후 "다음 단계 확인" 만 물을 것.

### 3. 롤백·삭제 금지
- 사용자 명시 요청 없이 `git reset --hard`, `git revert`, 파일 삭제 금지.
- "미사용 ≠ 불필요". 보류된 기능 테이블·코드 삭제 금지.

## 브랜치·PR 네이밍

- `feat/<scope>-<short-desc>` — 새 기능
- `fix/<scope>-<short-desc>` — 버그 수정
- `chore/<scope>-<short-desc>` — 설정·도구·리팩터
- `docs/<scope>` — 문서
- `perf/<scope>` — 성능
- `a11y/<scope>` — 접근성

PR 제목: `type(scope): 한국어 설명` (커밋 컨벤션과 동일)

## 커밋 메시지

- 합쇼체 한국어 (`-습니다/-입니다`). `-에요/-어요` 금지.
- 장식적 UI 요소 언급 (그라디언트·모노 라벨 등) 금지.
- 형식:
  ```
  type(scope): 한국어 요약 (50자 내)

  왜 필요한지·어떤 의도인지 본문 (선택, 72자 줄바꿈).
  비자명한 결정·락·race 가드·RLS 는 본문 필수.
  ```

## DB 마이그레이션 규칙

- 파일명: `YYYYMMDDHHMMSS_snake_case.sql` (14자리 타임스탬프)
- `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` 필수 (재적용 가능성)
- 워크플로우:
  1. `supabase/migrations/` 에 새 SQL 추가
  2. 로컬에서 `supabase db push` 로 검증
  3. 타입 재생성: `pnpm db:types`
  4. 커밋 + PR

## 디자인 토큰 (강제)

- 색상: 반드시 CSS 변수 (`--brand`, `--surface-bg` 등) 사용. 직접 hex 금지
- 컨테이너 폭: `max-w-[1400px] + px-4 sm:px-6 lg:px-8` 표준
- 좌우+상하 축약 클래스 (`p-8`, `lg:p-12`) 금지 — `px-* py-*` 로 분리
- 라운드: `rounded-xl` · `rounded-2xl` 위주. `rounded-none` 지양

## 금지 패턴

### UI 안티패턴
- `border-left: Npx solid <color>` (바이브코딩 냄새)
- 그라디언트 장식 라인
- 영문 대문자 모노 라벨 (`"INFORMATION"`, `"CRITICAL ERROR"` 등)
- 플레이스홀더 회색박스·스톡 일러스트

### 코드 안티패턴
- `return []` on Supabase error → 반드시 `throw error` + retry
- `// @ts-ignore` 남용 → `@ts-expect-error` + 이유 주석
- 일반 페이지에 `export const metadata` → `ROUTE_TITLES` 레지스트리 경유

### 경로
- `main/main/` 같은 이중 경로 (CWD 가 `main/` 면 상대경로 사용)

## 타이틀 관리 (중요)

- 새 라우트 추가 시 **`src/lib/routes/titles.ts` 의 `ROUTE_TITLES` 에 한 줄 추가**.
- 페이지별 `export const metadata = { title }` 추가 금지 — `<TitleSync />` 와 충돌해서 flicker 재발.
- SEO 가 중요한 공개 동적 페이지 (`/p/[id]`, `/u/[id]`, `/clubs/[slug]`) 만 `generateMetadata` 사용.

## 접근성 (WCAG 2.1 AA 목표)

- 이미지 `alt` 필수 (장식은 빈 문자열)
- 아이콘 전용 버튼 `aria-label`
- `prefers-reduced-motion` 존중
- Focus 가시성 (`focus-visible` 아웃라인)

## 테스트

- **반드시 통과**: `pnpm build`, `pnpm check:access`, `pnpm db:types:check`
- E2E: `pnpm test:e2e` (크리티컬 경로만)
- 수동: Light/Dark 모드, Mobile/Desktop breakpoint, 키보드 네비

## AI 에이전트 특별 규칙

- **충돌 회피**: 활성 feature 브랜치가 건드리는 파일은 쓰지 말 것. `git log --name-only` 로 확인
- **회피 영역** (주로): `useStarterGuide`, `useUnreadCount`, `useUnreadNotificationCount`, onboarding 플로우, 프로필 완성도, 페르소나 엔진
- **안전 영역**: 공개 페이지 UI, 에러 경계, 로딩 상태, SEO 메타데이터, 접근성, 문서, 보안 헤더
- **메모리 활용**: `~/.claude/projects/C--project-Draft/memory/` 먼저 읽고 관련 맥락 파악 후 작업

## 배포

- `main` 브랜치 = 프로덕션 (Vercel 자동 배포)
- `main` 직접 푸시 금지 (branch protection) — PR 경유 필수
- Squash merge 권장 (히스토리 깔끔)

## 관련 문서

- [README.md](./README.md) — 프로젝트 소개·기술 스택
- [SECURITY.md](./SECURITY.md) — 취약점 신고 창구
- [docs/ACCESS_POLICY.md](./docs/ACCESS_POLICY.md) — 라우트 접근 tier
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) — 배포 점검
