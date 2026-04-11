-- 프로젝트 초대 수락 → 팀 합류가 silent fail 하던 문제의 근본 수정
--
-- 문제:
--   accepted_connections.application_id가 NOT NULL인데, 초대(invitation) 수락 경로는
--   application을 거치지 않아 INSERT가 NOT NULL violation으로 실패. 핸들러는 console.error만
--   찍고 200 OK를 반환 → 유저는 "수락 완료" 토스트만 보고 실제로는 팀에 안 들어감.
--
-- 근본 해결:
--   1) applications에 source 컬럼 추가 ('direct' = 일반 지원, 'invitation' = 초대 수락)
--      → 두 경로의 데이터가 한 테이블에 일관되게 저장되되 출처 구분 가능.
--   2) intro/why_apply를 nullable로 (invitation 경로는 본인이 직접 작성하지 않음).
--   3) accepted_connections RLS INSERT에 applicant 본인도 허용
--      → admin client 의존도를 줄이고, 본인 수락 액션이 자연스럽게 정책 통과.
--
-- 트레이드오프:
--   - intro/why_apply nullable → direct 경로의 NOT NULL 보장은 앱 레벨로 이동
--     (api/applications POST에서 검증). UI에서 이미 required라 영향 없음.
--   - source 컬럼 default='direct'라 기존 행은 자동으로 'direct' 처리됨.

-- 1) source 컬럼
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'direct'
  CHECK (source IN ('direct', 'invitation'));

-- 2) intro/why_apply nullable
ALTER TABLE public.applications ALTER COLUMN intro DROP NOT NULL;
ALTER TABLE public.applications ALTER COLUMN why_apply DROP NOT NULL;

-- 3) accepted_connections INSERT 정책 — applicant 본인도 허용
DO $$ BEGIN
  -- 기존 정책 교체
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'accepted_connections_insert' AND tablename = 'accepted_connections') THEN
    DROP POLICY "accepted_connections_insert" ON public.accepted_connections;
  END IF;
  CREATE POLICY "accepted_connections_insert" ON public.accepted_connections
    FOR INSERT WITH CHECK (
      auth.uid() = opportunity_creator_id
      OR auth.uid() = applicant_id
    );
END $$;
