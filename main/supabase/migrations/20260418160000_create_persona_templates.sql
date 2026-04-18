-- ============================================================
-- Persona Templates (mirra.my "내 템플릿" 패턴)
-- ============================================================
-- 회장이 현재 페르소나 상태를 이름 붙여 스냅샷 보관.
-- 저장된 템플릿 카드 클릭 시 persona_fields를 스냅샷 값으로 일괄 upsert (복원).
--
-- 스냅샷 범위: value / source / locked / merge_strategy 만 저장.
-- 복원 시점 의미가 변할 수 있는 confidence(자동 추출 시점 값), updated_by/updated_at은 제외.
-- ============================================================


-- ============================================================
-- 1. owner 기반 조회 헬퍼 (기존 can_view_persona는 persona_id 기반이라 템플릿엔 부적합)
-- ============================================================
-- 템플릿은 persona_id를 연결 안 하고 owner_id만 갖는다. 해당 owner의 페르소나를
-- 볼 수 있는 사용자면 그 owner의 템플릿도 조회 가능.
-- can_edit_persona_owner: 쓰기 권한. club=is_club_admin, personal=본인, project=opportunities.creator_id 또는 club admin.
CREATE OR REPLACE FUNCTION can_edit_persona_owner(p_type text, p_owner_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_type = 'personal' THEN
    RETURN p_owner_id = p_user_id;
  ELSIF p_type = 'club' THEN
    RETURN is_club_admin(p_owner_id, p_user_id);
  ELSIF p_type = 'project' THEN
    RETURN EXISTS (
      SELECT 1 FROM opportunities
      WHERE id = p_owner_id
        AND (
          creator_id = p_user_id
          OR (club_id IS NOT NULL AND is_club_admin(club_id, p_user_id))
        )
    );
  END IF;

  RETURN false;
END;
$$;


-- ============================================================
-- 2. persona_templates
-- ============================================================
-- name은 같은 owner 내 유일 (회장이 중복 이름으로 혼동 않게).
-- fields_snapshot은 배열 형태 jsonb: [{field_key, value, source, locked, merge_strategy}, ...]
-- source_persona_id: 저장 시점의 원본 페르소나 참조(선택). 페르소나 삭제돼도 템플릿은 유지.
CREATE TABLE IF NOT EXISTS persona_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('club', 'project', 'personal')),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  fields_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (type, owner_id, name)
);

CREATE INDEX IF NOT EXISTS idx_persona_templates_owner
  ON persona_templates(type, owner_id, created_at DESC);


-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE persona_templates ENABLE ROW LEVEL SECURITY;

-- SELECT: 편집자만 (템플릿은 내부 자산, 공개 공유는 추후 별도 테이블/플래그로)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'persona_templates_select') THEN
    CREATE POLICY persona_templates_select ON persona_templates FOR SELECT
      USING (can_edit_persona_owner(type, owner_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'persona_templates_insert') THEN
    CREATE POLICY persona_templates_insert ON persona_templates FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL
        AND (created_by IS NULL OR created_by = auth.uid())
        AND can_edit_persona_owner(type, owner_id, auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'persona_templates_update') THEN
    CREATE POLICY persona_templates_update ON persona_templates FOR UPDATE
      USING (can_edit_persona_owner(type, owner_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'persona_templates_delete') THEN
    CREATE POLICY persona_templates_delete ON persona_templates FOR DELETE
      USING (can_edit_persona_owner(type, owner_id, auth.uid()));
  END IF;
END $$;


-- ============================================================
-- Comments
-- ============================================================
COMMENT ON TABLE persona_templates IS
  'mirra.my "내 템플릿" 패턴. 페르소나 스냅샷 저장/복원 단위. fields_snapshot에 persona_fields 일부 컬럼만 직렬화.';
COMMENT ON COLUMN persona_templates.fields_snapshot IS
  '[{field_key, value, source, locked, merge_strategy}, ...] — confidence/updated_* 제외';
COMMENT ON COLUMN persona_templates.source_persona_id IS
  '저장 시점 원본 페르소나 참조(선택). 페르소나 삭제돼도 템플릿은 유지 (ON DELETE SET NULL).';
