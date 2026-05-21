-- Clubs + Universities (Guild/Badge model)
-- universities: 참조 테이블 (시드 전용, institutions와 별개)
-- clubs: 동아리 본체 (university_id 없음 — 대학은 뱃지로만 연결)
-- club_members: M:N + role + cohort
-- club_credentials: 길드 뱃지 (club이 university/org/program을 "획득")

-- ============================================================
-- 1. universities
-- ============================================================
CREATE TABLE IF NOT EXISTS universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  short_name text,
  email_domains text[] NOT NULL DEFAULT '{}',
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_universities_email_domains
  ON universities USING gin(email_domains);

-- ============================================================
-- 2. clubs
-- ============================================================
CREATE TABLE IF NOT EXISTS clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  logo_url text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clubs_slug ON clubs(slug);
CREATE INDEX IF NOT EXISTS idx_clubs_created_by ON clubs(created_by);

-- slug 예약어 차단 (라우팅 충돌 방지: /club/[slug] vs /club/new 등)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clubs_slug_not_reserved'
  ) THEN
    ALTER TABLE clubs ADD CONSTRAINT clubs_slug_not_reserved
      CHECK (slug NOT IN (
        'admin', 'api', 'login', 'logout', 'signup', 'settings',
        'new', 'edit', 'club', 'clubs', 'dashboard', 'explore',
        'profile', 'notifications', 'search', 'home', 'about'
      ));
  END IF;
END $$;

-- updated_at 트리거 (institutions 마이그레이션에서 정의된 함수 재사용 가정)
-- 함수가 없을 경우를 대비해 안전하게 CREATE OR REPLACE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clubs_updated_at ON clubs;
CREATE TRIGGER trg_clubs_updated_at
  BEFORE UPDATE ON clubs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- clubs 생성 시 created_by를 owner로 자동 등록하는 트리거
-- 의도: RLS self-reference 문제 회피. club_members insert 정책이
-- "이미 admin/owner 멤버여야 insert 가능" 구조라 첫 owner는 insert 불가.
-- security definer 함수로 RLS 우회해서 owner를 삽입한다.
-- 이거 없으면 클럽 생성 시 멤버 테이블이 비어있어서 아무도 클럽을 수정 못 함.
CREATE OR REPLACE FUNCTION auto_add_club_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO club_members (club_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner')
  ON CONFLICT (club_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clubs_auto_owner ON clubs;
CREATE TRIGGER trg_clubs_auto_owner
  AFTER INSERT ON clubs
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_club_owner();

-- ============================================================
-- 3. club_members
-- ============================================================
-- club_members: real user 또는 ghost member 둘 중 하나
-- ghost member: 과거 기수 데이터를 Draft 가입 전에 미리 심어두는 레코드.
-- 본인이 나중에 가입하면 ghost → real로 클레임 가능 (바이럴 훅).
-- user_id nullable, 대신 ghost_name 필수. 둘 중 하나는 반드시 있어야 함.
CREATE TABLE IF NOT EXISTS club_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ghost_name text,
  ghost_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  role text NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'member', 'alumni')),
  cohort text,
  joined_at timestamptz NOT NULL DEFAULT now(),
  -- real or ghost: user_id와 ghost_name 중 하나는 반드시 존재
  CONSTRAINT club_members_real_or_ghost
    CHECK (user_id IS NOT NULL OR ghost_name IS NOT NULL),
  -- real member는 club당 유일 (ghost는 같은 이름이 여러 기수 가능하므로 제외)
  UNIQUE(club_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_club_members_user ON club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_ghost
  ON club_members(club_id, ghost_name) WHERE user_id IS NULL;

-- ============================================================
-- 4. club_credentials (길드 뱃지)
-- ============================================================
CREATE TABLE IF NOT EXISTS club_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  credential_type text NOT NULL
    CHECK (credential_type IN ('university', 'organization', 'program')),
  university_id uuid REFERENCES universities(id) ON DELETE RESTRICT,
  verified_at timestamptz NOT NULL DEFAULT now(),
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_method text NOT NULL
    CHECK (verification_method IN ('email_domain', 'manual_admin', 'invite_code')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(club_id, credential_type, university_id)
);

CREATE INDEX IF NOT EXISTS idx_club_credentials_club
  ON club_credentials(club_id);
CREATE INDEX IF NOT EXISTS idx_club_credentials_university
  ON club_credentials(university_id);

-- ============================================================
-- RLS 헬퍼: self-referential 정책의 무한 재귀 회피
-- ============================================================
-- club_members에서 admin/owner 여부를 체크하는 RLS 정책이 다시
-- club_members를 조회하면 Postgres가 재귀 감지로 에러를 낸다.
-- security definer 함수로 감싸서 RLS 바깥에서 실행되게 한다.
CREATE OR REPLACE FUNCTION is_club_admin(p_club_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM club_members
    WHERE club_id = p_club_id
      AND user_id = p_user_id
      AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION is_club_owner(p_club_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM club_members
    WHERE club_id = p_club_id
      AND user_id = p_user_id
      AND role = 'owner'
  );
$$;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_credentials ENABLE ROW LEVEL SECURITY;

-- universities: public read, write는 service_role (policy 생략 = RLS로 차단됨)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'universities_select_all') THEN
    CREATE POLICY universities_select_all ON universities FOR SELECT USING (true);
  END IF;
END $$;

-- clubs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'clubs_select_all') THEN
    CREATE POLICY clubs_select_all ON clubs FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'clubs_insert_authenticated') THEN
    CREATE POLICY clubs_insert_authenticated ON clubs FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'clubs_update_admin') THEN
    CREATE POLICY clubs_update_admin ON clubs FOR UPDATE
      USING (is_club_admin(id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'clubs_delete_owner') THEN
    CREATE POLICY clubs_delete_owner ON clubs FOR DELETE
      USING (is_club_owner(id, auth.uid()));
  END IF;
END $$;

-- club_members
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'club_members_select_all') THEN
    CREATE POLICY club_members_select_all ON club_members FOR SELECT USING (true);
  END IF;
