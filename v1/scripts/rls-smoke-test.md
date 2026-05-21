# RLS Hardening Smoke Test (5분)

`20260419000000_rls_hardening_critical.sql` 배포 직후 아래 순서대로 수동 점검.
문제 발견 시 즉시 공유 — rollback 판단 (`20260419000001_revert_rls_hardening.sql.draft`).

## 로그인 상태 (본인 = FLIP 멤버 + 운영자)

- [ ] **1. Explore People 탭 정상**
      https://dailydraft.me/explore → People 탭 → 프로필 카드 30개 수준 표시 (현 데이터 기준 전원 public)
      👉 0개면 이상. Vercel Logs 에서 `/api/explore/people` 500 확인.

- [ ] **2. FLIP 클럽 멤버 목록 보임**
      https://dailydraft.me/clubs/flip → 멤버 섹션 29명 다 보이는지
      👉 0명이거나 본인만 보이면 `is_club_member` 헬퍼 또는 정책 오작동.

- [ ] **3. FLIP 페르소나/설정 진입**
      https://dailydraft.me/clubs/flip/settings → 페르소나/멤버 관리 탭 전환 OK
      👉 에러 페이지면 pending_discord_setups 조회 체인에서 RLS 충돌.

- [ ] **4. 본인 프로필 편집**
      https://dailydraft.me/profile/[본인 슬러그] → 편집 버튼 → 저장 → 반영 확인
      👉 저장 실패면 `profiles_update_self` WITH CHECK 충돌.

## 로그아웃 상태 (비로그인 anon)

- [ ] **5. Explore 로딩**
      시크릿창에서 https://dailydraft.me/explore → 에러 없이 public 프로필만 표시
      👉 500 에러면 SSR prefetch 에서 RLS 결과 빈 배열 핸들링 실패 가능성.

- [ ] **6. /clubs/flip 공개 페이지**
      시크릿창에서 https://dailydraft.me/clubs/flip → 클럽 기본 정보는 보이고 멤버 목록은 빈 상태 or "로그인 필요"
      👉 클럽 이름/설명까지 안 보이면 `clubs` 테이블 정책 확인 필요 (이번 마이그레이션 범위 외).

## Vercel Logs 5분 모니터링

- [ ] https://vercel.com/[팀]/draft/logs → Runtime Logs
- [ ] `/api/` 경로에서 500 스파이크 없는지
- [ ] `row-level security` 또는 `new row violates` 에러 없는지

## 검증 스크립트

```bash
cd main && node scripts/rls-audit.mjs
```

**예상 결과 (anon key 로 접근 시)**:
- profiles: 30 (전원 public 이라 그대로 보임) 또는 0 (정책 작동)
- club_members: 0 (로그아웃 상태라)
- pending_discord_setups: 0
- member_activity_stats: 0
- bot_interventions: 0

## 문제 발생 시

1. 어떤 항목이 깨졌는지 메시지로 공유
2. 시나리오별 복구 (plan file 참조):
   - Explore 빈약 → profile_visibility default 변경
   - 클럽 멤버 안 보임 → `is_club_member` 체크 + 정책 보강
   - pending_discord 연동 깨짐 → admin client 전환
3. 핵 옵션: `.draft` 확장자 제거 → `supabase db push` → 원상복귀 (PII 재노출)
