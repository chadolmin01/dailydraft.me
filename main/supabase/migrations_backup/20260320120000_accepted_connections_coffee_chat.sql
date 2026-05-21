-- ============================================================
-- accepted_connections: allow creation from coffee chats
-- - Make application_id nullable (was NOT NULL)
-- - Add coffee_chat_id column
-- ============================================================

ALTER TABLE public.accepted_connections ALTER COLUMN application_id DROP NOT NULL;

ALTER TABLE public.accepted_connections
  ADD COLUMN IF NOT EXISTS coffee_chat_id UUID REFERENCES public.coffee_chats(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_accepted_connections_coffee_chat
  ON public.accepted_connections(coffee_chat_id);