END $$;

-- insert: owner/admin만 (첫 owner는 auto_add_club_owner 트리거가 security definer로 넣음)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'club_members_insert_admin') THEN
    CREATE POLICY club_members_insert_admin ON club_members FOR INSERT
      WITH CHECK (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'club_members_update_admin') THEN
    CREATE POLICY club_members_update_admin ON club_members FOR UPDATE
      USING (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'club_members_delete_admin_or_self') THEN
    CREATE POLICY club_members_delete_admin_or_self ON club_members FOR DELETE
      USING (
        user_id = auth.uid()
        OR is_club_admin(club_id, auth.uid())
      );
  END IF;
END $$;

-- club_credentials: read-all, write는 service_role만 (policy 생략)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'club_credentials_select_all') THEN
    CREATE POLICY club_credentials_select_all ON club_credentials FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================
-- Seed: universities (UNIVERSITY_LIST 기반)
-- email_domains는 주요 대학만 채움, 나머지는 빈 배열
-- ============================================================
INSERT INTO universities (name, short_name, email_domains) VALUES
  ('서울대학교', '서울대', ARRAY['snu.ac.kr']),
  ('연세대학교', '연세대', ARRAY['yonsei.ac.kr']),
  ('고려대학교', '고려대', ARRAY['korea.ac.kr']),
  ('성균관대학교', '성균관대', ARRAY['skku.edu']),
  ('한양대학교', '한양대', ARRAY['hanyang.ac.kr']),
  ('중앙대학교', '중앙대', ARRAY['cau.ac.kr']),
  ('경희대학교', '경희대', ARRAY['khu.ac.kr']),
  ('한국외국어대학교', '한국외대', ARRAY['hufs.ac.kr']),
  ('서울시립대학교', '시립대', ARRAY['uos.ac.kr']),
  ('건국대학교', '건국대', ARRAY['konkuk.ac.kr']),
  ('동국대학교', '동국대', ARRAY['dongguk.edu']),
  ('홍익대학교', '홍익대', ARRAY['hongik.ac.kr']),
  ('숙명여자대학교', '숙명여대', ARRAY['sookmyung.ac.kr']),
  ('이화여자대학교', '이화여대', ARRAY['ewha.ac.kr']),
  ('국민대학교', '국민대', ARRAY['kookmin.ac.kr']),
  ('숭실대학교', '숭실대', ARRAY['ssu.ac.kr']),
  ('세종대학교', '세종대', ARRAY['sejong.ac.kr']),
  ('광운대학교', '광운대', ARRAY[]::text[]),
  ('명지대학교', '명지대', ARRAY[]::text[]),
  ('상명대학교', '상명대', ARRAY[]::text[]),
  ('서울과학기술대학교', '서울과기대', ARRAY['seoultech.ac.kr']),
  ('한성대학교', '한성대', ARRAY[]::text[]),
  ('삼육대학교', '삼육대', ARRAY[]::text[]),
  ('덕성여자대학교', '덕성여대', ARRAY[]::text[]),
  ('서경대학교', '서경대', ARRAY[]::text[]),
  ('아주대학교', '아주대', ARRAY['ajou.ac.kr']),
  ('인하대학교', '인하대', ARRAY['inha.ac.kr']),
  ('가천대학교', '가천대', ARRAY['gachon.ac.kr']),
  ('단국대학교', '단국대', ARRAY['dankook.ac.kr']),
  ('한국항공대학교', '항공대', ARRAY[]::text[]),
  ('경기대학교', '경기대', ARRAY[]::text[]),
  ('한신대학교', '한신대', ARRAY[]::text[]),
  ('수원대학교', '수원대', ARRAY[]::text[]),
  ('용인대학교', '용인대', ARRAY[]::text[]),
  ('한국공학대학교', '한국공대', ARRAY[]::text[]),
  ('KAIST', 'KAIST', ARRAY['kaist.ac.kr']),
  ('충남대학교', '충남대', ARRAY['cnu.ac.kr']),
  ('충북대학교', '충북대', ARRAY['chungbuk.ac.kr']),
  ('한남대학교', '한남대', ARRAY[]::text[]),
  ('배재대학교', '배재대', ARRAY[]::text[]),
  ('목원대학교', '목원대', ARRAY[]::text[]),
  ('대전대학교', '대전대', ARRAY[]::text[]),
  ('한국과학기술원', '한국과학기술원', ARRAY[]::text[]),
  ('부산대학교', '부산대', ARRAY['pusan.ac.kr']),
  ('경북대학교', '경북대', ARRAY['knu.ac.kr']),
  ('UNIST', 'UNIST', ARRAY['unist.ac.kr']),
  ('POSTECH', 'POSTECH', ARRAY['postech.ac.kr']),
  ('동아대학교', '동아대', ARRAY[]::text[]),
  ('부경대학교', '부경대', ARRAY[]::text[]),
  ('경상국립대학교', '경상대', ARRAY[]::text[]),
  ('울산대학교', '울산대', ARRAY[]::text[]),
  ('영남대학교', '영남대', ARRAY[]::text[]),
  ('계명대학교', '계명대', ARRAY[]::text[]),
  ('전남대학교', '전남대', ARRAY['jnu.ac.kr']),
  ('전북대학교', '전북대', ARRAY['jbnu.ac.kr']),
  ('조선대학교', '조선대', ARRAY[]::text[]),
  ('광주과학기술원', 'GIST', ARRAY['gist.ac.kr']),
  ('강원대학교', '강원대', ARRAY['kangwon.ac.kr']),
  ('제주대학교', '제주대', ARRAY['jejunu.ac.kr']),
  ('한림대학교', '한림대', ARRAY[]::text[]),
  ('한국예술종합학교', '한예종', ARRAY[]::text[]),
  ('한국체육대학교', '한체대', ARRAY[]::text[]),
  ('DGIST', 'DGIST', ARRAY['dgist.ac.kr'])
ON CONFLICT (name) DO NOTHING;
