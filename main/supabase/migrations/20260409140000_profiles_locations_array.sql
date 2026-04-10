-- profiles.location (text, 쉼표 구분 문자열) → profiles.locations (text[])
--
-- 배경:
--   기존에는 단일 text 컬럼에 "서울, 경기"처럼 쉼표 구분으로 저장했음.
--   온보딩은 이미 배열로 다루는데(.join(', ')) 편집 UI는 단일 선택만 지원해서
--   데이터 모델 분열 + 매칭 로직(===) 버그가 누적됨.
--
-- 의미 분열 주의:
--   - profiles.locations: 유저의 활동 가능 지역들 (배열, multi)
--   - opportunities.location: 프로젝트가 위치한 단일 지역 (스칼라, 유지)
--   매칭은 profile.locations @> [opp.location] 또는 && 으로 수행.
--
-- 마이그레이션:
--   1) ALTER TYPE으로 text → text[] 변환 (regexp_split로 기존 데이터 보존)
--   2) RENAME location → locations
--   3) GIN 인덱스 (배열 교집합/포함 검색용)
--   4) 의존 RPC 4개(calculate_context_boost / match_users / recommend_events_*) 재정의
--      → PL/pgSQL 함수 바디는 ALTER에서 검증 안 되고, 첫 호출 시 터지므로 동시 재정의 필수
--
-- 트레이드오프:
--   - ACCESS EXCLUSIVE 락이 걸리지만 profiles 행 수 적어 무시 가능.
--   - DO 블록으로 컬럼 존재 가드 → 재실행 안전.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'location'
  ) THEN
    -- 1) text → text[] 변환. "서울,경기" / "서울 ,경기" / "서울, 경기" 모두 처리.
    EXECUTE $sql$
      ALTER TABLE profiles
      ALTER COLUMN location TYPE text[]
      USING CASE
        WHEN location IS NULL OR location = '' THEN NULL
        ELSE array_remove(regexp_split_to_array(location, '\s*,\s*'), '')
      END
    $sql$;

    -- 2) RENAME (이름과 실체 일치)
    EXECUTE 'ALTER TABLE profiles RENAME COLUMN location TO locations';
  END IF;
END $$;

-- 3) GIN 인덱스 (배열 교집합/포함 검색)
CREATE INDEX IF NOT EXISTS profiles_locations_gin_idx
  ON profiles USING GIN (locations);

-- ============================================================
-- 4) 의존 RPC 재정의 — profiles.location 참조하던 함수들
-- ============================================================

-- calculate_context_boost: user_location TEXT → user_locations TEXT[]
-- 시그니처가 바뀌므로 DROP 필요.
DROP FUNCTION IF EXISTS calculate_context_boost(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION calculate_context_boost(
  event_end_date TEXT,
  event_target TEXT,
  user_locations TEXT[]
)
RETURNS FLOAT
LANGUAGE plpgsql
AS $$
DECLARE
  v_boost FLOAT := 0;
  v_days_left INTEGER;
BEGIN
  -- 마감 임박 부스트 (7일 이내)
  v_days_left := EXTRACT(DAY FROM (event_end_date::TIMESTAMPTZ - NOW()));
  IF v_days_left BETWEEN 0 AND 7 THEN
    v_boost := v_boost + (7 - v_days_left) * 0.05;
  END IF;

  -- 지역 매칭 부스트: 유저의 활동 지역 중 하나라도 이벤트 대상과 일치
  IF user_locations IS NOT NULL AND event_target IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM unnest(user_locations) loc
       WHERE LOWER(loc) = LOWER(event_target)
     ) THEN
    v_boost := v_boost + 0.2;
  END IF;

  RETURN v_boost;
END;
$$;

-- match_users: RETURNS location TEXT → locations TEXT[]
-- RETURN 스펙 변경이라 DROP 필수.
DROP FUNCTION IF EXISTS match_users(TEXT, FLOAT, INT, UUID);

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
  locations TEXT[],
  profile_analysis JSONB,
  extracted_profile JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.user_id, p.nickname, p.desired_position,
    p.skills, p.interest_tags, p.personality, p.current_situation,
    p.vision_summary, p.vision_embedding::TEXT, p.locations,
    p.profile_analysis, p.extracted_profile,
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

