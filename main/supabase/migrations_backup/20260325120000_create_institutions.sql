-- Institution tables for university entrepreneurship center partnerships
-- Supports B2C model: university centers manage their students on Draft

-- institutions: 대학 창업기관 정보
CREATE TABLE IF NOT EXISTS institutions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,                           -- e.g., "서울대학교 창업지원단"
  university text NOT NULL,                     -- e.g., "서울대학교"
  type text NOT NULL DEFAULT 'startup_center',  -- startup_center, linc_plus, incubator
  description text,
  logo_url text,
  contact_email text,
  contact_phone text,
  settings jsonb DEFAULT '{}'::jsonb,           -- custom settings per institution
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- institution_members: 기관 소속 멤버 (학생, 멘토, 기관관리자)
CREATE TABLE IF NOT EXISTS institution_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'student',         -- student, mentor, admin
  status text NOT NULL DEFAULT 'active',        -- active, inactive
  joined_at timestamptz DEFAULT now() NOT NULL,
  notes text,                                   -- 관리자 메모
  UNIQUE(institution_id, user_id)
);

-- institution_programs: 기관 프로그램 (창업캠프, 경진대회 등)
CREATE TABLE IF NOT EXISTS institution_programs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'general',         -- hackathon, camp, competition, mentoring, general
  description text,
  start_date date,
  end_date date,
  max_participants integer,
  status text NOT NULL DEFAULT 'upcoming',      -- upcoming, active, completed
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_institution_members_institution ON institution_members(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_members_user ON institution_members(user_id);
CREATE INDEX IF NOT EXISTS idx_institution_members_role ON institution_members(role);
CREATE INDEX IF NOT EXISTS idx_institution_programs_institution ON institution_programs(institution_id);
CREATE INDEX IF NOT EXISTS idx_institutions_university ON institutions(university);

-- RLS Policies
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_programs ENABLE ROW LEVEL SECURITY;

-- institutions: 기관 관리자만 조회/수정
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'institutions_select_member') THEN
    CREATE POLICY institutions_select_member ON institutions FOR SELECT
      USING (
        id IN (SELECT institution_id FROM institution_members WHERE user_id = auth.uid())
        OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'institutions_update_admin') THEN
    CREATE POLICY institutions_update_admin ON institutions FOR UPDATE
      USING (
        id IN (SELECT institution_id FROM institution_members WHERE user_id = auth.uid() AND role = 'admin')
        OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
      );
  END IF;
END $$;

-- institution_members: 기관 관리자가 멤버 관리
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inst_members_select') THEN
    CREATE POLICY inst_members_select ON institution_members FOR SELECT
      USING (
        institution_id IN (SELECT institution_id FROM institution_members WHERE user_id = auth.uid())
        OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inst_members_insert_admin') THEN
    CREATE POLICY inst_members_insert_admin ON institution_members FOR INSERT
      WITH CHECK (
        institution_id IN (SELECT institution_id FROM institution_members WHERE user_id = auth.uid() AND role = 'admin')
        OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inst_members_update_admin') THEN
    CREATE POLICY inst_members_update_admin ON institution_members FOR UPDATE
      USING (
        institution_id IN (SELECT institution_id FROM institution_members WHERE user_id = auth.uid() AND role = 'admin')
        OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inst_members_delete_admin') THEN
    CREATE POLICY inst_members_delete_admin ON institution_members FOR DELETE
      USING (
        institution_id IN (SELECT institution_id FROM institution_members WHERE user_id = auth.uid() AND role = 'admin')
        OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
      );
  END IF;
END $$;

-- institution_programs: 기관 멤버 조회, 관리자 수정
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inst_programs_select') THEN
    CREATE POLICY inst_programs_select ON institution_programs FOR SELECT
      USING (
        institution_id IN (SELECT institution_id FROM institution_members WHERE user_id = auth.uid())
        OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inst_programs_manage_admin') THEN
    CREATE POLICY inst_programs_manage_admin ON institution_programs FOR ALL
      USING (
        institution_id IN (SELECT institution_id FROM institution_members WHERE user_id = auth.uid() AND role = 'admin')
        OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
      );
  END IF;
END $$;
