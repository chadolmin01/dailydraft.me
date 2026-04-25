-- ==========================================================================
-- Club Assets Registry (Phase 0)
--
-- 동아리 운영진이 외부 도구·계정·문서의 *위치만* 등록하는 레지스트리.
-- Draft 는 콘텐츠를 옮기지 않음 — URL·메타데이터·담당자만 보관.
-- 임베드 미리보기는 각 플랫폼 API (Discord·GitHub 등) 로 실시간 fetch.
--
-- 비번 자체는 절대 저장하지 않음. credential_location 필드는 *어디에 보관되어
-- 있는지의 텍스트* (예: "1Password 팀 vault > flip-ops") 만 받음.
-- ==========================================================================

CREATE TABLE IF NOT EXISTS club_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  -- 자산 유형 — URL 패턴으로 자동 추론. 'other' 는 fallback.
  -- enum 대신 text 로 둠 — 새 플랫폼 추가 시 마이그레이션 없이 처리 가능.
  asset_type TEXT NOT NULL DEFAULT 'other'
    CHECK (asset_type IN ('drive', 'gmail', 'notion', 'github', 'discord', 'figma', 'instagram', 'email', 'other')),

  name TEXT NOT NULL,
  url TEXT NOT NULL,

  -- 담당자 (Draft 가입 유저). 가입 안 된 외부 인물은 owner_display_name 으로 대체.
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_display_name TEXT,
  owner_role_label TEXT,

  -- 비번이 *어디에* 보관되는지의 텍스트. 비번 자체 저장 X.
  credential_location TEXT,
  notes TEXT,

  -- 인수인계 시 "담당 변경 필요" 플래그 — 운영진이 수동 표시.
  needs_handover BOOLEAN NOT NULL DEFAULT false,

  -- 정렬·표시 순서
  display_order INT NOT NULL DEFAULT 0,

  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_club_assets_club ON club_assets(club_id);
CREATE INDEX IF NOT EXISTS idx_club_assets_type ON club_assets(club_id, asset_type);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION club_assets_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_club_assets_updated_at ON club_assets;
CREATE TRIGGER trg_club_assets_updated_at
  BEFORE UPDATE ON club_assets
  FOR EACH ROW EXECUTE FUNCTION club_assets_set_updated_at();

-- ============================================
-- RLS
-- 운영진(is_club_admin) 만 모든 CRUD. 일반 멤버도 SELECT 는 허용 — 자산 위치를
-- 알아야 작업 가능. 비번 자체는 저장 안 하니 SELECT 노출 범위 넓혀도 안전.
-- ============================================
ALTER TABLE club_assets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'club_assets_select_member') THEN
    CREATE POLICY club_assets_select_member ON club_assets
      FOR SELECT
      USING (
        is_club_member(club_id, auth.uid())
        OR is_club_admin(club_id, auth.uid())
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'club_assets_insert_admin') THEN
    CREATE POLICY club_assets_insert_admin ON club_assets
      FOR INSERT
      WITH CHECK (is_club_admin(club_id, auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'club_assets_update_admin') THEN
    CREATE POLICY club_assets_update_admin ON club_assets
      FOR UPDATE
      USING (is_club_admin(club_id, auth.uid()))
      WITH CHECK (is_club_admin(club_id, auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'club_assets_delete_admin') THEN
    CREATE POLICY club_assets_delete_admin ON club_assets
      FOR DELETE
      USING (is_club_admin(club_id, auth.uid()));
  END IF;
END $$;
