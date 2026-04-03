-- ============================================================
-- 미사용 테이블 및 RPC 정리
-- 대상: 레거시/프로토타입 기능에서 남은 스키마 객체
-- 근거: 2026-04-03 DB 감사 — 코드 참조 없음 확인
-- ============================================================

-- ── RPC 제거 (테이블 의존성보다 먼저) ──────────────────────
DROP FUNCTION IF EXISTS calculate_final_score(smallint, integer, boolean, text);
DROP FUNCTION IF EXISTS calculate_startup_priority(integer, numeric, smallint, smallint);
DROP FUNCTION IF EXISTS find_similar_events(uuid, integer, double precision);
DROP FUNCTION IF EXISTS get_session_analytics_summary(integer);
DROP FUNCTION IF EXISTS get_top_startup_ideas(integer, text);
DROP FUNCTION IF EXISTS get_unread_notification_count(uuid);
DROP FUNCTION IF EXISTS get_user_subscription(uuid);
DROP FUNCTION IF EXISTS get_waitlist_count();
DROP FUNCTION IF EXISTS get_weekly_digest_events(uuid, integer, integer);
DROP FUNCTION IF EXISTS match_profiles_for_opportunity(text, double precision, integer, uuid);
DROP FUNCTION IF EXISTS match_profiles_for_opportunity(vector, double precision, integer, uuid);
DROP FUNCTION IF EXISTS recommend_events_with_embedding(uuid, integer);
DROP FUNCTION IF EXISTS update_startup_final_scores();

-- ── 테이블 제거 (CASCADE로 의존 RLS/트리거/인덱스 자동 제거) ──
DROP TABLE IF EXISTS waitlist CASCADE;
DROP TABLE IF EXISTS waitlist_signups CASCADE;
DROP TABLE IF EXISTS business_plans CASCADE;
DROP TABLE IF EXISTS prd_usage CASCADE;
DROP TABLE IF EXISTS prd_users CASCADE;
DROP TABLE IF EXISTS korea_startup_references CASCADE;
DROP TABLE IF EXISTS landing_subscribers CASCADE;
DROP TABLE IF EXISTS onboarding_status CASCADE;
DROP TABLE IF EXISTS fragments CASCADE;
