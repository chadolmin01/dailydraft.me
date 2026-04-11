-- 멀티소스 하네스 커넥터 설정
-- 동아리가 사용하는 외부 도구 연동 정보 저장
-- URL/토큰만 붙여넣기로 세팅 완료

CREATE TABLE IF NOT EXISTS club_harness_connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  -- 특정 프로젝트에만 연결 (null이면 클럽 전체)
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
  -- 커넥터 타입
  connector_type text NOT NULL CHECK (connector_type IN (
    'google_sheets', 'github', 'notion', 'figma',
    'google_calendar', 'google_drive', 'linear', 'slack'
  )),
  -- 연결 정보 (JSON)
  -- 예: { "type": "google_sheets", "spreadsheetUrl": "https://..." }
  -- 토큰이 포함될 수 있으므로 RLS로 admin만 접근
  credentials jsonb NOT NULL DEFAULT '{}',
  -- 표시 이름 (운영자가 구분하기 위한 라벨)
  display_name text,
  -- 활성 여부
  enabled boolean NOT NULL DEFAULT true,
  -- 마지막 수집 시각
  last_fetched_at timestamptz,
  -- 마지막 에러 (null이면 정상)
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- 같은 클럽에서 같은 타입+같은 프로젝트는 중복 방지
  UNIQUE(club_id, connector_type, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_harness_connectors_club
  ON club_harness_connectors(club_id, enabled);

-- RLS: credentials에 토큰이 있으므로 admin만 접근
ALTER TABLE club_harness_connectors ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'harness_connectors_select_admin') THEN
    CREATE POLICY harness_connectors_select_admin ON club_harness_connectors FOR SELECT
      USING (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'harness_connectors_insert_admin') THEN
    CREATE POLICY harness_connectors_insert_admin ON club_harness_connectors FOR INSERT
      WITH CHECK (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'harness_connectors_update_admin') THEN
    CREATE POLICY harness_connectors_update_admin ON club_harness_connectors FOR UPDATE
      USING (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'harness_connectors_delete_admin') THEN
    CREATE POLICY harness_connectors_delete_admin ON club_harness_connectors FOR DELETE
      USING (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;
