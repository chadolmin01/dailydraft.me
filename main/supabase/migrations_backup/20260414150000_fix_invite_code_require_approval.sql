-- Fix: redeem_invite_code()가 clubs.require_approval을 무시하던 버그 수정
-- 승인제 클럽이면 status='pending', 아니면 status='active'
-- preview_invite_code()에도 require_approval 정보 추가 (UI에서 안내 표시용)

CREATE OR REPLACE FUNCTION redeem_invite_code(p_code text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite club_invite_codes%ROWTYPE;
  v_club clubs%ROWTYPE;
  v_existing_member uuid;
  v_status text;
BEGIN
  -- 1. 코드 조회 (FOR UPDATE로 동시 사용 방지)
  SELECT * INTO v_invite
  FROM club_invite_codes
  WHERE code = p_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;

  -- 2. 활성 상태 확인
  IF NOT v_invite.is_active THEN
    RAISE EXCEPTION 'INACTIVE';
  END IF;

  -- 3. 만료 확인
  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'EXPIRED';
  END IF;

  -- 4. 사용 횟수 확인
  IF v_invite.max_uses IS NOT NULL AND v_invite.use_count >= v_invite.max_uses THEN
    RAISE EXCEPTION 'MAX_USES';
  END IF;

  -- 5. 이미 멤버인지 확인
  SELECT id INTO v_existing_member
  FROM club_members
  WHERE club_id = v_invite.club_id AND user_id = p_user_id;

  IF FOUND THEN
    RAISE EXCEPTION 'ALREADY_MEMBER';
  END IF;

  -- 6. 클럽 정보 조회
  SELECT * INTO v_club FROM clubs WHERE id = v_invite.club_id;

  -- 7. 승인제 여부에 따라 status 결정
  -- require_approval=true → 관리자 승인 대기 (pending)
  -- require_approval=false → 즉시 활성화 (active)
  v_status := CASE WHEN v_club.require_approval THEN 'pending' ELSE 'active' END;

  -- 8. use_count 증가
  UPDATE club_invite_codes
  SET use_count = use_count + 1
  WHERE id = v_invite.id;

  -- 9. club_members에 추가 (status 포함)
  INSERT INTO club_members (club_id, user_id, role, cohort, status)
  VALUES (v_invite.club_id, p_user_id, v_invite.role, v_invite.cohort, v_status);

  -- 10. 결과 반환 (status 포함하여 UI에서 안내 가능)
  RETURN jsonb_build_object(
    'club_id', v_invite.club_id,
    'club_name', v_club.name,
    'club_slug', v_club.slug,
    'role', v_invite.role,
    'cohort', v_invite.cohort,
    'status', v_status
  );
END;
$$;

-- preview에도 require_approval 정보 추가
CREATE OR REPLACE FUNCTION preview_invite_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite club_invite_codes%ROWTYPE;
  v_club clubs%ROWTYPE;
  v_member_count int;
BEGIN
  SELECT * INTO v_invite
  FROM club_invite_codes
  WHERE code = p_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;

  SELECT * INTO v_club FROM clubs WHERE id = v_invite.club_id;

  -- 활성 멤버만 카운트
  SELECT count(*) INTO v_member_count
  FROM club_members
  WHERE club_id = v_invite.club_id
    AND user_id IS NOT NULL
    AND status = 'active';

  RETURN jsonb_build_object(
    'club_name', v_club.name,
    'club_slug', v_club.slug,
    'club_logo_url', v_club.logo_url,
    'cohort', v_invite.cohort,
    'member_count', v_member_count,
    'require_approval', v_club.require_approval,
    'is_active', v_invite.is_active,
    'is_expired', CASE
      WHEN v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN true
      ELSE false
    END,
    'is_full', CASE
      WHEN v_invite.max_uses IS NOT NULL AND v_invite.use_count >= v_invite.max_uses THEN true
      ELSE false
    END
  );
END;
$$;
