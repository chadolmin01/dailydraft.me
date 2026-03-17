-- 쪽지(Direct Messages) 테이블
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  deleted_by_sender BOOLEAN DEFAULT false,
  deleted_by_receiver BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_dm_receiver ON direct_messages(receiver_id, created_at DESC);
CREATE INDEX idx_dm_sender ON direct_messages(sender_id, created_at DESC);
CREATE INDEX idx_dm_conversation ON direct_messages(
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC
);
CREATE INDEX idx_dm_unread ON direct_messages(receiver_id, is_read) WHERE is_read = false;

-- RLS
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dm_select" ON direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "dm_insert" ON direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "dm_update" ON direct_messages FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
