-- ============================================================
-- H1: UPDATE 정책 WITH CHECK 미러링 (2026-04-20)
-- ============================================================
-- 2026-04-18 감사 H1. UPDATE 정책 20+개가 WITH CHECK 없이 USING만 보유.
-- 대표 공격: Club A admin이 UPDATE club_members SET club_id='Club B' WHERE id='self row'
-- → Club B로 자기 주입 (USING은 통과, WITH CHECK 없어 저지되지 않음).
-- 또는 applications.applicant_id 교체, accepted_connections.creator 교체 등 cross-org 오염.
--
-- 수정: 모든 UPDATE 정책의 USING 조건을 WITH CHECK 에도 복사 (미러링).
-- 의도: "행 진입 조건 == 행 나갈 수 있는 조건" 을 강제해서 pivot 차단.
--
-- 제외:
-- - storage.objects — supabase 관리 schema, 별도 대응
-- - SELECT ... FOR UPDATE 락 힌트 (정책 아님)
-- - team_tasks_update_member — 20260420190000 에서 이미 수정
-- ============================================================


-- ============================================================
-- 1) baseline untracked tables (20260318130000)
-- ============================================================

-- applications: applicant 또는 creator 둘 다 업데이트 가능 → pivot 방지 위해 동일 조건 미러
DROP POLICY IF EXISTS "applications_update" ON public.applications;
CREATE POLICY "applications_update" ON public.applications
  FOR UPDATE
  USING (
    auth.uid() = applicant_id
    OR auth.uid() IN (SELECT creator_id FROM public.opportunities WHERE id = opportunity_id)
  )
  WITH CHECK (
    auth.uid() = applicant_id
    OR auth.uid() IN (SELECT creator_id FROM public.opportunities WHERE id = opportunity_id)
  );

-- accepted_connections: creator 만 업데이트. applicant_id / opportunity_id 교체 방어.
DROP POLICY IF EXISTS "accepted_connections_update" ON public.accepted_connections;
CREATE POLICY "accepted_connections_update" ON public.accepted_connections
  FOR UPDATE
  USING (auth.uid() = opportunity_creator_id)
  WITH CHECK (auth.uid() = opportunity_creator_id);

-- event_notifications: user_id 소유자만
DROP POLICY IF EXISTS "event_notifications_update" ON public.event_notifications;
CREATE POLICY "event_notifications_update" ON public.event_notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- event_applications: user_id 소유자만
DROP POLICY IF EXISTS "event_applications_update" ON public.event_applications;
CREATE POLICY "event_applications_update" ON public.event_applications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- notification_settings: user_id 소유자만
DROP POLICY IF EXISTS "notification_settings_update" ON public.notification_settings;
CREATE POLICY "notification_settings_update" ON public.notification_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- team_checklists: opportunity creator 또는 accepted applicant. opportunity_id pivot 방지 중요.
DROP POLICY IF EXISTS "team_checklists_update" ON public.team_checklists;
CREATE POLICY "team_checklists_update" ON public.team_checklists
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT creator_id FROM public.opportunities WHERE id = opportunity_id
      UNION
      SELECT applicant_id FROM public.accepted_connections WHERE opportunity_id = team_checklists.opportunity_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT creator_id FROM public.opportunities WHERE id = opportunity_id
      UNION
      SELECT applicant_id FROM public.accepted_connections WHERE opportunity_id = team_checklists.opportunity_id
    )
  );

-- team_announcements: author 본인만 수정 (delete 는 author 또는 opportunity creator)
DROP POLICY IF EXISTS "team_announcements_update" ON public.team_announcements;
CREATE POLICY "team_announcements_update" ON public.team_announcements
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);


-- ============================================================
-- 2) portfolio_items + project_invitations (20260318120000)
-- ============================================================

DROP POLICY IF EXISTS "portfolio_update" ON public.portfolio_items;
CREATE POLICY "portfolio_update" ON public.portfolio_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- project_invitations: 초대받은 사람만 상태 업데이트 (수락/거절). invited_user_id 위조 방어.
DROP POLICY IF EXISTS "Invited users can update invitation status" ON public.project_invitations;
CREATE POLICY "Invited users can update invitation status" ON public.project_invitations
  FOR UPDATE
  USING (auth.uid() = invited_user_id)
  WITH CHECK (auth.uid() = invited_user_id);


-- ============================================================
-- 3) institutions + institution_members (20260325140000 덮어쓰기)
-- ============================================================
-- get_user_admin_institution_ids() SECURITY DEFINER 헬퍼 재사용.

DROP POLICY IF EXISTS inst_members_update_admin ON institution_members;
CREATE POLICY inst_members_update_admin ON institution_members
  FOR UPDATE
  USING (
    institution_id IN (SELECT get_user_admin_institution_ids(auth.uid()))
    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  )
  WITH CHECK (
    institution_id IN (SELECT get_user_admin_institution_ids(auth.uid()))
    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );

