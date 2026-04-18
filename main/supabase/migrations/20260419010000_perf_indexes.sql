-- ============================================================
-- Performance Indexes — 2026-04-19
-- ============================================================
-- RLS hardening 이후 쿼리 패턴 변화 + 기존 핫 쿼리 분석으로 식별된 누락 인덱스.
-- EXPLAIN ANALYZE 재현:
--   - Explore People: profiles WHERE profile_visibility='public' ORDER BY updated_at DESC
--   - Explore Opportunities: opportunities WHERE status='active' ORDER BY created_at DESC
--   - is_club_member() 헬퍼가 RLS 내부에서 club_members(club_id, user_id) 탐색
-- ============================================================


-- 1. profiles: Explore People 핵심 쿼리 최적화
-- 왜 partial index: profile_visibility 값 대부분 'public' 이라 값 기반 분기 불필요.
-- 전체 30 rows 수준에선 영향 작지만, 유저 규모 커질 때 바로 효과.
CREATE INDEX IF NOT EXISTS idx_profiles_public_updated
  ON profiles(updated_at DESC)
  WHERE profile_visibility = 'public';


-- 2. opportunities: Explore 메인 탭 + /api/opportunities 기본 쿼리
-- status='active' 필터 + created_at DESC 정렬 한 방에.
CREATE INDEX IF NOT EXISTS idx_opportunities_active_created
  ON opportunities(created_at DESC)
  WHERE status = 'active';


-- 3. club_members: is_club_member(club_id, auth.uid()) 헬퍼가 RLS 안에서
-- 매 row 마다 호출될 수 있음. 복합 인덱스로 lookup 한 번에.
-- status='active' 필터는 헬퍼가 쓸 수 있어서 partial.
CREATE INDEX IF NOT EXISTS idx_club_members_lookup
  ON club_members(club_id, user_id)
  WHERE status = 'active';


-- 4. bot_interventions: /api/clubs/[slug]/bot-activity 에서 지난 30일 조회.
-- 기존 idx_bot_interventions_club 은 club_id 단독이라 ORDER BY created_at 재정렬 필요.
CREATE INDEX IF NOT EXISTS idx_bot_interventions_club_created
  ON bot_interventions(club_id, created_at DESC);


-- 5. applications: 개별 지원서 조회 (opportunity_id + status + created_at)
-- Explore opportunity 카드의 지원 상태 표시용.
CREATE INDEX IF NOT EXISTS idx_applications_opp_created
  ON applications(opportunity_id, created_at DESC);
