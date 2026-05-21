# V2 Migrations

이 폴더는 V2 스키마 마이그레이션이 적용되는 곳입니다.

## V2 시작 (2026-05-21)

- M6(=V1) 마이그레이션 134개는 `migrations_backup/` 로 이동됨
- M6 스키마 스냅샷: `archive/m6-model` 브랜치
- 라이브 DB 리셋: `main/supabase/v2-reset.sql` 을 Supabase Dashboard SQL 에디터에서 실행

## 새 마이그레이션 작성 규칙

`../README.md` 참조 — 14자리 타임스탬프 (`YYYYMMDDHHmmss_name.sql`), `IF NOT EXISTS` 필수.
