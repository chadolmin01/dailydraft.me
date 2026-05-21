-- v2-reset.sql 에서 ALTER DEFAULT PRIVILEGES 만 걸어둔 게 마이그레이션 실행 role 의
-- "미래 생성 객체" 에만 적용됨. 정작 supabase CLI 가 다른 role 로 v2_init 을 돌려서
-- 4개 테이블에 anon/authenticated 의 직접 GRANT 가 누락된 상태.
--
-- 증상: "permission denied for table workspaces" (RLS 정책 평가 전에 막힘)
-- 해결: 명시적 GRANT + 앞으로 추가될 테이블/시퀀스/함수에도 default privilege 재선언.

-- 1) 기존 4개 테이블에 즉시 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.folders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chats TO authenticated;
-- google_tokens 는 service_role 만 사용 — authenticated GRANT 안 함 (이중 방어)

-- service_role 은 모든 테이블 풀권한
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 2) 향후 추가될 테이블/시퀀스/함수에도 같은 default 적용 (postgres role 기준)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO service_role;
