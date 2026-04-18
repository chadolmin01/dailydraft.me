-- ============================================================
-- Persona Engine Core (R1)
-- ============================================================
-- 3계층(club/project/personal) 페르소나 엔진의 기반 스키마.
-- mirra.my 스타일 브랜딩 페르소나를 Discord corpus에서 자동 학습하고
-- SNS/모집/제안서 등 외부 발행의 단일 CPU로 사용하기 위한 데이터 모델.
--
-- owner_id는 polymorphic:
--   type='club'     → clubs.id
--   type='project'  → opportunities.id
--   type='personal' → auth.users.id
-- FK 제약 대신 앱/RLS 레이어에서 검증한다 (세 테이블 참조가 섞이면
-- FK 분기 불가능 + 타입별 CASCADE 정책이 달라서).
-- ============================================================


-- ============================================================
-- 1. personas (본체)
-- ============================================================
CREATE TABLE IF NOT EXISTS personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('club', 'project', 'personal')),
  owner_id uuid NOT NULL,
  parent_persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  name text NOT NULL,
  version int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'archived')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  owner_last_edited_at timestamptz,
  -- 같은 owner에 여러 version을 허용하되 동일 버전 중복은 차단.
  -- 기수 전환 시 version bump로 이전 페르소나를 archived로 보존 가능.
  UNIQUE (type, owner_id, version)
);

CREATE INDEX IF NOT EXISTS idx_personas_owner ON personas(type, owner_id);
CREATE INDEX IF NOT EXISTS idx_personas_parent
  ON personas(parent_persona_id) WHERE parent_persona_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_personas_status ON personas(status);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_personas_updated_at ON personas;
CREATE TRIGGER trg_personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 2. persona_fields (슬롯별 값)
-- ============================================================
-- field_key는 mirra.my 스타일 페르소나 템플릿의 슬롯명과 일치시킨다.
-- CHECK로 고정 집합을 강제하는 이유: 오타/임의 키가 스며들면 상속 merge가
-- 비결정적이 되고 UI에서 슬롯별 뷰를 제공하기 어려워진다.
-- 새 슬롯 필요 시 후속 마이그레이션에서 CHECK 재정의.
CREATE TABLE IF NOT EXISTS persona_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  field_key text NOT NULL CHECK (field_key IN (
    'identity',              -- 이 사람/조직은 누구인가
    'content_patterns',      -- 인기 콘텐츠 패턴
    'audience',              -- 콘텐츠 독자
    'sentence_style',        -- 문장 길이, 단락, 줄바꿈
    'ending_signature',      -- 어미 Top 5, 문어체/구어체 비율
    'thought_development',   -- 논리 구조
    'hooking_style',         -- 첫 1~2문장 후킹 패턴
    'emotional_distance',    -- 독자와의 관계, 자신감, 자기노출
    'humor',                 -- 유머 기제, 빈도
    'vocabulary',            -- 전문용어, 반복 표현, 비유
    'rhythm',                -- 문장 길이 변주, 반복/대구법
    'taboos',                -- Absolute Taboos
    'reproduction_checklist' -- 재현 체크리스트
  )),
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- 값의 출처: 자동 추출 / 수동 입력 / 부모에서 상속.
  -- 상속된 값은 이 테이블에 복사하지 않고 resolvePersona()에서 런타임 merge.
  -- source='inherited'는 "이 필드는 일부러 부모 값을 쓰고 있음"을 명시할 때만 사용.
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('auto', 'manual', 'inherited')),
  -- 이 필드가 자식에게 상속될 때의 merge 전략.
  -- full_inherit: 부모 고정, 자식 편집 잠금 (소속 맥락, 브랜드 가치)
  -- extend: 부모 + 자식 append (taboos, reproduction_checklist)
  -- override: 자식이 완전 덮어쓰기 (후킹, 어미, 도메인 용어)
  merge_strategy text NOT NULL DEFAULT 'override'
    CHECK (merge_strategy IN ('full_inherit', 'extend', 'override')),
  -- auto 추출의 신뢰도. manual은 1.0.
  -- UI에서 "confidence < 0.6인 슬롯만 확인 요청" 같은 질문지 생성에 사용.
  confidence numeric NOT NULL DEFAULT 1.0
    CHECK (confidence >= 0 AND confidence <= 1),
  -- true면 자식 페르소나에서 이 필드 편집 불가.
  -- 동아리 owner가 프로젝트 페르소나의 소속 맥락을 보호할 때 사용.
  locked boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (persona_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_persona_fields_persona
  ON persona_fields(persona_id);

DROP TRIGGER IF EXISTS trg_persona_fields_updated_at ON persona_fields;
CREATE TRIGGER trg_persona_fields_updated_at
  BEFORE UPDATE ON persona_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 3. persona_corpus_sources (학습 소스 + 가중치)
-- ============================================================
-- role_weight_rules 예시:
--   {"president": 5, "officer": 3, "member": 1}
--   {"reaction_threshold": 10, "reaction_multiplier": 2}
--   {"channel_type_weights": {"announcement": 10, "general": 1}}
-- 가중치가 과해지면 페르소나가 소수 파워유저의 톤으로만 수렴하므로
-- 앱 레이어에서 상한(cap)을 둔다.
CREATE TABLE IF NOT EXISTS persona_corpus_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN (
    'discord_channel',
    'discord_server',
    'github_repo',
    'sns_account',
    'notion_page',
    'draft_internal'   -- 온보딩 답변, 프로젝트 설명, 주간 업데이트 등
  )),
  source_ref text NOT NULL,          -- channel_id / repo full_name / account handle
  weight real NOT NULL DEFAULT 1.0 CHECK (weight >= 0),
  role_weight_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (persona_id, source_type, source_ref)
);

