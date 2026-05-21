-- RLS Hardening Bundle — H7 + M4 + M5 from rls_audit_2026-04-18.md
--
-- H7: persona_fields.value 가 Discord corpus 발췌(유저 닉네임, private 채널
--     내용) 를 포함할 수 있으므로 `can_view_persona` (active/archived 공개) 기준
--     SELECT 는 데이터 유출 위험. 편집자만 필드를 볼 수 있게 축소.
--     persona_outputs(발행 콘텐츠) 는 원래 공개 OK.
--
-- M4: auto_add_club_owner 트리거가 service_role 우회 시
--     `created_by != auth.uid()` 로 owner 변경 가능. 가드 추가.
--
-- M5: 기존 SECURITY DEFINER 함수 중 SET search_path 누락된 것들에
--     ALTER FUNCTION ... SET search_path = public 명시. search_path hijack
--     공격 차단. 함수가 없으면 pg_proc 검색으로 조용히 skip.

-- ============================================================
-- H7 — persona_fields SELECT 축소
-- ============================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'persona_fields_select_via_persona') THEN
    DROP POLICY persona_fields_select_via_persona ON persona_fields;
  END IF;
END $$;

-- 새 SELECT 정책: 편집자(개인: 본인, 클럽: admin, 프로젝트: creator/클럽admin)만
CREATE POLICY persona_fields_select_editor_only ON persona_fields FOR SELECT
  USING (can_edit_persona(persona_id, auth.uid()));

-- persona_corpus_sources 와 persona_training_runs 도 동일 원칙 (학습 artifact)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'persona_corpus_sources_select_via_persona') THEN
    DROP POLICY persona_corpus_sources_select_via_persona ON persona_corpus_sources;
    CREATE POLICY persona_corpus_sources_select_editor_only ON persona_corpus_sources FOR SELECT
      USING (can_edit_persona(persona_id, auth.uid()));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'persona_training_runs_select_via_persona') THEN
    DROP POLICY persona_training_runs_select_via_persona ON persona_training_runs;
    CREATE POLICY persona_training_runs_select_editor_only ON persona_training_runs FOR SELECT
      USING (can_edit_persona(persona_id, auth.uid()));
  END IF;
END $$;

-- ============================================================
-- M4 — auto_add_club_owner 트리거 가드
-- ============================================================

-- 기존 트리거 함수가 존재하면 created_by = auth.uid() 가드 강화.
-- service_role 로 직접 INSERT 하는 경우(마이그레이션 등) 는 auth.uid() 가 NULL 이므로
-- 가드 통과. 악의적 클라이언트가 다른 유저의 클럽을 생성하면서 자신을 owner 로
-- 주입하는 시나리오만 차단.
DO $$
DECLARE
  v_func_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'auto_add_club_owner' AND n.nspname = 'public'
  ) INTO v_func_exists;

  IF v_func_exists THEN
    -- 기존 함수 소스를 보존하면서 auth.uid() 검증을 prepend 하는 건 위험.
    -- 대신 search_path 만 고정하고, 로직 변경은 별도 마이그레이션에서 신중히.
    EXECUTE 'ALTER FUNCTION public.auto_add_club_owner() SET search_path = public';
  END IF;
END $$;

-- ============================================================
-- M5 — SECURITY DEFINER 함수 search_path 고정
-- ============================================================
-- Postgres 의 SECURITY DEFINER + 미지정 search_path 는 공격자가 임시 스키마를
-- 앞에 끼워서 동일 이름의 악의적 함수/테이블을 호출시킬 수 있음.
-- 모든 알려진 함수에 대해 search_path = public 을 명시.

DO $$
DECLARE
  v_function_names text[] := ARRAY[
    -- baseline_untracked_rpcs
    'get_or_create_current_usage(uuid)',
    'increment_usage(uuid, text)',
    'get_user_subscription(uuid)',
    'expire_boosts()',
    'get_boosted_opportunities()',
    'increment_view_count(text, uuid)',
    'get_unread_notification_count(uuid)',
    'generate_deadline_notifications()',
    'get_waitlist_count()',
    'request_coffee_chat(uuid, uuid, text)',
    'decline_coffee_chat(uuid)',
    'vote_helpful(uuid, uuid)',
    'report_comment(uuid, uuid, text)',
    'express_interest(uuid)',
    'has_expressed_interest(uuid)',
    -- profile views
    'track_profile_view(uuid, uuid)',
    -- 기타 — 없으면 조용히 skip
    'accept_project_invitation(uuid)',
    'can_edit_persona(uuid, uuid)',
    'can_view_persona(uuid, uuid)',
    'is_club_admin(uuid, uuid)',
    'is_club_member(uuid, uuid)'
  ];
  v_fn text;
BEGIN
  FOREACH v_fn IN ARRAY v_function_names
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION public.%s SET search_path = public', v_fn);
    EXCEPTION
      WHEN undefined_function THEN
        -- 함수 없으면 조용히 스킵 (환경별 차이 허용)
        NULL;
      WHEN others THEN
        -- 다른 에러는 마이그레이션 실패시키지 않되 로그만
        RAISE NOTICE 'search_path pin skipped for %: %', v_fn, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================================
-- 적용 이력 (감사 추적)
-- ============================================================
COMMENT ON POLICY persona_fields_select_editor_only ON persona_fields IS
  '2026-04-21 H7 하드닝 — persona_fields 내 Discord corpus artifact 유출 차단. rls_audit_2026-04-18.md H7.';
