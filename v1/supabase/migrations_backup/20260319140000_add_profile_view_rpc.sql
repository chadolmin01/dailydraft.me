-- Add profiles support to increment_view_count RPC
-- Fixes race condition in profile view counting (read-modify-write → atomic UPDATE)

DROP FUNCTION IF EXISTS increment_view_count(TEXT, UUID);

CREATE OR REPLACE FUNCTION increment_view_count(table_name TEXT, row_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  IF table_name = 'startup_events' THEN
    UPDATE startup_events
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = row_id
    RETURNING views_count INTO v_new_count;
  ELSIF table_name = 'opportunities' THEN
    UPDATE opportunities
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = row_id
    RETURNING views_count INTO v_new_count;
  ELSIF table_name = 'profiles' THEN
    UPDATE profiles
    SET profile_views = COALESCE(profile_views, 0) + 1
    WHERE id = row_id
    RETURNING profile_views INTO v_new_count;
  ELSE
    RAISE EXCEPTION 'Unsupported table: %', table_name;
  END IF;

  RETURN COALESCE(v_new_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION increment_view_count(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_view_count(TEXT, UUID) TO anon;
