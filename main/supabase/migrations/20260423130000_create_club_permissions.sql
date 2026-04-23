-- ==========================================================================
-- Club Permission System (Phase 1)
--
-- Draft 네이티브 역할·채널·권한 구조. Discord 연동은 Phase 2/3에서 추가되며
-- 이 테이블은 "Draft가 관리하는 권한 설정"의 source of truth 역할.
--
-- 주요 테이블:
--   club_permission_roles          — 클럽별 역할 정의
--   club_permission_channels       — 클럽별 채널 정의 (카테고리 포함)
--   club_permission_role_channels  — 역할 ↔ 채널 M:M (접근 가능 여부)
--   club_permission_role_members   — 역할 ↔ 멤버 M:M (누가 어떤 역할)
--
-- clubs 테이블 확장:
--   discord_guild_id, discord_guild_name, discord_connected_at
--   permission_preset, permission_member_source
-- ==========================================================================

-- ============================================
-- 1. Club Permission Roles
-- ============================================
CREATE TABLE IF NOT EXISTS club_permission_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_admin BOOLEAN NOT NULL DEFAULT false,
  dot_color TEXT NOT NULL DEFAULT '#6b7280',
  display_order INT NOT NULL DEFAULT 0,
  -- Phase 2: Discord 동기화 시 해당 서버의 Role ID 저장
  discord_role_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (club_id, name)
);

CREATE INDEX IF NOT EXISTS idx_club_permission_roles_club
  ON club_permission_roles(club_id);

-- ============================================
-- 2. Club Permission Channels
-- ============================================
CREATE TABLE IF NOT EXISTS club_permission_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '일반',
  display_order INT NOT NULL DEFAULT 0,
  discord_channel_id TEXT,
  discord_category_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (club_id, name)
);

CREATE INDEX IF NOT EXISTS idx_club_permission_channels_club
  ON club_permission_channels(club_id);

-- ============================================
-- 3. Role ↔ Channel (접근 가능 M:M)
-- ============================================
CREATE TABLE IF NOT EXISTS club_permission_role_channels (
  role_id UUID NOT NULL REFERENCES club_permission_roles(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES club_permission_channels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_prc_channel
  ON club_permission_role_channels(channel_id);

-- ============================================
-- 4. Role ↔ Member (역할 배정 M:M)
-- user_id NOT NULL (Draft 가입자) OR discord_user_id NOT NULL (Discord only)
-- ============================================
CREATE TABLE IF NOT EXISTS club_permission_role_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES club_permission_roles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_user_id TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR discord_user_id IS NOT NULL)
);

-- 한 역할당 같은 user_id는 한 번만
CREATE UNIQUE INDEX IF NOT EXISTS uq_prm_role_user
  ON club_permission_role_members(role_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_prm_role_discord
  ON club_permission_role_members(role_id, discord_user_id)
  WHERE discord_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prm_user
  ON club_permission_role_members(user_id)
  WHERE user_id IS NOT NULL;

-- ============================================
-- 5. clubs 테이블 확장 (권한 시스템 전용 컬럼만)
--
-- 주의: Discord guild_id / guild_name은 이미 `discord_bot_installations` 테이블이
-- 담당하므로 여기선 추가하지 않음 (중복 방지). 권한 시스템이 Discord 연결 정보를
-- 읽을 때는 `discord_bot_installations` JOIN 사용.
-- ============================================
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS permission_preset TEXT,
  ADD COLUMN IF NOT EXISTS permission_member_source TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clubs_permission_member_source_chk'
  ) THEN
    ALTER TABLE clubs ADD CONSTRAINT clubs_permission_member_source_chk
      CHECK (
        permission_member_source IS NULL
        OR permission_member_source IN ('discord-sync', 'draft-match', 'manual')
      );
  END IF;
END $$;

-- ============================================
-- 6. updated_at 자동 갱신 트리거
-- (공통 trigger function이 없을 경우 대비해 여기서 정의)
-- ============================================
CREATE OR REPLACE FUNCTION club_permissions_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cpr_updated_at ON club_permission_roles;
CREATE TRIGGER trg_cpr_updated_at
  BEFORE UPDATE ON club_permission_roles
  FOR EACH ROW EXECUTE FUNCTION club_permissions_set_updated_at();

DROP TRIGGER IF EXISTS trg_cpc_updated_at ON club_permission_channels;
CREATE TRIGGER trg_cpc_updated_at
  BEFORE UPDATE ON club_permission_channels
  FOR EACH ROW EXECUTE FUNCTION club_permissions_set_updated_at();

