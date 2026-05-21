# V2 Migrations

V2 스키마 마이그레이션 위치.

## V2 시작 (2026-05-21)

- M6(=V1) 마이그레이션 134개는 `v1/supabase/migrations_backup/` 에 보존
- M6 스키마 / 코드 스냅샷: `archive/m6-model` 브랜치 (원격)
- 라이브 DB 리셋 SQL: `./v2-reset.sql` (Supabase Dashboard SQL 에디터에서 1회 실행)

## 새 마이그레이션 작성

```bash
# 네이밍: 14자리 타임스탬프 + 이름
# 예: 20260521120000_create_users_core.sql
```

- `IF NOT EXISTS` 필수 (재실행 가능)
- `DROP ... IF EXISTS` 필수 (트리거/함수 재정의 시)
- RLS 정책은 테이블 생성과 같은 파일에 묶기

## 적용

```bash
cd v2
supabase db push --linked  # 원격 적용
```
