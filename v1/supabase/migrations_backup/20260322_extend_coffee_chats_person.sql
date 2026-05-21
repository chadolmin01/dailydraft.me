-- Person-to-Person Coffee Chat 확장
-- opportunity_id를 nullable로 변경하고 target_user_id 추가

-- 1. opportunity_id를 nullable로 변경
ALTER TABLE public.coffee_chats ALTER COLUMN opportunity_id DROP NOT NULL;

-- 2. person-to-person 대상 컬럼 추가
ALTER TABLE public.coffee_chats ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. 둘 중 하나만 존재해야 하는 제약
ALTER TABLE public.coffee_chats ADD CONSTRAINT chk_coffee_chat_target
  CHECK (
    (opportunity_id IS NOT NULL AND target_user_id IS NULL) OR
    (opportunity_id IS NULL AND target_user_id IS NOT NULL)
  );

-- 4. 인덱스
CREATE INDEX IF NOT EXISTS idx_coffee_chats_target_user ON public.coffee_chats(target_user_id);

-- 5. RPC: Person-to-person 커피챗 신청
CREATE OR REPLACE FUNCTION request_person_coffee_chat(
  p_target_user_id UUID,
  p_requester_email TEXT,
  p_requester_name TEXT,
  p_message TEXT DEFAULT NULL,
  p_requester_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chat_id UUID;
BEGIN
  -- Prevent self-request
  IF p_requester_user_id = p_target_user_id THEN
    RAISE EXCEPTION 'Cannot request coffee chat with yourself';
  END IF;

  -- Verify target user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_target_user_id) THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  -- Insert the coffee chat request (opportunity_id = NULL, owner_user_id = target)
  INSERT INTO public.coffee_chats (
    opportunity_id,
    target_user_id,
    requester_email,
    requester_user_id,
    requester_name,
    owner_user_id,
    message
  ) VALUES (
    NULL,
    p_target_user_id,
    p_requester_email,
    p_requester_user_id,
    p_requester_name,
    p_target_user_id,
    p_message
  )
  RETURNING id INTO v_chat_id;

  RETURN v_chat_id;
END;
$$;

COMMENT ON COLUMN public.coffee_chats.target_user_id IS 'Target user for person-to-person coffee chats (NULL for project-based)';
