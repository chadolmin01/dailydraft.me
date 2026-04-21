# E2E Tests

Playwright 기반 End-to-End 테스트입니다. 두 축으로 분리되어 있습니다.

## 테스트 분류

| 스펙 | 목적 | 실행 타이밍 |
|------|------|-------------|
| `smoke.spec.ts` | 프로덕션 회귀 방지 — 핵심 공개 라우트 + Meta 심사 필수 엔드포인트 | `workflow_dispatch`, schedule(매시), main push |
| `landing.spec.ts` | 랜딩 페이지 상세 — Hero/CTA/모바일 메뉴 | 로컬 개발 / PR |
| `auth-redirect.spec.ts` | 비로그인 리다이렉트 정책 | 로컬 개발 / PR |
| `signup-flow.spec.ts`, `project-application.spec.ts`, `club-discovery.spec.ts` | 기능별 end-to-end | 로컬 개발 / PR |

## 실행 방법

### 로컬 (dev 서버 띄워둔 상태)
```bash
pnpm dev                  # 3000 포트 기동 (별도 터미널)
pnpm e2e:smoke            # smoke.spec.ts 만
pnpm test:e2e             # 전체 E2E
pnpm test:e2e:ui          # Playwright UI 모드 (디버깅용)
```

### 프로덕션 대상
```bash
pnpm e2e:smoke:prod
# 또는 custom URL:
E2E_BASE_URL=https://staging.dailydraft.me pnpm e2e:smoke
```

### 최초 설정
```bash
pnpm exec playwright install chromium
```

## 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `E2E_BASE_URL` | `http://localhost:3000` | 테스트 대상 base URL |
| `CI` | (unset) | CI 환경 감지 — 설정되면 retries=2, workers=1, github reporter |

## CI 워크플로

`.github/workflows/e2e-smoke.yml` 이 아래 상황에 스모크 테스트를 돌립니다.

- `workflow_dispatch` — Actions 탭에서 수동 실행. `base_url` 입력 지원.
- `schedule` — 매시 정각 (UTC) — 프로덕션 회귀 상시 감지.
- `push` (main) — 머지 직후 90초 sleep 후 프로덕션 재검증.

실패 시 `playwright-report` 이 아티팩트로 업로드됩니다 (14일 보관).

## 실패 시 디버깅

### 1. HTML 리포트 보기
```bash
pnpm exec playwright show-report       # 로컬 생성된 리포트
```
CI 실패 시 Actions 탭 → 해당 run → Artifacts → `playwright-report-<run-id>` 다운로드 → `index.html` 열기.

### 2. 단일 테스트만 디버깅
```bash
pnpm exec playwright test tests/e2e/smoke.spec.ts --grep "랜딩 페이지" --debug
```

### 3. 트레이스 뷰어
실패 시 자동 기록된 trace.zip 을 아래로 열기:
```bash
pnpm exec playwright show-trace path/to/trace.zip
```

## 자주 실패하는 5가지 원인

### 1. Vercel 배포가 아직 진행 중
`push to main` 직후 90초로는 부족한 경우. schedule 이 다음 정각에 다시 돌립니다. 즉시 재검증하려면 workflow_dispatch 수동 실행.

### 2. Rate limit (429) 에 걸림
CI 재시도로 동일 IP 에서 연속 호출. `workers: 1` + `retries: 2` 조합으로 완화했지만 Upstash 레이트 리미트 한도를 일시 초과하면 `/api/oauth/threads/start` 가 401 대신 429 반환. smoke 테스트는 두 코드 모두 허용.

### 3. DB / Auth 헬스체크 degraded
`/api/health` 가 `degraded` 를 반환하면 smoke 는 통과(ok|degraded 둘 다 허용)하지만 Status Page 경보가 울림. Supabase Dashboard 에서 incident 확인.

### 4. 법적 페이지 h1 텍스트 변경
`/legal/privacy` 등의 페이지에서 제목 카피가 완전히 바뀌면 "개인정보처리방침" 등의 고정 문자열 매칭이 깨짐. 카피 개정 시 `smoke.spec.ts` 동시 업데이트.

### 5. 로그인 input type 변경
`input[type="email"]` / `input[type="password"]` 셀렉터 기준. 접근성 개선으로 `type` 을 `text` 로 바꾸면 터짐. 이 경우 accessible name 기반으로 스펙 재작성 필요.

## 새 스모크 테스트 추가 기준

"Meta 심사관 또는 실유저가 처음 30초 안에 부딪히는 경로" 만 추가합니다. 상세 기능 시나리오는 별도 스펙으로 분리하세요.

예시 (추가 검토 후보):
- `/dashboard` — 로그인 후 첫 화면. 세션 쿠키 주입 필요.
- `/admin/audit` — 감사 로그 뷰어. admin role 필요.
- `/api/cron/*` — CRON_SECRET 헤더 필요. 민감 엔드포인트라 대상 제외 권장.
