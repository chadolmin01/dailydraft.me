-- Project Invitations 테이블 생성
-- 프로젝트 오너가 다른 유저를 프로젝트에 초대하는 기능

CREATE TABLE IF NOT EXISTS public.project_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  inviter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(opportunity_id, invited_user_id)
);

-- Indexes
CREATE INDEX idx_project_invitations_inviter ON public.project_invitations(inviter_user_id);
CREATE INDEX idx_project_invitations_invited ON public.project_invitations(invited_user_id);
CREATE INDEX idx_project_invitations_opportunity ON public.project_invitations(opportunity_id);
CREATE INDEX idx_project_invitations_status ON public.project_invitations(status);

-- RLS
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- inviter 또는 invited만 조회 가능
CREATE POLICY "Users can read their own invitations" ON public.project_invitations
  FOR SELECT USING (
    auth.uid() = inviter_user_id OR auth.uid() = invited_user_id
  );

-- inviter만 생성 가능
CREATE POLICY "Inviters can create invitations" ON public.project_invitations
  FOR INSERT WITH CHECK (auth.uid() = inviter_user_id);

-- invited만 상태 변경 가능
CREATE POLICY "Invited users can update invitation status" ON public.project_invitations
  FOR UPDATE USING (auth.uid() = invited_user_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_project_invitation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_invitation_timestamp
  BEFORE UPDATE ON public.project_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_project_invitation_timestamp();

-- RPC: Accept project invitation
CREATE OR REPLACE FUNCTION accept_project_invitation(p_invitation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  SELECT * INTO v_invitation
  FROM public.project_invitations
  WHERE id = p_invitation_id AND invited_user_id = auth.uid() AND status = 'pending';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE public.project_invitations
  SET status = 'accepted'
  WHERE id = p_invitation_id;

  RETURN TRUE;
END;
$$;

-- RPC: Decline project invitation
CREATE OR REPLACE FUNCTION decline_project_invitation(p_invitation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.project_invitations
  SET status = 'declined'
  WHERE id = p_invitation_id AND invited_user_id = auth.uid() AND status = 'pending';

  RETURN FOUND;
END;
$$;

COMMENT ON TABLE public.project_invitations IS 'Project invitations from creators to other users';
