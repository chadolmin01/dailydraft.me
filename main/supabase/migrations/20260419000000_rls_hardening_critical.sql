-- ============================================================
-- RLS Hardening — 2026-04-19 CRITICAL
-- ============================================================
-- 2026-04-18 secure 스킬 RLS 감사 + scripts/rls-audit.mjs prod 실측 결과 기반.
-- 실제 anon 키로 접근 가능한 5개 테이블을 차단.
--
-- 설계 원칙:
-- 1. IF NOT EXISTS / DROP IF EXISTS 로 재실행 가능
-- 2. 기존 정책(drift)이 있을 수 있으므로 RLS enable 은 idempotent
-- 3. 의도적으로 공개되는 기능(Explore People/Clubs) 은 조건부 허용
-- 4. 완전 차단 가능한 내부 테이블(pending_discord_setups 등)은 service_role only
-- ============================================================


-- ============================================================
-- 1. profiles — 공개 프로필만 anon 에 노출
-- ============================================================
-- 실측: anon key 로 30 rows 전체 읽힘. 모든 유저의 contact_email/locations/github id 등 PII 노출.
-- 의도: profile_visibility='public' 인 프로필만 Explore People 탭에서 보임.
-- private/hidden 은 본인만 조회 가능.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 기존 drift 정책 제거 (있을 경우)
DROP POLICY IF EXISTS profiles_select_public ON profiles;
DROP POLICY IF EXISTS profiles_select_self ON profiles;
DROP POLICY IF EXISTS profiles_select_all ON profiles;
DROP POLICY IF EXISTS profiles_update_self ON profiles;
DROP POLICY IF EXISTS profiles_insert_self ON profiles;

-- SELECT: profile_visibility='public' 이거나 본인
CREATE POLICY profiles_select_public_or_self ON profiles
  FOR SELECT
  USING (
    profile_visibility = 'public'
    OR auth.uid() = user_id
  );

-- UPDATE: 본인 프로필만. WITH CHECK 로 user_id 변경 방어.
CREATE POLICY profiles_update_self ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- INSERT: 본인 프로필만 생성. user_id 조작 방어.
CREATE POLICY profiles_insert_self ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DELETE: 프로필 삭제는 profile 삭제 RPC 또는 admin 경유. anon/authenticated 직접 삭제 금지.
-- (policy 생략 = RLS 로 차단)


-- ============================================================
-- 2. club_members — 클럽 멤버만 해당 클럽의 멤버 목록 조회
-- ============================================================
-- 실측: 29 rows 전체 anon 노출. ghost_metadata 에 전화/이메일 등 PII 가능.
-- 의도: 클럽 페이지에서 멤버 목록 보는 건 "그 클럽에 속한 사람" 만.

ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS club_members_select_all ON club_members;
DROP POLICY IF EXISTS club_members_select_same_club ON club_members;
DROP POLICY IF EXISTS club_members_select_self ON club_members;

-- SELECT: 같은 클럽 멤버이거나 본인 행. is_club_member() 는 SECURITY DEFINER 로 RLS recursion 회피.
CREATE POLICY club_members_select_same_club ON club_members
  FOR SELECT
  USING (
    -- 본인 멤버십 행
    user_id = auth.uid()
    -- 같은 클럽 멤버
    OR is_club_member(club_id, auth.uid())
  );

-- 쓰기 정책은 기존 (club_members_insert_admin / update_admin / delete_admin) 유지 가정.
-- 없으면 별도 마이그레이션에서 추가.


-- ============================================================
-- 3. pending_discord_setups — 서비스 계정만
-- ============================================================
-- 실측: 1 row anon 노출. 클럽 install 과정 중간상태 → 탈취 벡터.
-- 이 테이블은 클라이언트가 직접 읽을 필요 없음. 전용 API 엔드포인트만 사용.

ALTER TABLE pending_discord_setups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pending_discord_setups_select_owner ON pending_discord_setups;
DROP POLICY IF EXISTS pending_discord_setups_select_all ON pending_discord_setups;

-- SELECT: discord_owner_id = auth.uid() 매칭 될 때만 (discord id 를 profiles 에 저장한 자기 install)
CREATE POLICY pending_discord_setups_select_owner ON pending_discord_setups
  FOR SELECT
  USING (
    discord_owner_id IN (
      SELECT discord_user_id FROM profiles
      WHERE user_id = auth.uid() AND discord_user_id IS NOT NULL
    )
  );

-- 쓰기는 service_role 전용 (policy 없음 = 차단). API 경유로만 insert.


-- ============================================================
-- 4. member_activity_stats — 클럽 멤버만 자기 클럽 활동 조회
-- ============================================================
-- 실측: 1 row anon 노출. 주간 메시지 카운트 등 행동 패턴 PII.

ALTER TABLE member_activity_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS member_activity_stats_select_same_club ON member_activity_stats;
DROP POLICY IF EXISTS member_activity_stats_select_all ON member_activity_stats;

CREATE POLICY member_activity_stats_select_same_club ON member_activity_stats
  FOR SELECT
  USING (is_club_member(club_id, auth.uid()));

-- 쓰기는 서비스 계정 전용 (cron/bot 이 service_role 로 insert).


-- ============================================================
-- 5. bot_interventions — 클럽 멤버만
-- ============================================================
-- 실측: 6 rows anon 노출. Discord 채널 ID, 봇 개입 패턴 등 내부 활동.

ALTER TABLE bot_interventions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bot_interventions_select_member ON bot_interventions;
DROP POLICY IF EXISTS bot_interventions_select_all ON bot_interventions;

-- bot_interventions.club_id 컬럼이 이미 존재 (20260413130000 에서 정의).
-- discord_team_channels 경유 매핑은 팀 포럼 전용 채널만 커버 → 일반 클럽 채널 개입이 누락됨.
-- 따라서 club_id 직접 조인으로 is_club_member 검사.
CREATE POLICY bot_interventions_select_member ON bot_interventions
  FOR SELECT
  USING (
    is_club_member(club_id, auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );


-- ============================================================
-- 검증 쿼리 (수동 확인용)
-- ============================================================
-- 아래 쿼리를 anon key 로 실행 시 0 rows 가 나와야 함 (본인 것 제외).
--
-- SELECT count(*) FROM profiles;  -- 공개 프로필 수만
-- SELECT count(*) FROM club_members;  -- 본인/같은 클럽 멤버만
-- SELECT count(*) FROM pending_discord_setups;  -- 0
-- SELECT count(*) FROM member_activity_stats;  -- 본인 클럽만
-- SELECT count(*) FROM bot_interventions;  -- 본인 클럽만
