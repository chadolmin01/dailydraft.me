-- ============================================================
-- coffee_chats: add invitation_message column
-- Stores the custom welcome message sent when accepting a coffee chat
-- ============================================================

ALTER TABLE public.coffee_chats
  ADD COLUMN IF NOT EXISTS invitation_message TEXT;
