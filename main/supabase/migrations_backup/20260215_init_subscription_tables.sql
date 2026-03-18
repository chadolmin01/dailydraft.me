-- 구독 시스템 기본 테이블
-- subscriptions, usage_limits, boosts, payment_history

-- 1. Subscriptions 테이블
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'team')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  payment_provider TEXT,
  external_subscription_id TEXT,
  external_customer_id TEXT,
  billing_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Usage Limits 테이블
CREATE TABLE IF NOT EXISTS usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  applications_used INTEGER NOT NULL DEFAULT 0,
  opportunities_created INTEGER NOT NULL DEFAULT 0,
  boosts_purchased INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);

-- 3. Boosts 테이블
CREATE TABLE IF NOT EXISTS boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  boost_type TEXT NOT NULL CHECK (boost_type IN ('opportunity_boost', 'opportunity_premium', 'profile_spotlight', 'weekly_feature')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'canceled')),
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  amount_paid INTEGER NOT NULL,
  payment_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Payment History 테이블
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  boost_id UUID REFERENCES boosts(id) ON DELETE SET NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'boost', 'one_time')),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'KRW',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'canceled')),
  payment_provider TEXT,
  external_payment_id TEXT,
  payment_key TEXT,
  order_id TEXT,
  receipt_url TEXT,
  failure_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_limits_user_period ON usage_limits(user_id, period_start);
CREATE INDEX IF NOT EXISTS idx_boosts_user_id ON boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_boosts_opportunity_id ON boosts(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_boosts_status ON boosts(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_key ON payment_history(payment_key);

-- RLS 정책
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- 사용자 본인 데이터만 조회 가능
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own usage" ON usage_limits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own boosts" ON boosts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own payments" ON payment_history FOR SELECT USING (auth.uid() = user_id);

-- 서비스 역할은 모든 작업 가능
CREATE POLICY "Service role full access subscriptions" ON subscriptions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access usage_limits" ON usage_limits FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access boosts" ON boosts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access payment_history" ON payment_history FOR ALL USING (auth.role() = 'service_role');

-- RPC 함수: 현재 기간 사용량 조회 또는 생성
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
  -- 현재 월의 시작/끝
  v_period_start := date_trunc('month', CURRENT_DATE)::DATE;
  v_period_end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  -- 기존 레코드 조회
  SELECT * INTO v_result FROM usage_limits
  WHERE user_id = p_user_id AND period_start = v_period_start;

  -- 없으면 생성
  IF NOT FOUND THEN
    INSERT INTO usage_limits (user_id, period_start, period_end)
    VALUES (p_user_id, v_period_start, v_period_end)
    RETURNING * INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;

-- RPC 함수: 사용량 증가
CREATE OR REPLACE FUNCTION increment_usage(p_user_id UUID, p_type TEXT)
RETURNS usage_limits
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result usage_limits;
BEGIN
  -- 먼저 현재 기간 레코드 확보
  PERFORM get_or_create_current_usage(p_user_id);

  -- 타입에 따라 증가
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

-- RPC 함수: 만료된 부스트 처리
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
