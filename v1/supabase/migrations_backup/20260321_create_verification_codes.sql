-- 대학 이메일 인증 코드 저장 테이블
-- in-memory Map → DB 이전 (서버리스 환경 호환)
CREATE TABLE IF NOT EXISTS verification_codes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  email TEXT NOT NULL,
  attempts INT DEFAULT 0,
  send_count INT DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL,
  send_reset_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 hour'),
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: service_role만 접근 가능 (API 라우트에서 admin client 사용)
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- 만료된 코드 자동 정리용 인덱스
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);
