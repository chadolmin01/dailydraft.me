-- error_logs: 모든 인증 유저 → admin만 읽기 가능하도록 변경
DROP POLICY IF EXISTS "Authenticated users can read error logs" ON error_logs;

DROP POLICY IF EXISTS "Admins can read error logs" ON error_logs;
CREATE POLICY "Admins can read error logs"
ON error_logs FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
);
