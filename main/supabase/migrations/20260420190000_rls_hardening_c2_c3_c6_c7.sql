-- ============================================================
-- RLS Hardening — CRITICAL C2/C3/C6/C7 (2026-04-20)
-- ============================================================
-- 2026-04-18 secure 감사에서 CRITICAL 로 분류된 7개 중
-- C1/C4/C5 는 20260419000000_rls_hardening_critical.sql 에서 처리됨.
-- 남은 C2/C3/C6/C7 을 이 파일에서 마무리.
--
-- 실측 (scripts/rls-audit.mjs, 2026-04-20):
-- - error_logs / direct_messages: anon SELECT 0 rows. 테이블은 존재하지만 마이그레이션에 정책 없음 (drift).
-- - personas INSERT: 기존 정책은 auth.uid() 체크만. owner_id 검증 없음 → 브랜드 보이스 하이재킹 벡터.
-- - team_tasks UPDATE: USING만 있고 WITH CHECK 없음 → cross-club 오염 벡터.
--
-- 원칙: IF NOT EXISTS / DROP IF EXISTS / SECURITY DEFINER 헬퍼 재활용.
-- ============================================================


-- ============================================================
-- C2. error_logs — 서버 로그(PII 포함 가능) anon 차단 + admin 읽기
-- ============================================================
-- 실측상 anon 0 rows 이지만 마이그레이션에 explicit policy 없어 drift 위험.
-- 명시 정책으로 의도 잠금.

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS error_logs_select_admin ON error_logs;
DROP POLICY IF EXISTS error_logs_insert_service ON error_logs;

-- SELECT: platform admin 만. app_metadata.is_admin 클레임 기반.
-- 주의: H4 에 나온 것처럼 JWT 클레임 기반은 edge function claim elevation 시 우회 가능 —
-- 장기적으로는 is_platform_admin() SECURITY DEFINER 함수로 교체 필요. 현재는 기존 admin 체크 패턴과 동일 유지.
CREATE POLICY error_logs_select_admin ON error_logs
  FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );

-- INSERT/UPDATE/DELETE: policy 생략 = anon/authenticated 에 차단. service_role (BYPASSRLS) 는 계속 쓸 수 있음.
-- error-logging/index.ts 는 admin client 사용하므로 영향 없음.


-- ============================================================
-- C3. direct_messages — sender/receiver 본인만 접근
-- ============================================================
-- 실측상 anon 0 rows 이지만 마이그레이션에 정책 없음.
-- 가능한 작업: SELECT/INSERT/UPDATE (read·soft-delete). DELETE 는 soft-delete 로 처리하므로 차단.

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS direct_messages_select_own ON direct_messages;
DROP POLICY IF EXISTS direct_messages_insert_as_sender ON direct_messages;
DROP POLICY IF EXISTS direct_messages_update_participant ON direct_messages;

-- SELECT: 본인이 sender 또는 receiver 인 쪽지만.
CREATE POLICY direct_messages_select_own ON direct_messages
  FOR SELECT
  USING (
    auth.uid() = sender_id
    OR auth.uid() = receiver_id
  );

-- INSERT: sender_id 는 반드시 본인. 위조 방어.
CREATE POLICY direct_messages_insert_as_sender ON direct_messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- UPDATE: 참여자만 is_read/deleted_by_* 수정 가능.
-- WITH CHECK 미러링 — sender/receiver 를 바꿔치기해서 대화 탈취 방지.
CREATE POLICY direct_messages_update_participant ON direct_messages
  FOR UPDATE
  USING (
    auth.uid() = sender_id
    OR auth.uid() = receiver_id
  )
  WITH CHECK (
    auth.uid() = sender_id
    OR auth.uid() = receiver_id
  );

-- DELETE: policy 없음 = hard-delete 차단. soft-delete(deleted_by_*) 는 UPDATE 로 처리.


-- ============================================================
-- C6. personas INSERT — owner_id 검증 추가
-- ============================================================
-- 기존 (20260418120000:309-317):
--   WITH CHECK (auth.uid() IS NOT NULL AND (created_by IS NULL OR created_by = auth.uid()))
-- 문제: type='club' 인데 owner_id 에 아무 클럽 UUID 넣을 수 있음 → 타 클럽의 active persona 삽입 → 브랜드 보이스 하이재킹.
--
-- 해결: can_create_persona(type, owner_id, uid) 헬퍼를 만들어 type 별로 owner 에 대한 권한 검증.
-- 현재 프로덕션 INSERT 경로는 app/api/personas/route.ts 가 admin client(service_role) 로 진행 → RLS 우회.
-- 따라서 이 정책은 "직접 PostgREST 로 insert 시도" 를 막는 safety net.

