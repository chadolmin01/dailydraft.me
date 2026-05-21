-- Error logs table for admin monitoring
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Error classification
    level TEXT NOT NULL DEFAULT 'error' CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    source TEXT NOT NULL, -- 'api', 'webhook', 'cron', 'client'

    -- Error details
    error_code TEXT,
    message TEXT NOT NULL,
    stack_trace TEXT,

    -- Context
    endpoint TEXT, -- API route path
    method TEXT, -- HTTP method
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    request_body JSONB,
    request_headers JSONB,

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Client info
    ip_address TEXT,
    user_agent TEXT
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_source ON error_logs(source);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_endpoint ON error_logs(endpoint);

-- RLS policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Admins can read error logs" ON error_logs;
DROP POLICY IF EXISTS "Service can insert error logs" ON error_logs;
DROP POLICY IF EXISTS "Authenticated users can read error logs" ON error_logs;

-- Allow authenticated users to read error logs
-- (Admin access control handled on frontend/middleware)
CREATE POLICY "Authenticated users can read error logs"
ON error_logs FOR SELECT
TO authenticated
USING (true);

-- Service role can insert (for server-side logging)
CREATE POLICY "Service can insert error logs"
ON error_logs FOR INSERT
TO service_role
WITH CHECK (true);

-- Auto-cleanup old logs (keep 30 days)
-- This function can be called by a cron job
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM error_logs
    WHERE created_at < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

COMMENT ON TABLE error_logs IS 'Server-side error logs for admin monitoring';
