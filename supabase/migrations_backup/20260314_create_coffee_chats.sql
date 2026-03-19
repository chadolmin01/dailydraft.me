-- Phase 4: Coffee Chat System
-- This migration creates the coffee_chats table for scheduling meetings

-- Coffee chats table
CREATE TABLE public.coffee_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  requester_email TEXT NOT NULL,
  requester_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  contact_info TEXT,       -- Revealed when accepted
  message TEXT,            -- Request message from requester
  requester_name TEXT,     -- Name/nickname of requester
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_coffee_chats_opportunity ON public.coffee_chats(opportunity_id);
CREATE INDEX idx_coffee_chats_owner ON public.coffee_chats(owner_user_id);
CREATE INDEX idx_coffee_chats_requester ON public.coffee_chats(requester_user_id);
CREATE INDEX idx_coffee_chats_status ON public.coffee_chats(status);

-- RLS
ALTER TABLE public.coffee_chats ENABLE ROW LEVEL SECURITY;

-- Owners can read all chats for their opportunities
CREATE POLICY "Owners can read chats for their opportunities" ON public.coffee_chats
  FOR SELECT USING (
    auth.uid() = owner_user_id OR
    auth.uid() = requester_user_id
  );

-- Anyone can request a coffee chat
CREATE POLICY "Anyone can request coffee chat" ON public.coffee_chats
  FOR INSERT WITH CHECK (true);

-- Only owner can update (accept/decline)
CREATE POLICY "Owner can update chat status" ON public.coffee_chats
  FOR UPDATE USING (auth.uid() = owner_user_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_coffee_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_coffee_chat_timestamp
  BEFORE UPDATE ON public.coffee_chats
  FOR EACH ROW
  EXECUTE FUNCTION update_coffee_chat_timestamp();

-- RPC: Request coffee chat
CREATE OR REPLACE FUNCTION request_coffee_chat(
  p_opportunity_id UUID,
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
  v_owner_id UUID;
  v_chat_id UUID;
BEGIN
  -- Get the owner of the opportunity
  SELECT creator_id INTO v_owner_id
  FROM public.opportunities
  WHERE id = p_opportunity_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Opportunity not found';
  END IF;

  -- Prevent self-request
  IF p_requester_user_id = v_owner_id THEN
    RAISE EXCEPTION 'Cannot request coffee chat with yourself';
  END IF;

  -- Insert the coffee chat request
  INSERT INTO public.coffee_chats (
    opportunity_id,
    requester_email,
    requester_user_id,
    requester_name,
    owner_user_id,
    message
  ) VALUES (
    p_opportunity_id,
    p_requester_email,
    p_requester_user_id,
    p_requester_name,
    v_owner_id,
    p_message
  )
  RETURNING id INTO v_chat_id;

  RETURN v_chat_id;
END;
$$;

-- RPC: Accept coffee chat (reveals contact info)
CREATE OR REPLACE FUNCTION accept_coffee_chat(
  p_chat_id UUID,
  p_contact_info TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.coffee_chats
  SET status = 'accepted', contact_info = p_contact_info
  WHERE id = p_chat_id AND owner_user_id = auth.uid() AND status = 'pending';

  RETURN FOUND;
END;
$$;

-- RPC: Decline coffee chat
CREATE OR REPLACE FUNCTION decline_coffee_chat(
  p_chat_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.coffee_chats
  SET status = 'declined'
  WHERE id = p_chat_id AND owner_user_id = auth.uid() AND status = 'pending';

  RETURN FOUND;
END;
$$;

-- Comments
COMMENT ON TABLE public.coffee_chats IS 'Coffee chat requests between users';
COMMENT ON COLUMN public.coffee_chats.status IS 'pending, accepted, or declined';
COMMENT ON COLUMN public.coffee_chats.contact_info IS 'Contact information revealed after acceptance';
