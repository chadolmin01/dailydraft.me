-- V2 초기 스키마
-- spec.md F1~F6 + CONVENTIONS.md 의 도메인 모델을 따름.
-- 의도: 매니저 1명 = 워크스페이스 1개. 멤버는 비사용자 (Drive/Gmail 만 사용).
-- RLS 원칙: 매니저는 자기 워크스페이스의 모든 자식 row 만 접근.

-- ============================================================
-- workspaces — F1: 매니저당 1개 (V1)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workspaces_owner_id_idx ON public.workspaces(owner_id);

-- V1 제약: 매니저당 1 워크스페이스 (스코프 단순화). V2 에서 풀 예정.
CREATE UNIQUE INDEX IF NOT EXISTS workspaces_one_per_owner_idx
  ON public.workspaces(owner_id);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspaces_owner_all ON public.workspaces;
CREATE POLICY workspaces_owner_all ON public.workspaces
  FOR ALL
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- ============================================================
-- folders — F2: 도메인 단위 (FLIP, KVP 등) Drive/Sheets 연결
-- ============================================================
CREATE TABLE IF NOT EXISTS public.folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  drive_folder_id text,      -- Google Drive folder ID (외부)
  sheet_id text,             -- Google Sheets ID (명단)
  program text,              -- 파일명 컨벤션의 {program} (예: "FLIP1기")
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS folders_workspace_id_idx ON public.folders(workspace_id);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS folders_owner_all ON public.folders;
CREATE POLICY folders_owner_all ON public.folders
  FOR ALL
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- chats — F3: 챗봇 대화 기록 (Claude API + tool use)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
  content jsonb NOT NULL,   -- Claude API messages 형식 (text / tool_use / tool_result)
  tool_calls jsonb,         -- assistant 메시지의 tool_use 블록 캐시
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chats_workspace_created_idx
  ON public.chats(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chats_folder_id_idx ON public.chats(folder_id);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chats_owner_all ON public.chats;
CREATE POLICY chats_owner_all ON public.chats
  FOR ALL
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- google_tokens — Google API 호출용 refresh_token 저장
-- 의도: 매니저당 1행. access_token 은 만료 시 refresh 로 재발급.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.google_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  scope text NOT NULL,
  google_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

-- 클라이언트에서 직접 토큰을 읽을 일은 없음 (서버 라우트가 service_role 로 접근).
-- 안전을 위해 RLS 는 활성화하되 모든 클라이언트 접근 차단.
DROP POLICY IF EXISTS google_tokens_no_client ON public.google_tokens;
CREATE POLICY google_tokens_no_client ON public.google_tokens
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workspaces_touch_updated_at ON public.workspaces;
CREATE TRIGGER workspaces_touch_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS folders_touch_updated_at ON public.folders;
CREATE TRIGGER folders_touch_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS google_tokens_touch_updated_at ON public.google_tokens;
CREATE TRIGGER google_tokens_touch_updated_at
  BEFORE UPDATE ON public.google_tokens
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