CREATE OR REPLACE FUNCTION can_create_persona(p_type text, p_owner_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL OR p_owner_id IS NULL OR p_type IS NULL THEN
    RETURN false;
  END IF;

  IF p_type = 'personal' THEN
    RETURN p_owner_id = p_user_id;
  ELSIF p_type = 'club' THEN
    RETURN is_club_admin(p_owner_id, p_user_id);
  ELSIF p_type = 'project' THEN
    RETURN EXISTS (
      SELECT 1 FROM opportunities
      WHERE id = p_owner_id
        AND (
          creator_id = p_user_id
          OR (club_id IS NOT NULL AND is_club_admin(club_id, p_user_id))
        )
    );
  END IF;

  RETURN false;
END;
$$;

DROP POLICY IF EXISTS personas_insert_authenticated ON personas;
DROP POLICY IF EXISTS personas_insert_with_ownership ON personas;

CREATE POLICY personas_insert_with_ownership ON personas
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (created_by IS NULL OR created_by = auth.uid())
    AND can_create_persona(type, owner_id, auth.uid())
  );


-- ============================================================
-- C7. team_tasks / team_resources / team_decisions / bot_interventions
--     UPDATE 정책에 WITH CHECK 미러 + 누락 정책 보강
-- ============================================================
-- 기존: team_tasks_update_member 는 USING 만 있고 WITH CHECK 없음.
--       club_id 를 다른 클럽 id 로 바꿔서 cross-club 오염 가능.
-- 수정: USING 과 동일한 조건을 WITH CHECK 에 복제.

-- team_tasks UPDATE
DROP POLICY IF EXISTS team_tasks_update_member ON team_tasks;

CREATE POLICY team_tasks_update_member ON team_tasks
  FOR UPDATE
  USING (is_club_member(club_id, auth.uid()))
  WITH CHECK (is_club_member(club_id, auth.uid()));

-- team_tasks INSERT — 기존 정책 없음. 클럽 멤버가 태스크 추가 가능해야 함.
-- (없으면 admin client 로만 가능. 프론트에서 직접 insert 한다면 현재 막혀 있음.)
-- 현재 app 에서 클라이언트가 직접 team_tasks 에 insert 하는지 모호하지만,
-- 방어 차원으로 "클럽 멤버만" 허용.
DROP POLICY IF EXISTS team_tasks_insert_member ON team_tasks;
CREATE POLICY team_tasks_insert_member ON team_tasks
  FOR INSERT
  WITH CHECK (is_club_member(club_id, auth.uid()));

-- team_tasks DELETE — 안전상 admin 만.
DROP POLICY IF EXISTS team_tasks_delete_admin ON team_tasks;
CREATE POLICY team_tasks_delete_admin ON team_tasks
  FOR DELETE
  USING (is_club_admin(club_id, auth.uid()));


-- team_resources — UPDATE/INSERT/DELETE 동일 패턴
DROP POLICY IF EXISTS team_resources_insert_member ON team_resources;
DROP POLICY IF EXISTS team_resources_update_member ON team_resources;
DROP POLICY IF EXISTS team_resources_delete_admin ON team_resources;

CREATE POLICY team_resources_insert_member ON team_resources
  FOR INSERT
  WITH CHECK (is_club_member(club_id, auth.uid()));

CREATE POLICY team_resources_update_member ON team_resources
  FOR UPDATE
  USING (is_club_member(club_id, auth.uid()))
  WITH CHECK (is_club_member(club_id, auth.uid()));

CREATE POLICY team_resources_delete_admin ON team_resources
  FOR DELETE
  USING (is_club_admin(club_id, auth.uid()));


-- team_decisions — 동일 패턴
DROP POLICY IF EXISTS team_decisions_insert_member ON team_decisions;
DROP POLICY IF EXISTS team_decisions_update_member ON team_decisions;
DROP POLICY IF EXISTS team_decisions_delete_admin ON team_decisions;

CREATE POLICY team_decisions_insert_member ON team_decisions
  FOR INSERT
  WITH CHECK (is_club_member(club_id, auth.uid()));

CREATE POLICY team_decisions_update_member ON team_decisions
  FOR UPDATE
  USING (is_club_member(club_id, auth.uid()))
  WITH CHECK (is_club_member(club_id, auth.uid()));

CREATE POLICY team_decisions_delete_admin ON team_decisions
  FOR DELETE
  USING (is_club_admin(club_id, auth.uid()));


-- bot_interventions — 쓰기 전부 service_role (policy 없음 = 차단). 변경 없음.
-- SELECT 정책은 기존 bot_interventions_select_member 유지 (20260419000000 에서 재정의됨).


-- ============================================================
-- 검증 쿼리 (수동 확인용)
-- ============================================================
-- anon key 로 아래 실행 시 전부 0 rows:
--   SELECT count(*) FROM error_logs;
--   SELECT count(*) FROM direct_messages;
--
-- authenticated 유저로 아래 실행 시 본인 관련만:
--   SELECT count(*) FROM direct_messages WHERE sender_id = auth.uid() OR receiver_id = auth.uid();
--
-- personas 삽입 시도 (authenticated, admin 아님):
--   INSERT INTO personas (type, owner_id, name) VALUES ('club', '<other-club-uuid>', 'x');
--   → 실패해야 함 (can_create_persona returns false)

COMMENT ON FUNCTION can_create_persona IS
  'C6 하드닝 (2026-04-20). personas INSERT 시 type별 owner 권한 검증. SECURITY DEFINER로 RLS 바깥에서 실행.';
