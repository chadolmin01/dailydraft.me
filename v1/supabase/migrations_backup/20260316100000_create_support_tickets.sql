-- Support tickets / feedback / bug reports
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'question', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  page_url TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON support_tickets FOR ALL
  USING (auth.role() = 'service_role');
