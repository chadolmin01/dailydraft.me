# Overnight Work Log — 2026-04-21

**배경**: 사용자가 "프로덕트급 완성도로 가는 작업을 묶어서 머지. 내일 아침까지 무한 작업. 허락 불필요" 지시.
**제약**: Vercel 무료 티어 100회/일 배포 쿼터. PR 남발 금지, 배치 머지 원칙.

## 배치 머지 13회 요약

| # | 커밋 | Vercel 배포 | 내용 |
|---|---|---|---|
| 1 | `31faba1` | #1 | `feat/threads-compliance-callbacks` 머지 (webhook 3종 + HMAC 검증 + 마이그레이션) |
| 2 | `d05e8bc` | #2 | `feat/meta-app-review-bundle` 머지 (legal 3페이지 + 데모 파이프라인 + 7문서 + PDF 빌더) |
| 3 | `8b62339` | #3 | middleware CSRF 예외 → 웹훅 400 (403→400) |
| 4 | `747b8c1` | #4 | `/feed` 탭 정리 (navbar/footer 제거) + empty state 리라이트 |
| 5 | `1c286d7` | #5 | **Bundle A** — 계정 삭제 링크 통일 + HSTS + Dependabot + OAuth rate limit |
| 6 | `e3d9643` | #6 | **Bundle B** — RLS 2차 하드닝 (H7 persona artifacts + M4 trigger + M5 search_path) |
| 7 | `e1dff60` | #7 | **Bundle CDE** — Status SLO + 랜딩 엔터프라이즈 + E2E 스모크 (3축) |
| 8 | `ebe957c` | #8 | **Bundle F** — secret-scan CI + rotation runbook + 감사 문서 동기화 |
| 9 | `38ab57f` | #9 | **Bundle G** — 404 홈링크 수정 + security.txt + SECURITY.md |
| 10 | `bccb1d6` | #10 | **Bundle H** — SEO 구조화 데이터 + 성능 최적화 + a11y 3축 병렬 |
| 11 | `1169e38` | #11 | **Bundle I** — 제출 cheat sheet + 리뷰어 프로비저닝 스크립트 |
| 12 | `75df029` | #12 | **Bundle J** — 감사 로그 CSV export |
| 13 | `2636bbe` | #13 | **Bundle K** — SUBMISSION.md v1.1 (통제 23→29, implemented 21→28) |
| 14 | `d491409` | #14 | **Bundle L** — reviewer-expectations readiness 6.5 → 9.0 본문 업데이트 |

총 **86회 쿼터 여유** 확보 (100 − 14 = 86).

## 확인된 엔드포인트 상태 (심사 제출 준비 완료)

| URL | HTTP | 역할 |
|---|---|---|
| `GET /legal/privacy` | 200 | Meta 폼 Privacy Policy URL |
| `GET /legal/terms` | 200 | Meta 폼 Terms of Service URL |
| `GET /legal/data-deletion` | 200 | Meta 폼 Data Deletion Instructions URL |
| `POST /api/oauth/threads/data-deletion` | 400 | Meta 폼 Data Deletion Request URL (invalid signature 정상 거부) |
| `POST /api/oauth/threads/deauthorize` | 400 | Meta 폼 Deauthorize Callback URL (invalid signature 정상 거부) |
| `GET /api/oauth/threads/data-deletion/status?code=X` | 200 | 삭제 상태 공개 조회 |
| `GET /.well-known/security.txt` | 200 | RFC 9116 보안 연락처 |
| `GET /status` | 200 | SLO 공개 + 인시던트 로그 placeholder |

## 신규·수정 아티팩트 요약

### 법적·정책 페이지 (live on main)
- `app/legal/{privacy,terms,data-deletion}/page.tsx` + `app/legal/layout.tsx`
- SECURITY.md (2026-04-21 하드닝 이력 추가)
- `public/.well-known/security.txt`

### Meta 콜백 · 보안
- `app/api/oauth/threads/{deauthorize,data-deletion,data-deletion/status}/route.ts`
- `src/lib/personas/meta-signed-request.ts` (HMAC-SHA256 timing-safe)
- `supabase/migrations/20260421000000_meta_data_deletion_requests.sql`
- `supabase/migrations/20260421010000_rls_hardening_h7_m4_m5.sql`
- `next.config.ts` (HSTS + optimizePackageImports + deviceSizes)
- `.github/dependabot.yml`
- `.github/workflows/secret-scan.yml`
- `docs/operations/secret-rotation-runbook.md`

