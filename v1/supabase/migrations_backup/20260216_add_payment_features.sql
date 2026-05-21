-- 결제 실패 처리 테이블
CREATE TABLE IF NOT EXISTS payment_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'initial_failure' CHECK (status IN ('initial_failure', 'retry_failed', 'final_warning', 'downgraded')),
  failure_count INTEGER NOT NULL DEFAULT 1,
  first_failure_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_failure_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  grace_period_ends_at TIMESTAMPTZ NOT NULL,
  downgrade_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  notifications_sent TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_payment_failures_user_id ON payment_failures(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_failures_subscription_id ON payment_failures(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_failures_status ON payment_failures(status);
CREATE INDEX IF NOT EXISTS idx_payment_failures_unresolved ON payment_failures(user_id) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payment_failures_downgrade_pending ON payment_failures(downgrade_at) WHERE resolved_at IS NULL;

-- 알림 테이블 (결제 실패 알림용)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 알림 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- RLS 정책
ALTER TABLE payment_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- payment_failures RLS: 본인의 기록만 조회 가능
CREATE POLICY "Users can view own payment failures"
  ON payment_failures FOR SELECT
  USING (auth.uid() = user_id);

-- notifications RLS: 본인의 알림만 조회/수정 가능
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 서비스 역할은 모든 작업 가능
CREATE POLICY "Service role can manage payment_failures"
  ON payment_failures FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage notifications"
  ON notifications FOR ALL
  USING (auth.role() = 'service_role');

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_failures_updated_at
  BEFORE UPDATE ON payment_failures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
