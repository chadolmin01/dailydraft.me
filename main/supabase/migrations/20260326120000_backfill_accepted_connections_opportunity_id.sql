-- ============================================================
-- Backfill accepted_connections.opportunity_id from applications
-- + Add unique constraint on coffee_chat_id for upsert support
-- ============================================================

-- Backfill: copy opportunity_id from linked applications where missing
UPDATE accepted_connections ac
SET opportunity_id = a.opportunity_id
FROM applications a
WHERE ac.application_id = a.id
  AND ac.opportunity_id IS NULL;

-- Add unique constraint on coffee_chat_id so upsert(..., { onConflict: 'coffee_chat_id' }) works
-- Only non-null values are constrained (NULLs are always unique in PostgreSQL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_accepted_connections_coffee_chat_unique
  ON public.accepted_connections (coffee_chat_id)
  WHERE coffee_chat_id IS NOT NULL;
