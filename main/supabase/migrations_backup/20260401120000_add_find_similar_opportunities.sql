-- find_similar_opportunities: 특정 프로젝트와 유사한 프로젝트 검색
-- match_opportunities와 달리, 유저 프로필이 아닌 프로젝트 임베딩 기준으로 검색
CREATE OR REPLACE FUNCTION find_similar_opportunities(
  p_opportunity_id UUID,
  p_match_count INT DEFAULT 3,
  p_match_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  type TEXT,
  interest_tags TEXT[],
  needed_roles TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_embedding TEXT;
BEGIN
  SELECT vision_embedding INTO v_embedding
  FROM opportunities
  WHERE id = p_opportunity_id;

  IF v_embedding IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.title,
    o.description,
    o.type,
    o.interest_tags,
    o.needed_roles,
    (1 - (o.vision_embedding::vector(2000) <=> v_embedding::vector(2000)))::FLOAT AS similarity
  FROM opportunities o
  WHERE
    o.id != p_opportunity_id
    AND o.status = 'active'
    AND o.vision_embedding IS NOT NULL
    AND 1 - (o.vision_embedding::vector(2000) <=> v_embedding::vector(2000)) > p_match_threshold
  ORDER BY o.vision_embedding::vector(2000) <=> v_embedding::vector(2000)
  LIMIT p_match_count;
END;
$$;
