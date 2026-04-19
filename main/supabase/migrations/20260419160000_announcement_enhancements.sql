-- 공지 기능 확장 — 예약 발송 + 읽음 확인
--
-- 1) scheduled_at: 예약 발송 (NULL이면 즉시 발행)
-- 2) published_at: 실제 발행 시각 (scheduled_at 일치 또는 즉시 발행 시 created_at 동일)
-- 3) club_announcement_reads: 멤버별 읽음 기록
--
-- 발행 상태 모델:
--   scheduled_at IS NULL OR scheduled_at <= now() → 발행됨 (published_at 세팅)
--   scheduled_at > now() → 예약 대기

ALTER TABLE public.club_announcements
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- 즉시 발행인 기존 공지는 published_at을 created_at으로 백필
UPDATE public.club_announcements
  SET published_at = created_at
  WHERE published_at IS NULL AND scheduled_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_club_announcements_scheduled_pending
  ON public.club_announcements(scheduled_at)
  WHERE scheduled_at IS NOT NULL AND published_at IS NULL;

COMMENT ON COLUMN public.club_announcements.scheduled_at IS '예약 발송 시각. NULL이면 즉시 발행. 크론이 scheduled_at <= now() AND published_at IS NULL 인 것 처리.';
COMMENT ON COLUMN public.club_announcements.published_at IS '실제 발행 시각. 즉시 발행이면 created_at과 동일, 예약이면 크론이 세팅.';

-- 읽음 기록 테이블
CREATE TABLE IF NOT EXISTS public.club_announcement_reads (
  announcement_id uuid NOT NULL REFERENCES public.club_announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement
  ON public.club_announcement_reads(announcement_id);

ALTER TABLE public.club_announcement_reads ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인 것 또는 운영진이면 해당 클럽의 모든 reads
CREATE POLICY announcement_reads_select ON public.club_announcement_reads
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.club_announcements a
      WHERE a.id = club_announcement_reads.announcement_id
        AND public.is_club_admin(a.club_id, auth.uid())
    )
  );

-- INSERT: 본인만. 클럽 멤버인지 확인.
CREATE POLICY announcement_reads_insert ON public.club_announcement_reads
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.club_announcements a
      WHERE a.id = club_announcement_reads.announcement_id
        AND public.is_club_member(a.club_id, auth.uid())
    )
  );

COMMENT ON TABLE public.club_announcement_reads IS '클럽 공지 읽음 기록. 운영진은 N/M 통계 조회, 멤버는 본인 것만.';
