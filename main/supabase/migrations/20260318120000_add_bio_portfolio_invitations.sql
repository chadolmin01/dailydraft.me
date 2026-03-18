-- ============================================================
-- Migration: Add bio column, portfolio_items, project_invitations
-- Date: 2026-03-18
-- Description: Profile redesign — bio separated from vision_summary,
--   portfolio items table, project invitations table,
--   coffee_chats person-to-person extension
-- ============================================================

-- ============================================================
-- 1. profiles.bio column
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- ============================================================
-- 2. portfolio_items table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_user_id ON public.portfolio_items(user_id);
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portfolio_items' AND policyname='portfolio_select') THEN
    CREATE POLICY "portfolio_select" ON public.portfolio_items FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portfolio_items' AND policyname='portfolio_insert') THEN
    CREATE POLICY "portfolio_insert" ON public.portfolio_items FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portfolio_items' AND policyname='portfolio_update') THEN
    CREATE POLICY "portfolio_update" ON public.portfolio_items FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portfolio_items' AND policyname='portfolio_delete') THEN
    CREATE POLICY "portfolio_delete" ON public.portfolio_items FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 3. project_invitations table
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_project_invitations_inviter ON public.project_invitations(inviter_user_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_invited ON public.project_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_opportunity ON public.project_invitations(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_status ON public.project_invitations(status);

ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_invitations' AND policyname='Users can read their own invitations') THEN
    CREATE POLICY "Users can read their own invitations" ON public.project_invitations
      FOR SELECT USING (auth.uid() = inviter_user_id OR auth.uid() = invited_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_invitations' AND policyname='Inviters can create invitations') THEN
    CREATE POLICY "Inviters can create invitations" ON public.project_invitations
      FOR INSERT WITH CHECK (auth.uid() = inviter_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_invitations' AND policyname='Invited users can update invitation status') THEN
    CREATE POLICY "Invited users can update invitation status" ON public.project_invitations
      FOR UPDATE USING (auth.uid() = invited_user_id);
  END IF;
END $$;

-- Timestamp trigger
CREATE OR REPLACE FUNCTION update_project_invitation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_project_invitation_timestamp') THEN
    CREATE TRIGGER trigger_update_project_invitation_timestamp
      BEFORE UPDATE ON public.project_invitations
      FOR EACH ROW
      EXECUTE FUNCTION update_project_invitation_timestamp();
  END IF;
END $$;

-- RPCs for invitation accept/decline
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

-- ============================================================
-- 4. coffee_chats person-to-person extension
-- ============================================================
ALTER TABLE public.coffee_chats ALTER COLUMN opportunity_id DROP NOT NULL;

ALTER TABLE public.coffee_chats ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_coffee_chat_target'
  ) THEN
    ALTER TABLE public.coffee_chats ADD CONSTRAINT chk_coffee_chat_target
      CHECK (
        (opportunity_id IS NOT NULL AND target_user_id IS NULL) OR
        (opportunity_id IS NULL AND target_user_id IS NOT NULL)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_coffee_chats_target_user ON public.coffee_chats(target_user_id);

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
  IF p_requester_user_id = p_target_user_id THEN
    RAISE EXCEPTION 'Cannot request coffee chat with yourself';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_target_user_id) THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

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
