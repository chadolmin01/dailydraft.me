# Secret Rotation Runbook

**문서 유형**: 운영 런북 (Operations Runbook)
**적용 대상**: Draft 프로덕션 환경 (Vercel + Supabase + 외부 API 크레덴셜)
**담당**: 운영 책임자 (현재: Lee Sungmin)
**분기별 정기 로테이션**: Q1/Q2/Q3/Q4 첫 월요일 02:00 KST
**긴급 로테이션**: 시크릿 유출 의심 즉시

---

## 1. 범위 (Scope)

### 1.1 로테이션 대상 시크릿 (우선순위 순)

| 시크릿 | 저장 위치 | 영향 범위 | 로테이션 권장 주기 |
|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env (Production/Preview) | DB 전체 접근 | 분기 1회 |
| `TOKEN_ENCRYPTION_KEY` | Vercel env (Production/Preview) | OAuth 토큰 복호화 | 연 1회 (신중) |
| `THREADS_CLIENT_SECRET` | Vercel env | Meta Threads API | 유출 의심 시 |
| `CRON_SECRET` | Vercel env | 내부 cron 인증 | 분기 1회 |
| `DISCORD_BOT_TOKEN` | Vercel env | Discord 봇 동작 | 유출 의심 시 |
| `ANTHROPIC_API_KEY` | Vercel env | Claude API | 반기 1회 |
| `GOOGLE_AI_API_KEY` | Vercel env | Gemini API | 반기 1회 |
| `RESEND_API_KEY` | Vercel env | 이메일 발송 | 반기 1회 |
| `SENTRY_AUTH_TOKEN` | Vercel env (도입 시) | 에러 보고 | 반기 1회 |

### 1.2 로테이션 비대상 (순수 공개 값)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 공개 의도. 필요 시 프로젝트 URL 통째 교체.
- `NEXT_PUBLIC_POSTHOG_KEY`: 공개 분석 키.
- `NEXT_PUBLIC_APP_URL`: 도메인 변경 시에만.

---

## 2. 분기별 정기 로테이션 절차

### 2.1 사전 점검 (D-1)

- [ ] `docs/meta-app-review/security-architecture.md` §7 Secrets Management 섹션을 열어 최신 인벤토리 확인.
- [ ] Vercel 대시보드 → Project Settings → Environment Variables 탭 진입.
- [ ] Supabase 대시보드 → Settings → API 탭 진입.
- [ ] 로테이션 일정·담당자·롤백 계획을 팀 채널에 공지 (최소 24시간 전).

### 2.2 실행 단계 — `SUPABASE_SERVICE_ROLE_KEY`

