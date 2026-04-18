-- ============================================================
-- persona_idea_cards — 콘텐츠 대량 기획 칸반용 글감 카드
-- ============================================================
-- mirra 020626 패턴. "10개 기획받기" 결과를 저장하고 3컬럼 칸반으로 관리.
-- 3 상태:
--   pending: 작성 대기중 (AI가 제안만 한 상태)
--   drafted: 초안 생성됨 (이 카드로 실제 bundle 생성 완료)
--   used:    초안 사용됨 (생성된 bundle이 발행까지 간 상태)
-- ============================================================

CREATE TABLE IF NOT EXISTS persona_idea_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,

  title text NOT NULL,
  description text NOT NULL,
  event_type_hint text NOT NULL DEFAULT 'announcement',
  source text NOT NULL CHECK (source IN ('self','internet','internal')),

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','drafted','used','dismissed')),

  -- 이 카드로 만든 bundle (status='drafted'/'used'일 때)
  bundle_id uuid REFERENCES persona_output_bundles(id) ON DELETE SET NULL,

  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_idea_cards_persona_status
  ON persona_idea_cards(persona_id, status, created_at DESC);


-- RLS — can_edit/view_persona 재활용
ALTER TABLE persona_idea_cards ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'persona_idea_cards'
      AND policyname = 'idea_cards_select'
  ) THEN
    CREATE POLICY idea_cards_select
      ON persona_idea_cards FOR SELECT
      USING (can_view_persona(persona_id, auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'persona_idea_cards'
      AND policyname = 'idea_cards_write'
  ) THEN
    CREATE POLICY idea_cards_write
      ON persona_idea_cards FOR ALL
      USING (can_edit_persona(persona_id, auth.uid()))
      WITH CHECK (can_edit_persona(persona_id, auth.uid()));
  END IF;
END $$;


-- updated_at trigger
CREATE OR REPLACE FUNCTION persona_idea_cards_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_idea_cards_updated_at ON persona_idea_cards;
CREATE TRIGGER trg_idea_cards_updated_at
  BEFORE UPDATE ON persona_idea_cards
  FOR EACH ROW EXECUTE FUNCTION persona_idea_cards_set_updated_at();


COMMENT ON TABLE persona_idea_cards IS
  '대량 기획 칸반용 글감 카드. AI 제안 → pending → drafted(bundle 연결) → used(발행 완료) 파이프라인.';
