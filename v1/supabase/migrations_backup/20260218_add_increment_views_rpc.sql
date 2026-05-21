-- RPC function to atomically increment opportunity views count
-- This prevents race conditions when multiple users view the same opportunity simultaneously

CREATE OR REPLACE FUNCTION increment_opportunity_views(opportunity_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE opportunities
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = opportunity_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_opportunity_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_opportunity_views(UUID) TO anon;
