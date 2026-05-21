-- club_events — 클럽 운영진이 공유하는 일정 (회의·발표회·모집 마감 등)
--
-- 포지셔닝:
--   startup_events = 외부 공모/이벤트 스크레이핑
--   club_events    = 클럽 내부 일정
--   둘은 다른 범주라 테이블 분리

CREATE TABLE IF NOT EXISTS public.club_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_type text NOT NULL DEFAULT 'meeting' CHECK (event_type IN (
    'meeting',       -- 정기·임시 회의
    'presentation',  -- 발표회·데모데이
    'recruit',       -- 기수 모집 마감
    'workshop',      -- 워크샵·세미나
    'social',        -- 친목·OT·뒷풀이
    'deadline',      -- 과제·제출 마감
    'other'
  )),
  location text,              -- 장소 텍스트 (오프라인: 강의실, 온라인: Discord 채널/URL)
  start_at timestamptz NOT NULL,
  end_at timestamptz,          -- 종일 이벤트면 NULL 가능
  all_day boolean NOT NULL DEFAULT false,
  cohort text,                 -- 특정 기수 한정 일정
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_club_events_club_start
  ON public.club_events(club_id, start_at);
CREATE INDEX IF NOT EXISTS idx_club_events_start
  ON public.club_events(start_at)
  WHERE start_at >= '2026-01-01'::timestamptz;

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.set_club_events_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_club_events_updated_at ON public.club_events;
CREATE TRIGGER trg_club_events_updated_at
  BEFORE UPDATE ON public.club_events
  FOR EACH ROW EXECUTE FUNCTION public.set_club_events_updated_at();

-- RLS
ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;

-- SELECT: 클럽 멤버 이상 볼 수 있음
CREATE POLICY club_events_select_member ON public.club_events
  FOR SELECT
  USING (public.is_club_member(club_id, auth.uid()));

-- INSERT: admin/owner 만
CREATE POLICY club_events_insert_admin ON public.club_events
  FOR INSERT
  WITH CHECK (public.is_club_admin(club_id, auth.uid()));

-- UPDATE: admin/owner 만 (WITH CHECK 미러링)
CREATE POLICY club_events_update_admin ON public.club_events
  FOR UPDATE
  USING (public.is_club_admin(club_id, auth.uid()))
  WITH CHECK (public.is_club_admin(club_id, auth.uid()));

-- DELETE: admin/owner 만
CREATE POLICY club_events_delete_admin ON public.club_events
  FOR DELETE
  USING (public.is_club_admin(club_id, auth.uid()));

COMMENT ON TABLE public.club_events IS '클럽 운영진이 공유하는 일정. startup_events(외부 이벤트)와 구분.';
COMMENT ON COLUMN public.club_events.event_type IS 'meeting|presentation|recruit|workshop|social|deadline|other';
COMMENT ON COLUMN public.club_events.cohort IS '특정 기수 한정 일정. NULL이면 전체 기수 대상.';
