-- User-to-user matching RPC using pgvector cosine similarity
CREATE OR REPLACE FUNCTION match_users(
  query_embedding TEXT,
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 50,
  exclude_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  nickname TEXT,
  desired_position TEXT,
  skills JSONB,
  interest_tags TEXT[],
  personality JSONB,
  current_situation TEXT,
  vision_summary TEXT,
  vision_embedding TEXT,
  location TEXT,
  profile_analysis JSONB,
  extracted_profile JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.nickname,
    p.desired_position,
    p.skills,
    p.interest_tags,
    p.personality,
    p.current_situation,
    p.vision_summary,
    p.vision_embedding::TEXT,
    p.location,
    p.profile_analysis,
    p.extracted_profile,
    1 - (p.vision_embedding::vector(2000) <=> query_embedding::vector(2000)) AS similarity
  FROM profiles p
  WHERE p.profile_visibility = 'public'
    AND p.onboarding_completed = TRUE
    AND p.vision_embedding IS NOT NULL
    AND (exclude_user_id IS NULL OR p.user_id != exclude_user_id)
    AND 1 - (p.vision_embedding::vector(2000) <=> query_embedding::vector(2000)) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
