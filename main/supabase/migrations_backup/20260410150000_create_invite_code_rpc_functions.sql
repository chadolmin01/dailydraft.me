-- redeem_invite_code: 초대 코드 사용 (인증 유저가 셀프 가입)
-- 트랜잭션으로 코드 검증 → use_count 증가 → club_members 삽입을 원자적으로 처리
-- SECURITY DEFINER: RLS 우회 (일반 유저는 invite_codes 테이블 직접 접근 불가)
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

  -- 7. use_count 증가
  UPDATE club_invite_codes
  SET use_count = use_count + 1
  WHERE id = v_invite.id;

  -- 8. club_members에 추가
  INSERT INTO club_members (club_id, user_id, role, cohort)
  VALUES (v_invite.club_id, p_user_id, v_invite.role, v_invite.cohort);

  -- 9. 결과 반환
  RETURN jsonb_build_object(
    'club_id', v_invite.club_id,
    'club_name', v_club.name,
    'club_slug', v_club.slug,
    'role', v_invite.role,
    'cohort', v_invite.cohort
  );
END;
$$;

-- preview_invite_code: 코드 미리보기 (비로그인도 가능)
-- 초대 링크 클릭 시 "FLIP 3기에 초대되었습니다" 표시용
-- 코드 상세(사용횟수 등)는 노출하지 않고 클럽 이름/기수만 반환
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
  -- 코드 조회
  SELECT * INTO v_invite
  FROM club_invite_codes
  WHERE code = p_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;

  -- 비활성/만료/소진된 코드도 미리보기는 가능 (가입만 불가)
  -- 단, 존재 여부는 알려줌

  -- 클럽 정보
  SELECT * INTO v_club FROM clubs WHERE id = v_invite.club_id;

  -- 멤버 수 (user_id가 있는 실멤버만)
  SELECT count(*) INTO v_member_count
  FROM club_members
  WHERE club_id = v_invite.club_id AND user_id IS NOT NULL;

  RETURN jsonb_build_object(
    'club_name', v_club.name,
    'club_slug', v_club.slug,
    'club_logo_url', v_club.logo_url,
    'cohort', v_invite.cohort,
    'member_count', v_member_count,
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
