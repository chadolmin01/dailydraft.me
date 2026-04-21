# 보안 정책 · Security Policy

## 취약점 신고 (Responsible Disclosure)

Draft 에서 보안 취약점을 발견하셨다면 **공개하기 전 먼저 알려주시기를** 부탁드립니다.

**연락처**: team@dailydraft.me

신고 시 다음 정보를 포함해 주시면 빠른 대응이 가능합니다:
- 취약점 유형 (SQL Injection, XSS, CSRF, IDOR, RLS 우회 등)
- 재현 방법 (스크린샷·영상 환영)
- 영향 범위 (어떤 데이터·계정·권한에 영향)
- 공개 예정 일정 (이미 공개 계획이 있다면)

## 대응 일정 (목표)

- **24시간 내**: 접수 확인 회신
- **72시간 내**: 초기 평가 + 심각도 판정
- **7~14일 내**: 수정 배포 (심각도에 따라 최대 30일)
- **공개**: 수정 완료 후 신고자·영향 받은 유저에게 통지

## 지원 범위

### 포함
- dailydraft.me 프로덕션 (main 브랜치 배포분)
- 공식 Discord Bot
- /api/* 모든 엔드포인트
- Supabase RLS 정책 우회 시도

### 제외
- 3rd-party 서비스 (Supabase·Vercel·Google OAuth 등) 자체 취약점 — 해당 벤더에 신고 부탁
- 로컬 개발 환경 (.env.local 등)
- 예고된 실험 기능 (/dev/*)
- 이미 공지된 알려진 이슈

## 범위에 속하지 않는 신고 (Out of Scope)

- 사회공학 (피싱, vishing)
- 물리적 침입
- DDoS·Volumetric attacks
- Rate limit 우회 시도 (Rate limit 자체는 H5 감사 완료)

## 보안 인프라 요약

### 인증·권한
- Supabase Auth (JWT 기반)
- Row Level Security (RLS) 전 테이블 적용
- 관리자 2-tier (platform·institution·club)

### 네트워크
- HTTPS 전용 (Vercel)
- 보안 헤더: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Rate limiting (H5 — 익명 API 분당 20건)

### 데이터
- PII 최소 수집 (학번·학과는 opt-in)
- Soft delete + 30일 purge cron
- Audit log (schema 시간·권한 변경 추적)

### 감사·모니터링
- PostHog 에러 캡처 + `error_logs` DB (append-only, RLS 차단) + Discord 알림 3중 기록
- `instrumentation.ts` onRequestError — Server Component/Action/미들웨어 까지 커버
- `/admin/audit` — audit_logs 뷰어 (platform admin 전용, PIPA 3년 보존)
- 정식 Sentry SDK 도입은 트래픽·비용 확인 후 재검토 (현재 3중 스택으로 동등 기능 달성)
- GitHub Security Advisories 구독

## 감사 기록

- **2026-04-18 RLS 감사**: 18개 취약점 (C1~C7 CRITICAL 7, H1 HIGH 7, M 4). 2026-04-20 기준 C2/C3/C6/C7 + H1 수정 완료 (PR #16).
- **2026-04-21 2차 하드닝**: H5 waitlist 테이블 제거 · H7 persona 학습 artifact 편집자 전용 축소 · HSTS/Dependabot/OAuth rate limit/secret-scan CI 추가 · secret rotation runbook 발간.
- **2026-04-22 3차 하드닝**: H4 `platform_admins` 테이블 도입 (JWT `app_metadata.is_admin` 의존 제거 1단계) · `is_platform_admin()` / `is_platform_superadmin()` RPC · 기존 admin 자동 마이그레이션 · `audit_logs` 트리거로 grant/revoke 자동 기록. `status_incidents` 테이블 + 공개 인시던트 API 추가 (append-only).

## 공개 투명성 URL

보안·컴플라이언스·운영 투명성 관련 공개 URL 을 한 화면에 모았습니다:

- **/trust** — 통합 신뢰 센터 (본 문서 + /status + /legal/* + /changelog + /api-docs 라우팅 허브)
- **/status** — 실시간 헬스체크 + SLO 5종 + 최근 30일 인시던트 이력
- **/changelog** — 공개 릴리스 노트 (Atom 피드 `/changelog/feed.xml`)
- **/api-docs** — 공개 API 레퍼런스
- **/.well-known/security.txt** — RFC 9116 본 문서 보안 제보 경로 (machine-readable)

## Acknowledgements

취약점을 책임있게 제보해 주신 연구자 목록. 제보자 본인이 공개를 원하지 않으면 비공개 유지합니다.

- (아직 없음 — 첫 번째 제보자가 되어 주시면 이곳에 이름 또는 핸들을 등재해 드립니다.)

---

**마지막 업데이트**: 2026-04-22