CREATE INDEX IF NOT EXISTS idx_persona_corpus_sources_persona
  ON persona_corpus_sources(persona_id) WHERE active = true;


-- ============================================================
-- 4. persona_training_runs (학습 이력)
-- ============================================================
-- corpus_snapshot_hash로 "동일 입력에 대한 재학습"을 식별해 비용 낭비 방지.
-- extracted_diff에 before/after 값을 저장해 "이 run 때문에 톤이 어긋남" 시
-- 특정 run만 롤백 가능하도록 남긴다.
CREATE TABLE IF NOT EXISTS persona_training_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  corpus_snapshot_hash text,
  extracted_diff jsonb NOT NULL DEFAULT '{}'::jsonb,
  model_version text,
  trigger text NOT NULL CHECK (trigger IN (
    'initial',            -- 최초 연결 시 백필
    'weekly',             -- 주기 배치
    'event',              -- 특정 이벤트(모집 마감, 행사 완료 등)
    'manual',             -- 회장이 직접 재학습 버튼
    'rejection_feedback'  -- 초안 대량 거절 → Taboos 재학습
  )),
  status text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('running', 'completed', 'failed')),
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_persona_training_runs_persona_started
  ON persona_training_runs(persona_id, started_at DESC);


-- ============================================================
-- 5. persona_outputs (발행물 이력)
-- ============================================================
-- output_type은 아웃풋 스튜디오 템플릿과 1:1 매핑 (text로 유연하게).
-- rejected_reason은 회장이 남긴 거절 피드백으로, 다음 training_run의
-- trigger='rejection_feedback' 입력이 된다 → 자동으로 Taboos 강화.
CREATE TABLE IF NOT EXISTS persona_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  output_type text NOT NULL,         -- 'instagram_caption' | 'recruit_post' | 'weekly_update' | ...
  prompt_template_id text,
  input_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_content text NOT NULL,
  destination text,                  -- 'instagram' | 'discord' | 'email' | ...
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'approved', 'published', 'rejected')),
  rejected_reason text,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  published_at timestamptz,
  external_ref text,                 -- 발행된 외부 플랫폼의 고유 ID
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_persona_outputs_persona_created
  ON persona_outputs(persona_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_persona_outputs_status
  ON persona_outputs(status);

DROP TRIGGER IF EXISTS trg_persona_outputs_updated_at ON persona_outputs;
CREATE TRIGGER trg_persona_outputs_updated_at
  BEFORE UPDATE ON persona_outputs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- RLS 헬퍼: 페르소나 편집/조회 권한
-- ============================================================
-- 편집 권한은 type별로 분기:
--   personal: 본인만
--   club:     is_club_admin (기존 함수 재사용)
--   project:  opportunities.creator_id 본인 또는 소속 club의 admin
--
-- SECURITY DEFINER로 감싸는 이유: RLS 정책 안에서 clubs/opportunities를
-- 조회할 때 재귀 감지 + 교차 테이블 RLS 충돌을 피하기 위함.
CREATE OR REPLACE FUNCTION can_edit_persona(p_persona_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_type text;
  v_owner_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT type, owner_id INTO v_type, v_owner_id
  FROM personas WHERE id = p_persona_id;

  IF v_type IS NULL THEN
    RETURN false;
  END IF;

  IF v_type = 'personal' THEN
    RETURN v_owner_id = p_user_id;
  ELSIF v_type = 'club' THEN
    RETURN is_club_admin(v_owner_id, p_user_id);
  ELSIF v_type = 'project' THEN
    RETURN EXISTS (
      SELECT 1 FROM opportunities
      WHERE id = v_owner_id
        AND (
          creator_id = p_user_id
          OR (club_id IS NOT NULL AND is_club_admin(club_id, p_user_id))
        )
    );
  END IF;

  RETURN false;
END;
$$;

-- 조회 권한: active/archived는 공개 (브랜딩 자산이므로 타인 노출 전제),
-- draft는 편집자만.
CREATE OR REPLACE FUNCTION can_view_persona(p_persona_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status FROM personas WHERE id = p_persona_id;
  IF v_status IS NULL THEN
    RETURN false;
  END IF;
  IF v_status IN ('active', 'archived') THEN
    RETURN true;
  END IF;
  RETURN can_edit_persona(p_persona_id, p_user_id);
END;
$$;


-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_corpus_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_training_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_outputs ENABLE ROW LEVEL SECURITY;

-- personas
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'personas_select_viewable') THEN
    CREATE POLICY personas_select_viewable ON personas FOR SELECT
      USING (can_view_persona(id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'personas_insert_authenticated') THEN
    CREATE POLICY personas_insert_authenticated ON personas FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL
        AND (created_by IS NULL OR created_by = auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'personas_update_editable') THEN
    CREATE POLICY personas_update_editable ON personas FOR UPDATE
      USING (can_edit_persona(id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'personas_delete_editable') THEN
    CREATE POLICY personas_delete_editable ON personas FOR DELETE
      USING (can_edit_persona(id, auth.uid()));
  END IF;
END $$;

-- persona_fields
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'persona_fields_select_via_persona') THEN
    CREATE POLICY persona_fields_select_via_persona ON persona_fields FOR SELECT
      USING (can_view_persona(persona_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'persona_fields_write_editable') THEN
    CREATE POLICY persona_fields_write_editable ON persona_fields FOR ALL
      USING (can_edit_persona(persona_id, auth.uid()))
      WITH CHECK (can_edit_persona(persona_id, auth.uid()));
  END IF;
END $$;

-- persona_corpus_sources
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'persona_corpus_sources_select') THEN
    CREATE POLICY persona_corpus_sources_select ON persona_corpus_sources FOR SELECT
      USING (can_edit_persona(persona_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'persona_corpus_sources_write') THEN
    CREATE POLICY persona_corpus_sources_write ON persona_corpus_sources FOR ALL
      USING (can_edit_persona(persona_id, auth.uid()))
      WITH CHECK (can_edit_persona(persona_id, auth.uid()));
  END IF;
END $$;

-- persona_training_runs: 쓰기는 service_role (policy 생략), 읽기는 편집자만
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'persona_training_runs_select') THEN
    CREATE POLICY persona_training_runs_select ON persona_training_runs FOR SELECT
      USING (can_edit_persona(persona_id, auth.uid()));
  END IF;
END $$;

-- persona_outputs: published는 공개, 나머지는 편집자만
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'persona_outputs_select') THEN
    CREATE POLICY persona_outputs_select ON persona_outputs FOR SELECT
      USING (
        status = 'published'
        OR can_edit_persona(persona_id, auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'persona_outputs_write') THEN
    CREATE POLICY persona_outputs_write ON persona_outputs FOR ALL
      USING (can_edit_persona(persona_id, auth.uid()))
      WITH CHECK (can_edit_persona(persona_id, auth.uid()));
  END IF;
END $$;


-- ============================================================
-- Comments
-- ============================================================
COMMENT ON TABLE personas IS
  '3계층 페르소나. owner_id는 polymorphic이며 type에 따라 clubs/opportunities/auth.users를 가리킴';
COMMENT ON COLUMN personas.parent_persona_id IS
  '상속 체인. project는 보통 club persona를 부모로, personal은 보통 null';
COMMENT ON COLUMN persona_fields.merge_strategy IS
  'full_inherit=부모고정·자식잠금, extend=부모+자식append, override=자식덮어쓰기';
COMMENT ON COLUMN persona_fields.locked IS
  'true면 자식 페르소나에서 편집 불가. 상속된 소속 맥락 필드에 사용';
COMMENT ON COLUMN persona_corpus_sources.role_weight_rules IS
  '역할/채널/반응 기반 가중치 규칙. 앱 레이어에서 상한 cap 적용';
COMMENT ON COLUMN persona_training_runs.extracted_diff IS
  'before/after 필드 값 jsonb. 특정 run만 롤백 가능하도록';
COMMENT ON COLUMN persona_outputs.rejected_reason IS
  '거절 사유. 다음 training_run(trigger=rejection_feedback)의 입력이 됨';