1. **새 키 발급**: Supabase Dashboard → Settings → API → **Reset service_role key**.
2. **Preview 환경에 먼저 반영**:
   - Vercel → Settings → Environment Variables → `SUPABASE_SERVICE_ROLE_KEY` (Preview) 수정.
   - Preview 배포 트리거 (feat/* 브랜치에 더미 커밋 푸시 또는 `vercel --env=preview` 수동).
   - 스모크 테스트: `/api/health` 200 + `/me/data` JSON 내보내기 동작 확인.
3. **Production 반영**:
   - Vercel → Production `SUPABASE_SERVICE_ROLE_KEY` 수정.
   - Redeploy **production** (Vercel 대시보드 → Redeploy).
   - 5분간 `/api/health` 와 주요 API 엔드포인트 200 응답 모니터링.
4. **롤백 조건**:
   - `/api/health` 5분 이상 5xx → 이전 키 값으로 복귀.
   - 구 키는 Supabase 에서 즉시 revoke (재활성화 불가).
5. **감사 로그**: `audit_logs` 에 `action: 'secret.rotate.supabase_service_role'` 삽입 (수동 SQL).

### 2.3 실행 단계 — `TOKEN_ENCRYPTION_KEY`

**경고**: 이 키는 저장된 OAuth 토큰의 복호화에 쓰이므로 **단순 교체 시 모든 연결이 끊어짐**. 안전 교체는 dual-key 전략 필수.

1. **현재 전략**: 미구현 (Q3 2026 로드맵).
2. **임시 정책**: 유출 의심 시에만 교체하며, 다음 절차로 진행:
   - [ ] 모든 `persona_channel_credentials.active = false` 업데이트 (전체 재연결 요구).
   - [ ] 유저에게 "외부 채널 재연결 필요" 공지 (이메일 + 인앱 배너).
   - [ ] 새 키 발급 후 Vercel env 교체 + Production 재배포.
   - [ ] 구 키로 암호화된 토큰 행을 관리자 스크립트로 hard-delete.
3. **Q3 2026 dual-key 전략**: `TOKEN_ENCRYPTION_KEY_PRIMARY` + `TOKEN_ENCRYPTION_KEY_SECONDARY` 동시 지원하는 `src/lib/personas/token-crypto.ts` 업그레이드 후 점진 마이그레이션.

### 2.4 실행 단계 — `CRON_SECRET`

1. **새 값 생성**: `openssl rand -base64 32` 로 32바이트 랜덤.
2. **Vercel Production env 수정** 후 즉시 재배포.
3. **검증**: 다음 `vercel.json` crons 스케줄된 엔드포인트가 다음 트리거 시점에 401 반환하지 않는지 모니터링.
4. **롤백 조건**: cron 엔드포인트가 24시간 이상 실패 → 이전 값 복귀.

### 2.5 실행 단계 — 외부 API 키 (`THREADS_CLIENT_SECRET`, `ANTHROPIC_API_KEY`, 등)

- **Threads**: Meta for Developers Dashboard → 본인 앱 → Settings → App Secret → Reset.
- **Anthropic**: Console → API Keys → 신규 발급 후 구 키 삭제 (7일 grace period 있음).
- **Google AI**: AI Studio → API Keys → 신규 생성 후 기존 삭제.
- **Resend**: Dashboard → API Keys → Rotate.
- 공통 후속: Vercel Production env 교체 → 재배포 → 관련 엔드포인트 스모크 테스트.

---

## 3. 긴급 로테이션 절차 (유출 의심 시)

### 3.1 탐지 트리거

- GitHub Secret Scanning 알림 (저장소 설정 → Security → Secret scanning).
- `.github/workflows/secret-scan.yml` 에서 gitleaks/trufflehog 탐지.
- PostHog 또는 `error_logs` 에서 비정상 rate (특정 IP 의 대량 API 호출).
- Supabase Dashboard 의 비정상 DB 쿼리 패턴.

### 3.2 즉시 대응 (탐지 후 30분 내)

1. **격리**: 의심 키를 모든 환경(Production/Preview/Dev) 에서 **즉시 revoke**.
2. **새 키 발급**: 각 제공자 콘솔에서 새 값 생성.
3. **Vercel env 교체 + 재배포**: Production 우선, Preview 뒤 순서.
4. **감사**: 다음 SQL 로 유출 기간 동안의 접근 로그 추출.
   ```sql
   select *
     from audit_logs
     where created_at > '유출 추정 시점'
       and action ~ '(profile|club|credential|payment)'
     order by created_at desc;
   ```
5. **통보**: 영향 받은 데이터 주체가 있으면 `personal_data_breach` 카테고리로 PIPA 제34조 통지 준비 (72시간 이내 개인정보 보호위원회 신고).

### 3.3 사후 분석 (유출 확인 후 72시간 이내)

- [ ] 사건 요약서 작성 (탐지 → 격리 → 복구 타임라인).
- [ ] 원인 분석: 어떻게 누출됐는가 (commit, logs, social engineering).
- [ ] 재발 방지: CI 체크 강화, 코드 리뷰 정책 업데이트, 2FA 점검.
- [ ] `status_incidents` 테이블에 공개 인시던트 레코드 추가 (`/status` 노출).
- [ ] 해당 카테고리 시크릿을 분기 1회 → 월 1회 로테이션으로 일시 상향.

---

## 4. 감사 추적 (Audit Trail)

### 4.1 기록 원칙

모든 로테이션은 `audit_logs` 테이블에 다음 스키마로 기록:

```typescript
writeAuditLog(admin, {
  actorUserId: 'Lee Sungmin의 user_id',      // 수행자
  action: 'secret.rotate.<키이름>',            // 예: 'secret.rotate.supabase_service_role'
  targetType: 'environment',
  targetId: 'production',                     // 또는 'preview'
  context: {
    trigger: 'scheduled' | 'emergency',
    reason: '분기 정기 로테이션' | '유출 의심',
    rollback_plan: '이전 키 5분간 병행 유지',
  },
})
```

### 4.2 정기 감사

- [ ] 분기 종료 시: 해당 분기 `secret.rotate.*` 로그를 감사 보고서로 export.
- [ ] 로테이션 누락 키 체크: `docs/operations/secret-rotation-runbook.md` §1.1 테이블 대조.
- [ ] 감사 보고서는 `docs/audits/secret-rotation-<YYYY-Qn>.md` 로 커밋.

---

## 5. 참고

- **관련 문서**:
  - `docs/meta-app-review/security-architecture.md` §3 Token Cryptography, §7 Secrets Management
  - `docs/meta-app-review/compliance-attestation.md` §9 Technical Controls
- **관련 코드**:
  - `src/lib/personas/token-crypto.ts` — AES-256-GCM 구현 (Q3 2026 dual-key 전환 예정)
  - `src/lib/supabase/admin.ts` — service-role 클라이언트
  - `src/lib/audit/index.ts` — 감사 로그 쓰기 유틸
- **외부 레퍼런스**:
  - OWASP Cheat Sheet: Secret Management
  - NIST SP 800-57 Part 1: Key Management Recommendations

---

**최종 개정**: 2026-04-21
**다음 정기 리뷰**: 2026-07-21 (분기 전환 시 런북 자체의 노후화 점검)
