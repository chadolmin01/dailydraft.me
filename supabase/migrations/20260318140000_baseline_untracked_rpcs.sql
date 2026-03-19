-- ============================================================
-- Baseline migration: RPC functions that exist in DB but had no active migration
-- DROP first to handle parameter name changes, then CREATE OR REPLACE
-- ============================================================

-- Pre-drop all functions to avoid "cannot change name of input parameter" errors
-- Only drops functions with matching signatures; safe if function doesn't exist
DROP FUNCTION IF EXISTS get_or_create_current_usage(UUID);
DROP FUNCTION IF EXISTS increment_usage(UUID, TEXT);
DROP FUNCTION IF EXISTS get_user_subscription(UUID);
DROP FUNCTION IF EXISTS expire_boosts();
DROP FUNCTION IF EXISTS get_boosted_opportunities();
DROP FUNCTION IF EXISTS increment_view_count(TEXT, UUID);
DROP FUNCTION IF EXISTS match_opportunities(TEXT, FLOAT, INT, UUID);
DROP FUNCTION IF EXISTS match_profiles_for_opportunity(TEXT, FLOAT, INT, UUID);
DROP FUNCTION IF EXISTS match_users(TEXT, FLOAT, INT, UUID);
DROP FUNCTION IF EXISTS calculate_tag_score(TEXT[], TEXT[]);
DROP FUNCTION IF EXISTS calculate_context_boost(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS recommend_events_for_user(UUID, INT);
DROP FUNCTION IF EXISTS recommend_events_by_tags(TEXT[], INT);
DROP FUNCTION IF EXISTS recommend_events_with_embedding(UUID, INT);
DROP FUNCTION IF EXISTS find_similar_events(UUID, INT, FLOAT);
DROP FUNCTION IF EXISTS get_unread_notification_count(UUID);
DROP FUNCTION IF EXISTS generate_deadline_notifications();
DROP FUNCTION IF EXISTS get_waitlist_count();
DROP FUNCTION IF EXISTS get_weekly_digest_events(UUID, INT, INT);
DROP FUNCTION IF EXISTS request_coffee_chat(UUID, TEXT, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS accept_coffee_chat(UUID, TEXT);
DROP FUNCTION IF EXISTS decline_coffee_chat(UUID);
DROP FUNCTION IF EXISTS vote_helpful(UUID, TEXT);
DROP FUNCTION IF EXISTS report_comment(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS express_interest(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS has_expressed_interest(UUID, TEXT);
DROP FUNCTION IF EXISTS get_session_analytics_summary(INT);
DROP FUNCTION IF EXISTS calculate_startup_priority(INTEGER, DECIMAL, SMALLINT, SMALLINT);
DROP FUNCTION IF EXISTS calculate_final_score(SMALLINT, INTEGER, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS update_startup_final_scores();
DROP FUNCTION IF EXISTS get_top_startup_ideas(INTEGER, TEXT);

-- ========================
-- Subscription & Usage RPCs
-- ========================

-- get_or_create_current_usage: 현재 기간 사용량 조회/생성
CREATE OR REPLACE FUNCTION get_or_create_current_usage(p_user_id UUID)
RETURNS usage_limits
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
  v_result usage_limits;
BEGIN
  v_period_start := date_trunc('month', CURRENT_DATE)::DATE;
  v_period_end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  SELECT * INTO v_result FROM usage_limits
  WHERE user_id = p_user_id AND period_start = v_period_start;

  IF NOT FOUND THEN
    INSERT INTO usage_limits (user_id, period_start, period_end)
    VALUES (p_user_id, v_period_start, v_period_end)
    RETURNING * INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;

-- increment_usage: 사용량 증가
CREATE OR REPLACE FUNCTION increment_usage(p_user_id UUID, p_type TEXT)
RETURNS usage_limits
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result usage_limits;
BEGIN
  PERFORM get_or_create_current_usage(p_user_id);

  IF p_type = 'application' THEN
    UPDATE usage_limits SET applications_used = applications_used + 1, updated_at = NOW()
    WHERE user_id = p_user_id AND period_start = date_trunc('month', CURRENT_DATE)::DATE
    RETURNING * INTO v_result;
  ELSIF p_type = 'opportunity' THEN
    UPDATE usage_limits SET opportunities_created = opportunities_created + 1, updated_at = NOW()
    WHERE user_id = p_user_id AND period_start = date_trunc('month', CURRENT_DATE)::DATE
    RETURNING * INTO v_result;
  ELSIF p_type = 'boost' THEN
    UPDATE usage_limits SET boosts_purchased = boosts_purchased + 1, updated_at = NOW()
    WHERE user_id = p_user_id AND period_start = date_trunc('month', CURRENT_DATE)::DATE
    RETURNING * INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;

-- get_user_subscription: 사용자 구독 정보 조회
CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id UUID)
RETURNS TABLE (
  plan_type TEXT,
  status TEXT,
  billing_cycle TEXT,
  current_period_end TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT s.plan_type, s.status, s.billing_cycle, s.current_period_end
  FROM subscriptions s
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- expire_boosts: 만료된 부스트 처리
CREATE OR REPLACE FUNCTION expire_boosts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE boosts SET status = 'expired'
  WHERE status = 'active' AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- get_boosted_opportunities: 활성 부스트된 기회 목록
CREATE OR REPLACE FUNCTION get_boosted_opportunities()
RETURNS TABLE (
  opportunity_id UUID,
  boost_type TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT b.opportunity_id, b.boost_type, b.expires_at
  FROM boosts b
  WHERE b.status = 'active'
    AND b.expires_at > NOW()
  ORDER BY
    CASE b.boost_type
      WHEN 'weekly_feature' THEN 1
      WHEN 'opportunity_premium' THEN 2
      WHEN 'opportunity_boost' THEN 3
      ELSE 99
    END;
END;
$$;

-- ========================
-- View Count RPCs
-- ========================

-- increment_view_count: 범용 조회수 증가 (테이블명 + row_id)
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
  ELSE
    RAISE EXCEPTION 'Unsupported table: %', table_name;
  END IF;

  RETURN COALESCE(v_new_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION increment_view_count(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_view_count(TEXT, UUID) TO anon;

-- ========================
-- pgvector Matching RPCs
-- ========================

-- match_opportunities: 프로필 임베딩으로 기회 매칭
CREATE OR REPLACE FUNCTION match_opportunities(
  query_embedding TEXT,
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 50,
  exclude_creator_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  description TEXT,
  status TEXT,
  creator_id UUID,
  needed_roles TEXT[],
  needed_skills JSONB,
  interest_tags TEXT[],
  location_type TEXT,
  location TEXT,
  time_commitment TEXT,
  compensation_type TEXT,
  compensation_details TEXT,
  applications_count INTEGER,
  views_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  demo_images TEXT[],
  project_links JSONB,
  vision_embedding TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id, o.type, o.title, o.description, o.status, o.creator_id,
    o.needed_roles, o.needed_skills, o.interest_tags,
    o.location_type, o.location, o.time_commitment,
    o.compensation_type, o.compensation_details,
    o.applications_count, o.views_count,
    o.created_at, o.updated_at,
    o.demo_images, o.project_links,
    o.vision_embedding::TEXT,
    1 - (o.vision_embedding::vector(2000) <=> query_embedding::vector(2000)) AS similarity
  FROM opportunities o
  WHERE o.status = 'active'
    AND o.vision_embedding IS NOT NULL
    AND (exclude_creator_id IS NULL OR o.creator_id != exclude_creator_id)
    AND 1 - (o.vision_embedding::vector(2000) <=> query_embedding::vector(2000)) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- match_profiles_for_opportunity: 기회에 맞는 프로필 매칭
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
  location TEXT,
  vision_summary TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.user_id, p.nickname, p.desired_position,
    p.skills, p.interest_tags, p.location, p.vision_summary,
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

-- match_users: 사용자간 임베딩 매칭
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
    p.id, p.user_id, p.nickname, p.desired_position,
    p.skills, p.interest_tags, p.personality, p.current_situation,
    p.vision_summary, p.vision_embedding::TEXT, p.location,
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

-- ========================
-- Event Recommendation RPCs
-- ========================

-- calculate_tag_score: 태그 유사도 점수 계산
CREATE OR REPLACE FUNCTION calculate_tag_score(event_tags TEXT[], user_tags TEXT[])
RETURNS FLOAT
LANGUAGE plpgsql
AS $$
DECLARE
  v_common INTEGER;
  v_total INTEGER;
BEGIN
  IF event_tags IS NULL OR user_tags IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO v_common
  FROM unnest(event_tags) t1
  WHERE LOWER(t1) IN (SELECT LOWER(t2) FROM unnest(user_tags) t2);

  v_total := GREATEST(array_length(event_tags, 1), 1);
  RETURN LEAST(1.0, v_common::FLOAT / v_total);
END;
$$;

-- calculate_context_boost: 이벤트 맥락 부스트 계산
CREATE OR REPLACE FUNCTION calculate_context_boost(
  event_end_date TEXT,
  event_target TEXT,
  user_location TEXT
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

  -- 지역 매칭 부스트
  IF user_location IS NOT NULL AND event_target IS NOT NULL
     AND LOWER(user_location) = LOWER(event_target) THEN
    v_boost := v_boost + 0.2;
  END IF;

  RETURN v_boost;
END;
$$;

-- recommend_events_for_user: 로그인 사용자 맞춤 이벤트 추천
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
  v_user_location TEXT;
BEGIN
  -- 사용자 태그/위치 가져오기
  SELECT p.interest_tags, p.location
  INTO v_user_tags, v_user_location
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
      v_user_location
    ) AS context_boost,
    (calculate_tag_score(e.interest_tags, v_user_tags) +
     calculate_context_boost(e.registration_end_date::TEXT, e.target_audience, v_user_location)
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

-- recommend_events_by_tags: 태그 기반 이벤트 추천 (비로그인)
CREATE OR REPLACE FUNCTION recommend_events_by_tags(
  p_tags TEXT[],
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  event_id UUID,
  title TEXT,
  organizer TEXT,
  event_type TEXT,
  description TEXT,
  registration_end_date TIMESTAMPTZ,
  registration_url TEXT,
  interest_tags TEXT[],
  tag_score FLOAT,
  days_until_deadline INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id AS event_id, e.title, e.organizer, e.event_type, e.description,
    e.registration_end_date, e.registration_url, e.interest_tags,
    calculate_tag_score(e.interest_tags, p_tags) AS tag_score,
    EXTRACT(DAY FROM (e.registration_end_date - NOW()))::INTEGER AS days_until_deadline
  FROM startup_events e
  WHERE e.status = 'active'
    AND e.registration_end_date >= NOW()
    AND calculate_tag_score(e.interest_tags, p_tags) > 0
  ORDER BY tag_score DESC, e.registration_end_date ASC
  LIMIT p_limit;
END;
$$;

-- recommend_events_with_embedding: 임베딩 기반 이벤트 추천
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
  v_user_location TEXT;
  v_user_embedding TEXT;
BEGIN
  SELECT p.interest_tags, p.location, p.vision_embedding::TEXT
  INTO v_user_tags, v_user_location, v_user_embedding
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
    calculate_context_boost(e.registration_end_date::TEXT, e.target_audience, v_user_location) AS context_boost,
    (
      calculate_tag_score(e.interest_tags, v_user_tags) * 0.3 +
      CASE
        WHEN v_user_embedding IS NOT NULL AND e.content_embedding IS NOT NULL THEN
          (1 - (e.content_embedding::vector(2000) <=> v_user_embedding::vector(2000))) * 0.5
        ELSE 0
      END +
      calculate_context_boost(e.registration_end_date::TEXT, e.target_audience, v_user_location) * 0.2
    ) AS total_score,
    EXTRACT(DAY FROM (e.registration_end_date - NOW()))::INTEGER AS days_until_deadline
  FROM startup_events e
  WHERE e.status = 'active'
    AND e.registration_end_date >= NOW()
  ORDER BY total_score DESC, e.registration_end_date ASC
  LIMIT p_limit;
END;
$$;

-- find_similar_events: 임베딩 기반 유사 이벤트
CREATE OR REPLACE FUNCTION find_similar_events(
  p_event_id UUID,
  p_limit INT DEFAULT 5,
  p_min_similarity FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  event_id UUID,
  title TEXT,
  event_type TEXT,
  registration_end_date TIMESTAMPTZ,
  similarity_score FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_embedding TEXT;
BEGIN
  SELECT content_embedding INTO v_embedding
  FROM startup_events WHERE id = p_event_id;

  IF v_embedding IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    e.id AS event_id, e.title, e.event_type, e.registration_end_date,
    (1 - (e.content_embedding::vector(2000) <=> v_embedding::vector(2000)))::FLOAT AS similarity_score
  FROM startup_events e
  WHERE e.id != p_event_id
    AND e.status = 'active'
    AND e.content_embedding IS NOT NULL
    AND e.registration_end_date >= NOW()
    AND 1 - (e.content_embedding::vector(2000) <=> v_embedding::vector(2000)) > p_min_similarity
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$;

-- ========================
-- Notification RPCs
-- ========================

-- get_unread_notification_count: 미읽은 알림 수
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM event_notifications
  WHERE user_id = p_user_id
    AND read_at IS NULL
    AND status != 'cancelled';

  RETURN v_count;
END;
$$;

-- generate_deadline_notifications: 마감 임박 알림 생성
CREATE OR REPLACE FUNCTION generate_deadline_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_bookmark RECORD;
BEGIN
  FOR v_bookmark IN
    SELECT
      eb.id AS bookmark_id,
      eb.user_id,
      eb.event_id,
      COALESCE(eb.notify_before_days, ns.email_deadline_days, 3) AS notify_days,
      se.title AS event_title,
      se.registration_end_date
    FROM event_bookmarks eb
    JOIN startup_events se ON se.id = eb.event_id
    LEFT JOIN notification_settings ns ON ns.user_id = eb.user_id
    WHERE se.status = 'active'
      AND se.registration_end_date >= NOW()
      AND se.registration_end_date <= NOW() + (COALESCE(eb.notify_before_days, ns.email_deadline_days, 3) || ' days')::INTERVAL
      AND NOT EXISTS (
        SELECT 1 FROM event_notifications en
        WHERE en.bookmark_id = eb.id
          AND en.notification_type = 'deadline_reminder'
          AND en.created_at > NOW() - INTERVAL '1 day'
      )
  LOOP
    INSERT INTO event_notifications (
      user_id, event_id, bookmark_id, notification_type,
      title, message, status, notify_date
    ) VALUES (
      v_bookmark.user_id,
      v_bookmark.event_id,
      v_bookmark.bookmark_id,
      'deadline_reminder',
      '마감 임박: ' || v_bookmark.event_title,
      v_bookmark.event_title || ' 마감이 ' || v_bookmark.notify_days || '일 남았습니다.',
      'pending',
      v_bookmark.registration_end_date
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- get_waitlist_count: 대기자 수
CREATE OR REPLACE FUNCTION get_waitlist_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count FROM waitlist_signups;
  RETURN v_count;
END;
$$;

-- get_weekly_digest_events: 주간 다이제스트용 이벤트 조회
CREATE OR REPLACE FUNCTION get_weekly_digest_events(
  p_user_id UUID,
  p_recommended_limit INT DEFAULT 5,
  p_popular_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  organizer TEXT,
  event_type TEXT,
  registration_end_date TIMESTAMPTZ,
  registration_url TEXT,
  interest_tags TEXT[],
  category TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_tags TEXT[];
BEGIN
  SELECT p.interest_tags INTO v_user_tags
  FROM profiles p WHERE p.user_id = p_user_id;

  -- 추천 이벤트 (태그 매칭)
  RETURN QUERY
  SELECT
    e.id, e.title, e.organizer, e.event_type,
    e.registration_end_date, e.registration_url, e.interest_tags,
    'recommended'::TEXT AS category
  FROM startup_events e
  WHERE e.status = 'active'
    AND e.registration_end_date >= NOW()
    AND e.registration_end_date <= NOW() + INTERVAL '14 days'
    AND calculate_tag_score(e.interest_tags, v_user_tags) > 0
  ORDER BY calculate_tag_score(e.interest_tags, v_user_tags) DESC
  LIMIT p_recommended_limit;

  -- 인기 이벤트 (조회수 기반)
  RETURN QUERY
  SELECT
    e.id, e.title, e.organizer, e.event_type,
    e.registration_end_date, e.registration_url, e.interest_tags,
    'popular'::TEXT AS category
  FROM startup_events e
  WHERE e.status = 'active'
    AND e.registration_end_date >= NOW()
    AND e.registration_end_date <= NOW() + INTERVAL '14 days'
  ORDER BY e.views_count DESC NULLS LAST
  LIMIT p_popular_limit;
END;
$$;

-- ========================
-- Coffee Chat RPCs
-- ========================

-- request_coffee_chat: 프로젝트 기반 커피챗 신청
CREATE OR REPLACE FUNCTION request_coffee_chat(
  p_opportunity_id UUID,
  p_requester_email TEXT,
  p_requester_name TEXT,
  p_message TEXT DEFAULT NULL,
  p_requester_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id UUID;
  v_chat_id UUID;
BEGIN
  SELECT creator_id INTO v_owner_id
  FROM public.opportunities WHERE id = p_opportunity_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Opportunity not found';
  END IF;

  IF p_requester_user_id = v_owner_id THEN
    RAISE EXCEPTION 'Cannot request coffee chat with yourself';
  END IF;

  INSERT INTO public.coffee_chats (
    opportunity_id, requester_email, requester_user_id,
    requester_name, owner_user_id, message
  ) VALUES (
    p_opportunity_id, p_requester_email, p_requester_user_id,
    p_requester_name, v_owner_id, p_message
  )
  RETURNING id INTO v_chat_id;

  RETURN v_chat_id;
END;
$$;

-- accept_coffee_chat
CREATE OR REPLACE FUNCTION accept_coffee_chat(
  p_chat_id UUID,
  p_contact_info TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.coffee_chats
  SET status = 'accepted', contact_info = p_contact_info
  WHERE id = p_chat_id AND owner_user_id = auth.uid() AND status = 'pending';

  RETURN FOUND;
END;
$$;

-- decline_coffee_chat
CREATE OR REPLACE FUNCTION decline_coffee_chat(p_chat_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.coffee_chats
  SET status = 'declined'
  WHERE id = p_chat_id AND owner_user_id = auth.uid() AND status = 'pending';

  RETURN FOUND;
END;
$$;

-- ========================
-- Community RPCs (comments, interests)
-- ========================

-- vote_helpful: 댓글 도움됨 투표
CREATE OR REPLACE FUNCTION vote_helpful(
  p_comment_id UUID,
  p_voter_identifier TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.helpful_votes (comment_id, voter_identifier)
  VALUES (p_comment_id, p_voter_identifier);

  UPDATE public.comments
  SET helpful_count = helpful_count + 1
  WHERE id = p_comment_id;

  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    RETURN FALSE;
END;
$$;

-- report_comment: 댓글 신고
CREATE OR REPLACE FUNCTION report_comment(
  p_comment_id UUID,
  p_reporter_identifier TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.comment_reports (comment_id, reporter_identifier, reason)
  VALUES (p_comment_id, p_reporter_identifier, p_reason);

  UPDATE public.comments
  SET report_count = report_count + 1
  WHERE id = p_comment_id;

  UPDATE public.comments
  SET is_hidden = TRUE
  WHERE id = p_comment_id AND report_count >= 3;

  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    RETURN FALSE;
END;
$$;

-- express_interest: 관심 표현
CREATE OR REPLACE FUNCTION express_interest(
  p_opportunity_id UUID,
  p_user_email TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.interests (opportunity_id, user_email, user_id)
  VALUES (p_opportunity_id, p_user_email, p_user_id);

  UPDATE public.opportunities
  SET interest_count = COALESCE(interest_count, 0) + 1
  WHERE id = p_opportunity_id;

  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    RETURN FALSE;
END;
$$;

-- has_expressed_interest: 관심 여부 확인
CREATE OR REPLACE FUNCTION has_expressed_interest(
  p_opportunity_id UUID,
  p_user_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.interests
    WHERE opportunity_id = p_opportunity_id AND user_email = p_user_email
  );
END;
$$;

-- ========================
-- Analytics RPCs
-- ========================

-- get_session_analytics_summary: 세션 분석 요약
CREATE OR REPLACE FUNCTION get_session_analytics_summary(
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  total_sessions BIGINT,
  completed_sessions BIGINT,
  completion_rate NUMERIC,
  avg_turns NUMERIC,
  top_categories TEXT[],
  avg_final_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_sessions,
    COUNT(*) FILTER (WHERE completed)::BIGINT AS completed_sessions,
    ROUND(
      COUNT(*) FILTER (WHERE completed)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1
    ) AS completion_rate,
    ROUND(AVG(total_turns)::NUMERIC, 1) AS avg_turns,
    (
      SELECT ARRAY_AGG(cat ORDER BY cnt DESC)
      FROM (
        SELECT unnest(idea_category) AS cat, COUNT(*) AS cnt
        FROM session_analytics
        WHERE created_at > now() - (p_days || ' days')::INTERVAL
        GROUP BY cat
        LIMIT 5
      ) sub
    ) AS top_categories,
    ROUND(AVG((final_score->>'score')::NUMERIC), 1) AS avg_final_score
  FROM session_analytics
  WHERE created_at > now() - (p_days || ' days')::INTERVAL;
END;
$$;

-- ========================
-- Startup Ideas RPCs
-- ========================

-- calculate_startup_priority: 우선순위 점수 계산
CREATE OR REPLACE FUNCTION calculate_startup_priority(
  p_upvotes INTEGER,
  p_total_funding DECIMAL,
  p_korea_fit_score SMALLINT,
  p_tier SMALLINT
)
RETURNS SMALLINT
LANGUAGE plpgsql
AS $$
DECLARE
  v_score DECIMAL;
  v_upvote_score DECIMAL;
  v_funding_score DECIMAL;
  v_fit_score DECIMAL;
  v_tier_bonus DECIMAL;
BEGIN
  v_upvote_score := LEAST(25, LOG(GREATEST(p_upvotes, 1) + 1) * 5);
  v_funding_score := LEAST(25, LOG(GREATEST(p_total_funding, 1) + 1) * 2);
  v_fit_score := COALESCE(p_korea_fit_score, 50) * 0.4;
  v_tier_bonus := CASE
    WHEN p_tier = 1 THEN 10
    WHEN p_tier = 2 THEN 5
    WHEN p_tier = 3 THEN 2
    ELSE 0
  END;

  v_score := v_upvote_score + v_funding_score + v_fit_score + v_tier_bonus;
  RETURN LEAST(100, GREATEST(0, v_score))::SMALLINT;
END;
$$;

-- calculate_final_score: 최종 점수 계산
CREATE OR REPLACE FUNCTION calculate_final_score(
  p_korea_fit_score SMALLINT,
  p_upvotes INTEGER,
  p_korea_exists BOOLEAN,
  p_difficulty TEXT
)
RETURNS SMALLINT
LANGUAGE plpgsql
AS $$
DECLARE
  v_korea_fit_component DECIMAL;
  v_upvotes_normalized DECIMAL;
  v_no_competitor_bonus DECIMAL;
  v_difficulty_bonus DECIMAL;
  v_final_score DECIMAL;
BEGIN
  v_korea_fit_component := COALESCE(p_korea_fit_score, 50) * 0.4;
  v_upvotes_normalized := CASE
    WHEN p_upvotes > 0 THEN LEAST(30, LOG(p_upvotes) * 10)
    ELSE 0
  END;
  v_no_competitor_bonus := CASE WHEN p_korea_exists = false THEN 20 ELSE 0 END;
  v_difficulty_bonus := CASE
    WHEN p_difficulty = 'easy' THEN 10
    WHEN p_difficulty = 'medium' THEN 5
    ELSE 0
  END;

  v_final_score := v_korea_fit_component + v_upvotes_normalized + v_no_competitor_bonus + v_difficulty_bonus;
  RETURN LEAST(100, GREATEST(0, v_final_score))::SMALLINT;
END;
$$;

-- update_startup_final_scores: 일괄 final_score 업데이트
CREATE OR REPLACE FUNCTION update_startup_final_scores()
RETURNS TABLE (updated_count INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  WITH updated AS (
    UPDATE public.startup_ideas
    SET final_score = calculate_final_score(
      korea_fit_score,
      upvotes,
      (korea_deep_analysis->>'korea_exists')::BOOLEAN,
      korea_deep_analysis->>'difficulty'
    )
    WHERE korea_deep_analysis IS NOT NULL
      AND status = 'active'
    RETURNING 1
  )
  SELECT COUNT(*)::INTEGER INTO v_updated FROM updated;

  RETURN QUERY SELECT v_updated;
END;
$$;

-- get_top_startup_ideas: 상위 스타트업 조회
CREATE OR REPLACE FUNCTION get_top_startup_ideas(
  p_limit INTEGER DEFAULT 10,
  p_sort TEXT DEFAULT 'final_score'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  tagline TEXT,
  description TEXT,
  category TEXT[],
  logo_url TEXT,
  website_url TEXT,
  source TEXT,
  source_url TEXT,
  upvotes INTEGER,
  korea_fit_score SMALLINT,
  final_score SMALLINT,
  korea_deep_analysis JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    si.id, si.name, si.tagline, si.description, si.category,
    si.logo_url, si.website_url, si.source, si.source_url,
    si.upvotes, si.korea_fit_score, si.final_score, si.korea_deep_analysis
  FROM public.startup_ideas si
  WHERE si.status = 'active'
    AND si.korea_deep_analysis IS NOT NULL
  ORDER BY
    CASE
      WHEN p_sort = 'final_score' THEN si.final_score
      WHEN p_sort = 'korea_fit_score' THEN si.korea_fit_score
      WHEN p_sort = 'upvotes' THEN si.upvotes
      ELSE si.final_score
    END DESC NULLS LAST
  LIMIT p_limit;
END;
$$;