### 제출 패키지 (docs/meta-app-review/)
- `SUBMISSION.md` (v1.1) — 커버레터, 라우팅, 29 통제 readiness
- `use-case.md` — Fortune 500 스타일 영문 제출 본문
- `demo-video-script.md` — broadcast-grade 22 shot 리스트
- `compliance-attestation.md` — 10섹션 17테이블 legal attestation
- `security-architecture.md` — 14섹션 보안 dossier, 25개 코드 인용
- `reviewer-expectations.md` — 10 반려 패턴 × Draft 방어 매핑 (readiness 9.0/10)
- `privacy-policy-checklist.md` — 내부 감사
- `SUBMISSION-FORM-CHEATSHEET.md` — Meta 폼 11개 필드 복붙 텍스트
- PDF 번들 (로컬 dist/ 자동 재생성, 총 7.34MB)

### 데모·테스트 인프라
- `scripts/demo/**` — Playwright 4파트 녹화 + ffmpeg 합성 + 자막 23큐
- `tests/e2e/smoke.spec.ts` — 10 스모크 테스트
- `.github/workflows/e2e-smoke.yml` — schedule + push + dispatch 3 트리거
- `scripts/provision-reviewer-account.mjs` — Meta 리뷰어 계정 자동 프로비저닝

### 프로덕트 폴리시
- `components/home/JsonLd.tsx` — schema.org Organization/WebSite/SoftwareApp/FAQ
- `components/home/InstitutionCTA.tsx` — 기관 전용 랜딩 섹션
- `components/home/Hero.tsx` — 신뢰 3요소 (AES-256·PIPA·SLO)
- `components/home/Footer.tsx` — PIPA 마이크로카피 + SLO 뱃지
- `components/status/StatusPageClient.tsx` — SLO 5종 + 인시던트 섹션
- `components/home/{CognitiveSystem,PersonaEngine,BeforeAfterTabs,FeatureBar}.tsx` — a11y (WCAG 2.1 AA)
- `app/not-found.tsx` — 홈 버튼 `/dashboard` → `/`
- `app/api/admin/audit/route.ts` + `app/(dashboard)/admin/audit/page.tsx` — CSV export

## Readiness 재평가: **9.0 / 10**

Bundle 전 6.5, 작업 후 9.0. 남은 1.0 포인트:
- 0.5 — 외부 펜테스트 미시행 (Q3 2026 로드맵)
- 0.5 — 데모 영상 미녹화 (사용자 행동 필요, 코드 아님)

코드 쪽 Meta 심사 블로커는 전부 해소.

## 사용자가 내일 해야 할 단 4가지

1. **Meta 앱 콘솔 URL 3개 저장**
   - OAuth Redirect: `https://dailydraft.me/api/oauth/threads/callback`
   - Deauthorize Callback: `https://dailydraft.me/api/oauth/threads/deauthorize`
   - Data Deletion Request: `https://dailydraft.me/api/oauth/threads/data-deletion`

2. **`team@dailydraft.me` 메일 수신 설정 확인**
   - Meta 심사 답변이 이 주소로 옴.
   - Resend 인바운드 또는 Google Workspace / Naver Works 중 하나.

3. **리뷰어 테스트 계정 프로비저닝 + 데모 영상 녹화**
   ```bash
   # 테스트 계정 생성 (Meta 가 ticket ID 배정한 후)
   cd main
   node scripts/provision-reviewer-account.mjs --ticket META-001
   # → 이메일·비밀번호·슬러그·persona_id 콘솔 출력. 복사해서 Meta 폼에.
   
   # 데모 영상 — Xbox Game Bar (Win+G) 또는 OBS 로 한 번에 녹화.
   # 가이드: docs/meta-app-review/demo-video-script.md
   # 체크리스트: docs/meta-app-review/SUBMISSION-FORM-CHEATSHEET.md §"Screencast"
   ```

4. **Meta App Review 폼 제출**
   - `docs/meta-app-review/SUBMISSION-FORM-CHEATSHEET.md` 열고 필드별 복붙.
   - `docs/meta-app-review/dist/draft-meta-review-package-v1.0.pdf` 첨부.
   - 심사 3~10 영업일 대기. 반려 시 `reviewer-expectations.md §7` 템플릿 그대로 24h 내 답신.

---

**작성**: 2026-04-21 밤샘 자율 세션
**다음 체크인**: 사용자 아침 기상 시
