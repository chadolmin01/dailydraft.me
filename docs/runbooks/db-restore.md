# DB 복구 Runbook

> 장애/사고 대응 절차. 1명이 혼자 실행 가능하게 작성.
> 최종 검증: 2026-04-20 (다음 리허설: 2026-05-20)

## 0. 적용 시점

- 데이터 손실 감지 (대량 delete, 잘못된 마이그레이션)
- Supabase 프로젝트 복구 불능
- 스테이징 환경 재구성

## 1. 백업 소스

| 소스 | 위치 | 보관 | 주기 |
|------|------|------|------|
| 1차 | Supabase 자동 PITR | Dashboard → Database → Backups | Pro 플랜만 (현재 없음) |
| 2차 | GitHub Actions artifact | Actions → Weekly DB Backup → Artifacts | 90일 | 매주 일요일 02:00 KST |
| 3차 | 로컬 `pg_dump` 수동 | 담당자 관리 | 수동 |

## 2. 복구 사전 점검

```bash
# 현재 연결 확인 (손상 범위 파악)
psql "postgres://postgres:<PW>@db.<REF>.supabase.co:5432/postgres" -c "SELECT count(*) FROM profiles;"

# 최근 백업 artifact 목록 (gh CLI 필요)
gh run list --workflow="Weekly DB Backup" --limit 5
# → 가장 최근 성공 run ID 확인
```

## 3. 복구 절차 (전체 DB)

### 3-1. 백업 다운로드

```bash
# 최근 성공 run 의 artifact 다운로드
gh run download <RUN_ID> --dir /tmp/backup
cd /tmp/backup

# 압축 해제
gunzip backup-YYYY-MM-DD.sql.gz
ls -lh backup-YYYY-MM-DD.sql
# 건전성 확인: COPY public.profiles 같은 statement 포함 여부
head -50 backup-YYYY-MM-DD.sql
```

### 3-2. 스테이징에서 복구 테스트 (필수)

**프로덕션에 바로 복구하지 말 것.** 반드시 스테이징에서 검증.

```bash
# 별도 Supabase 프로젝트 또는 로컬 postgres 컨테이너
docker run -d --name draft-restore-test \
  -e POSTGRES_PASSWORD=test -p 54333:5432 \
  postgres:15

# 복구 실행
PGPASSWORD=test psql -h localhost -p 54333 -U postgres -d postgres \
  < backup-YYYY-MM-DD.sql

# 무결성 확인
PGPASSWORD=test psql -h localhost -p 54333 -U postgres -d postgres -c "
  SELECT 
    (SELECT count(*) FROM profiles) as profiles,
    (SELECT count(*) FROM clubs) as clubs,
    (SELECT count(*) FROM club_members) as members,
    (SELECT count(*) FROM applications) as apps;
"
```

### 3-3. 프로덕션 복구 (스테이징 성공 후)

```bash
# ⚠️  DOWNTIME 발생 — 사전에 /status 페이지 공지 + Discord 알림

# 1) 앱 일시 중지 (Vercel 환경 변수로 MAINTENANCE_MODE=true)
# 2) 기존 데이터 백업 (이미 손상됐어도 증거)
pg_dump --host="db.<REF>.supabase.co" ... > pre-restore-$(date +%s).sql.gz

# 3) 복구
PGPASSWORD=<PW> psql \
  -h db.<REF>.supabase.co -p 5432 -U postgres -d postgres \
  < backup-YYYY-MM-DD.sql

# 4) 무결성 검증
npm run db:types:check   # 스키마 drift 재확인
node scripts/rls-audit.mjs  # RLS 정책 건재 확인

# 5) 앱 재개
```

## 4. 부분 복구 (특정 테이블만)

전체 복구가 과한 경우:

```bash
# 백업 파일에서 특정 테이블만 추출 (COPY statements)
awk '/COPY public\.profiles/,/^\\\\./' backup-YYYY-MM-DD.sql > profiles-only.sql

# 대상 테이블 truncate 후 로드
psql ... -c "TRUNCATE profiles CASCADE;"
psql ... < profiles-only.sql
```

## 5. 복구 후 체크리스트

- [ ] 유저 로그인 정상 동작
- [ ] /api/health ok 반환
- [ ] /status 페이지 모든 체크 ok
- [ ] 감사 로그 새 이벤트 수신
- [ ] Discord 봇 메시지 송수신 정상
- [ ] 크론 잡 (daily-dev-digest 등) 다음 주기 정상 실행
- [ ] 복구 이벤트 audit_logs 에 수동 기록

## 6. 리허설 일정

- **분기별 1회** 스테이징에서 전체 복구 실행 (다음: 2026-07-20)
- 매년 1회 실제 "금요일 오후 장애" 시나리오 tabletop 훈련

## 7. 연락처

- Supabase Support: support@supabase.io
- 팀 알림: Discord #ops 채널 (DISCORD_ALERT_WEBHOOK_URL)
- 담당자: 운영팀 (chadolmin01@gmail.com)

---

**참고**: 이 runbook 은 현재 Supabase Free 플랜 기준. Pro 플랜 전환 시 PITR 사용으로
전체 구조가 바뀜. Pro 전환 시 이 문서 전면 개정 필요.