DROP POLICY IF EXISTS institutions_update_admin ON institutions;
CREATE POLICY institutions_update_admin ON institutions
  FOR UPDATE
  USING (
    id IN (SELECT get_user_admin_institution_ids(auth.uid()))
    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  )
  WITH CHECK (
    id IN (SELECT get_user_admin_institution_ids(auth.uid()))
    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );


-- ============================================================
-- 4) clubs + club_members + 주변 테이블 (20260410120000 ~ 20260414140000)
-- ============================================================
-- 감사 H1 의 대표 공격 벡터. club_id pivot 원천 차단.

DROP POLICY IF EXISTS clubs_update_admin ON clubs;
CREATE POLICY clubs_update_admin ON clubs
  FOR UPDATE
  USING (is_club_admin(id, auth.uid()))
  WITH CHECK (is_club_admin(id, auth.uid()));

DROP POLICY IF EXISTS club_members_update_admin ON club_members;
CREATE POLICY club_members_update_admin ON club_members
  FOR UPDATE
  USING (is_club_admin(club_id, auth.uid()))
  WITH CHECK (is_club_admin(club_id, auth.uid()));

DROP POLICY IF EXISTS invite_codes_update_admin ON club_invite_codes;
CREATE POLICY invite_codes_update_admin ON club_invite_codes
  FOR UPDATE
  USING (is_club_admin(club_id, auth.uid()))
  WITH CHECK (is_club_admin(club_id, auth.uid()));

DROP POLICY IF EXISTS notification_channels_update_admin ON club_notification_channels;
CREATE POLICY notification_channels_update_admin ON club_notification_channels
  FOR UPDATE
  USING (is_club_admin(club_id, auth.uid()))
  WITH CHECK (is_club_admin(club_id, auth.uid()));

DROP POLICY IF EXISTS discord_channels_update_admin ON discord_team_channels;
CREATE POLICY discord_channels_update_admin ON discord_team_channels
  FOR UPDATE
  USING (is_club_admin(club_id, auth.uid()))
  WITH CHECK (is_club_admin(club_id, auth.uid()));

-- weekly_update_drafts: target_user 본인만 수정. target_user_id 교체 방어.
DROP POLICY IF EXISTS drafts_update_own ON weekly_update_drafts;
CREATE POLICY drafts_update_own ON weekly_update_drafts
  FOR UPDATE
  USING (target_user_id = auth.uid())
  WITH CHECK (target_user_id = auth.uid());

DROP POLICY IF EXISTS "club_ghostwriter_settings_update" ON club_ghostwriter_settings;
CREATE POLICY "club_ghostwriter_settings_update" ON club_ghostwriter_settings
  FOR UPDATE
  USING (is_club_admin(club_id, auth.uid()))
  WITH CHECK (is_club_admin(club_id, auth.uid()));

DROP POLICY IF EXISTS "discord_role_mappings_update" ON discord_role_mappings;
CREATE POLICY "discord_role_mappings_update" ON discord_role_mappings
  FOR UPDATE
  USING (is_club_admin(club_id, auth.uid()))
  WITH CHECK (is_club_admin(club_id, auth.uid()));

DROP POLICY IF EXISTS harness_connectors_update_admin ON club_harness_connectors;
CREATE POLICY harness_connectors_update_admin ON club_harness_connectors
  FOR UPDATE
  USING (is_club_admin(club_id, auth.uid()))
  WITH CHECK (is_club_admin(club_id, auth.uid()));

DROP POLICY IF EXISTS "club_announcements_update" ON club_announcements;
CREATE POLICY "club_announcements_update" ON club_announcements
  FOR UPDATE
  USING (is_club_admin(club_id, auth.uid()))
  WITH CHECK (is_club_admin(club_id, auth.uid()));


-- ============================================================
-- 5) personas + persona_templates (20260418120000, 20260418160000)
-- ============================================================
-- can_edit_persona / can_edit_persona_owner SECURITY DEFINER 헬퍼 재사용.

DROP POLICY IF EXISTS personas_update_editable ON personas;
CREATE POLICY personas_update_editable ON personas
  FOR UPDATE
  USING (can_edit_persona(id, auth.uid()))
  WITH CHECK (can_edit_persona(id, auth.uid()));

DROP POLICY IF EXISTS persona_templates_update ON persona_templates;
CREATE POLICY persona_templates_update ON persona_templates
  FOR UPDATE
  USING (can_edit_persona_owner(type, owner_id, auth.uid()))
  WITH CHECK (can_edit_persona_owner(type, owner_id, auth.uid()));


-- ============================================================
-- 검증 (수동 실행용)
-- ============================================================
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE cmd = 'UPDATE' AND schemaname = 'public'
--   AND (with_check IS NULL OR with_check = '')
-- ORDER BY tablename, policyname;
-- → 위 쿼리 결과에 아직 남은 row 가 있으면 추가 하드닝 필요.
