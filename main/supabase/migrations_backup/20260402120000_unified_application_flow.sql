-- 1. applications status에 'interviewing', 'rejected' 추가
--    기존: CHECK (status IN ('pending','accepted','declined','withdrawn'))
--    API가 'rejected'를 쓰는데 DB는 'declined'만 허용 → 버그 수정 포함
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_status_check
  CHECK (status IN ('pending', 'interviewing', 'accepted', 'rejected', 'declined', 'withdrawn'));

-- 2. coffee_chats에 application_id FK 추가
ALTER TABLE public.coffee_chats
  ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_coffee_chats_application ON public.coffee_chats(application_id);