-- ============================================
-- 7. RLS
-- is_club_admin(club_id, user_id) 과 is_club_member(club_id, user_id) 는
-- 20260410120000 / 20260412130000 / 20260414120000 마이그레이션에서 이미 정의됨
-- ============================================
ALTER TABLE club_permission_roles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_permission_channels       ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_permission_role_channels  ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_permission_role_members   ENABLE ROW LEVEL SECURITY;

-- ---------- club_permission_roles ----------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cpr_select_member') THEN
    CREATE POLICY cpr_select_member ON club_permission_roles
      FOR SELECT
      USING (
        is_club_member(club_id, auth.uid())
        OR is_club_admin(club_id, auth.uid())
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cpr_insert_admin') THEN
    CREATE POLICY cpr_insert_admin ON club_permission_roles
      FOR INSERT
      WITH CHECK (is_club_admin(club_id, auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cpr_update_admin') THEN
    CREATE POLICY cpr_update_admin ON club_permission_roles
      FOR UPDATE
      USING (is_club_admin(club_id, auth.uid()))
      WITH CHECK (is_club_admin(club_id, auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cpr_delete_admin') THEN
    CREATE POLICY cpr_delete_admin ON club_permission_roles
      FOR DELETE
      USING (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

-- ---------- club_permission_channels ----------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cpc_select_member') THEN
    CREATE POLICY cpc_select_member ON club_permission_channels
      FOR SELECT
      USING (
        is_club_member(club_id, auth.uid())
        OR is_club_admin(club_id, auth.uid())
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cpc_insert_admin') THEN
    CREATE POLICY cpc_insert_admin ON club_permission_channels
      FOR INSERT
      WITH CHECK (is_club_admin(club_id, auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cpc_update_admin') THEN
    CREATE POLICY cpc_update_admin ON club_permission_channels
      FOR UPDATE
      USING (is_club_admin(club_id, auth.uid()))
      WITH CHECK (is_club_admin(club_id, auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cpc_delete_admin') THEN
    CREATE POLICY cpc_delete_admin ON club_permission_channels
      FOR DELETE
      USING (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;

-- ---------- club_permission_role_channels ----------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'prc_select') THEN
    CREATE POLICY prc_select ON club_permission_role_channels
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM club_permission_roles r
          WHERE r.id = club_permission_role_channels.role_id
            AND (is_club_member(r.club_id, auth.uid()) OR is_club_admin(r.club_id, auth.uid()))
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'prc_insert_admin') THEN
    CREATE POLICY prc_insert_admin ON club_permission_role_channels
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM club_permission_roles r
          WHERE r.id = club_permission_role_channels.role_id
            AND is_club_admin(r.club_id, auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'prc_delete_admin') THEN
    CREATE POLICY prc_delete_admin ON club_permission_role_channels
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM club_permission_roles r
          WHERE r.id = club_permission_role_channels.role_id
            AND is_club_admin(r.club_id, auth.uid())
        )
      );
  END IF;
END $$;

-- ---------- club_permission_role_members ----------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'prm_select') THEN
    CREATE POLICY prm_select ON club_permission_role_members
      FOR SELECT
      USING (
        -- 본인 배정은 직접 조회 가능
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM club_permission_roles r
          WHERE r.id = club_permission_role_members.role_id
            AND (is_club_member(r.club_id, auth.uid()) OR is_club_admin(r.club_id, auth.uid()))
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'prm_insert_admin') THEN
    CREATE POLICY prm_insert_admin ON club_permission_role_members
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM club_permission_roles r
          WHERE r.id = club_permission_role_members.role_id
            AND is_club_admin(r.club_id, auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'prm_delete_admin') THEN
    CREATE POLICY prm_delete_admin ON club_permission_role_members
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM club_permission_roles r
          WHERE r.id = club_permission_role_members.role_id
            AND is_club_admin(r.club_id, auth.uid())
        )
      );
  END IF;
END $$;

-- ==========================================================================
-- Rollback 가이드 (수동):
--   DROP TABLE club_permission_role_members CASCADE;
--   DROP TABLE club_permission_role_channels CASCADE;
--   DROP TABLE club_permission_channels CASCADE;
--   DROP TABLE club_permission_roles CASCADE;
--   ALTER TABLE clubs
--     DROP CONSTRAINT IF EXISTS clubs_permission_member_source_chk,
--     DROP COLUMN IF EXISTS permission_preset,
--     DROP COLUMN IF EXISTS permission_member_source;
-- ==========================================================================