-- match_profiles_for_opportunity: RETURNS location TEXT → locations TEXT[]
DROP FUNCTION IF EXISTS match_profiles_for_opportunity(TEXT, FLOAT, INT, UUID);

CREATE OR REPLACE FUNCTION match_profiles_for_opportunity(
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
  locations TEXT[],
  vision_summary TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.user_id, p.nickname, p.desired_position,
    p.skills, p.interest_tags, p.locations, p.vision_summary,
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

-- recommend_events_for_user: v_user_location TEXT → v_user_locations TEXT[]
CREATE OR REPLACE FUNCTION recommend_events_for_user(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  organizer TEXT,
  event_type TEXT,
  description TEXT,
  registration_end_date TIMESTAMPTZ,
  registration_url TEXT,
  interest_tags TEXT[],
  tag_score FLOAT,
  context_boost FLOAT,
  total_score FLOAT,
  days_until_deadline INTEGER,
  vector_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_tags TEXT[];
  v_user_locations TEXT[];
BEGIN
  SELECT p.interest_tags, p.locations
  INTO v_user_tags, v_user_locations
  FROM profiles p
  WHERE p.user_id = p_user_id;

  RETURN QUERY
  SELECT
    e.id, e.title, e.organizer, e.event_type, e.description,
    e.registration_end_date, e.registration_url, e.interest_tags,
    calculate_tag_score(e.interest_tags, v_user_tags) AS tag_score,
    calculate_context_boost(
      e.registration_end_date::TEXT,
      e.target_audience,
      v_user_locations
    ) AS context_boost,
    (calculate_tag_score(e.interest_tags, v_user_tags) +
     calculate_context_boost(e.registration_end_date::TEXT, e.target_audience, v_user_locations)
    ) AS total_score,
    EXTRACT(DAY FROM (e.registration_end_date - NOW()))::INTEGER AS days_until_deadline,
    NULL::FLOAT AS vector_score
  FROM startup_events e
  WHERE e.status = 'active'
    AND e.registration_end_date >= NOW()
  ORDER BY total_score DESC, e.registration_end_date ASC
  LIMIT p_limit;
END;
$$;

-- recommend_events_with_embedding: v_user_location TEXT → v_user_locations TEXT[]
CREATE OR REPLACE FUNCTION recommend_events_with_embedding(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  organizer TEXT,
  event_type TEXT,
  description TEXT,
  registration_end_date TIMESTAMPTZ,
  registration_url TEXT,
  interest_tags TEXT[],
  tag_score FLOAT,
  vector_score FLOAT,
  context_boost FLOAT,
  total_score FLOAT,
  days_until_deadline INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_tags TEXT[];
  v_user_locations TEXT[];
  v_user_embedding TEXT;
BEGIN
  SELECT p.interest_tags, p.locations, p.vision_embedding::TEXT
  INTO v_user_tags, v_user_locations, v_user_embedding
  FROM profiles p
  WHERE p.user_id = p_user_id;

  RETURN QUERY
  SELECT
    e.id, e.title, e.organizer, e.event_type, e.description,
    e.registration_end_date, e.registration_url, e.interest_tags,
    calculate_tag_score(e.interest_tags, v_user_tags) AS tag_score,
    CASE
      WHEN v_user_embedding IS NOT NULL AND e.content_embedding IS NOT NULL THEN
        1 - (e.content_embedding::vector(2000) <=> v_user_embedding::vector(2000))
      ELSE 0
    END AS vector_score,
    calculate_context_boost(e.registration_end_date::TEXT, e.target_audience, v_user_locations) AS context_boost,
    (
      calculate_tag_score(e.interest_tags, v_user_tags) * 0.3 +
      CASE
        WHEN v_user_embedding IS NOT NULL AND e.content_embedding IS NOT NULL THEN
          (1 - (e.content_embedding::vector(2000) <=> v_user_embedding::vector(2000))) * 0.5
        ELSE 0
      END +
      calculate_context_boost(e.registration_end_date::TEXT, e.target_audience, v_user_locations) * 0.2
    ) AS total_score,
    EXTRACT(DAY FROM (e.registration_end_date - NOW()))::INTEGER AS days_until_deadline
  FROM startup_events e
  WHERE e.status = 'active'
    AND e.registration_end_date >= NOW()
  ORDER BY total_score DESC, e.registration_end_date ASC
  LIMIT p_limit;
END;
$$;
