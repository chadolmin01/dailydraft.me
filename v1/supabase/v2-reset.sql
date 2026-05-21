-- ============================================================
-- V2 RESET SQL — Supabase Dashboard SQL Editor 에서 실행
-- ============================================================
-- 목적: 기존 public 스키마 전체를 비우고 V2 스키마 적용을 위한 빈 상태로 되돌림
-- 적용 위치: https://supabase.com/dashboard/project/prxqjiuibfrmuwwmkhqb/sql/new
-- 실행 전 확인: 보존할 데이터가 정말 없는지 한 번 더 점검할 것
--
-- 주의:
--   1) 이 스크립트는 되돌릴 수 없음 (archive/m6-model 브랜치에 코드/마이그레이션 스냅샷 보관됨)
--   2) auth.users, storage.objects 는 별도 선택 — 아래 섹션 주석 참고
--   3) 실행 후 Supabase Dashboard → Database → Tables 에서 public 스키마가 비었는지 확인
-- ============================================================

-- [1] public 스키마 전체 drop + 재생성
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- [2] Supabase 표준 권한 복원
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO postgres, service_role;

-- [3] (선택) 인증 유저 삭제 — V2 가 새 유저 모델을 쓴다면 주석 해제
--     주의: auth.users 를 비우면 기존 로그인 세션 전부 무효화됨
-- DELETE FROM auth.users;

-- [4] (선택) Storage 객체 삭제 — 업로드된 파일 모두 제거
--     버킷 자체는 남고 객체만 삭제. 버킷도 지우려면 Dashboard → Storage 에서 수동
-- DELETE FROM storage.objects;

-- [5] Supabase 내부 마이그레이션 이력 초기화
--     supabase db push 가 "이미 적용됨" 으로 판단하지 않도록 초기화
DELETE FROM supabase_migrations.schema_migrations;

-- 완료 후 확인 쿼리:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- → 0 rows 가 정상
