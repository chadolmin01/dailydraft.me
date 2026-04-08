-- AI 매칭 심층 분석 캐시 테이블
-- 목적: Gemini 호출 결과를 7일간 캐싱해 비용/latency 절감
-- 구조: (viewer_id, target_id) 쌍 단위로 하나의 분석 저장
-- 정책: 자기 자신이 viewer인 row만 SELECT/INSERT 가능 (프라이버시)

CREATE TABLE IF NOT EXISTS public.user_match_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis jsonb NOT NULL,
  model text NOT NULL DEFAULT 'gemini-2.5-flash-lite',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (viewer_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_user_match_analyses_viewer
  ON public.user_match_analyses (viewer_id, created_at DESC);

ALTER TABLE public.user_match_analyses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.user_match_analyses'::regclass
      AND polname = 'Viewer can read own analyses'
  ) THEN
    CREATE POLICY "Viewer can read own analyses"
      ON public.user_match_analyses
      FOR SELECT
      USING (auth.uid() = viewer_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.user_match_analyses'::regclass
      AND polname = 'Viewer can insert own analyses'
  ) THEN
    CREATE POLICY "Viewer can insert own analyses"
      ON public.user_match_analyses
      FOR INSERT
      WITH CHECK (auth.uid() = viewer_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.user_match_analyses'::regclass
      AND polname = 'Viewer can update own analyses'
  ) THEN
    CREATE POLICY "Viewer can update own analyses"
      ON public.user_match_analyses
      FOR UPDATE
      USING (auth.uid() = viewer_id)
      WITH CHECK (auth.uid() = viewer_id);
  END IF;
END $$;
