-- ============================================================
-- H2: accepted_connections INSERT/UPDATE 강화 (2026-04-20)
-- ============================================================
-- 감사 H2. 기존 정책은 `auth.uid() = opportunity_creator_id` 만 체크.
-- 공격: authenticated user X 가 PostgREST 로 직접 INSERT
--   opportunity_creator_id=X, opportunity_id=<타인 opportunity>, applicant_id=<arbitrary>
-- → WITH CHECK 통과 (creator 자기 자신). 하지만 실제로는 X가 opportunity 소유자 아님.
-- → 가짜 acceptance 레코드 주입. 후속 리포트/대시보드가 이 레코드를 신뢰하면 왜곡.
--
-- 수정: WITH CHECK 에 opportunity.creator_id = auth.uid() 추가 검증.
--
-- 레거시 앱 코드 영향:
-- - app/api/applications/[id]/route.ts: 이미 app 레벨에서 소유자 체크 후 INSERT → 정상 플로우 영향 없음
-- - app/api/invitations/[id]/route.ts: admin client 사용 (RLS 우회) → 영향 없음
-- ============================================================

DROP POLICY IF EXISTS "accepted_connections_insert" ON public.accepted_connections;
CREATE POLICY "accepted_connections_insert" ON public.accepted_connections
  FOR INSERT
  WITH CHECK (
    auth.uid() = opportunity_creator_id
    AND (
      -- opportunity_id NULL 허용 (SET NULL on delete 처리). 단, 있을 땐 소유자 일치해야 함.
      opportunity_id IS NULL
      OR (SELECT creator_id FROM public.opportunities WHERE id = opportunity_id) = auth.uid()
    )
  );

-- UPDATE: H1 에서 USING=WITH CHECK 미러링했으나, opportunity_id pivot 을 아직 허용.
-- creator 본인이 본인의 다른 opportunity 로 opportunity_id 를 옮기는 건 무해.
-- 하지만 타인 opportunity 로 옮기면 문제 → INSERT 와 동일한 강화 적용.
DROP POLICY IF EXISTS "accepted_connections_update" ON public.accepted_connections;
CREATE POLICY "accepted_connections_update" ON public.accepted_connections
  FOR UPDATE
  USING (auth.uid() = opportunity_creator_id)
  WITH CHECK (
    auth.uid() = opportunity_creator_id
    AND (
      opportunity_id IS NULL
      OR (SELECT creator_id FROM public.opportunities WHERE id = opportunity_id) = auth.uid()
    )
  );

-- DELETE 정책은 기존대로 유지 (USING auth.uid() = opportunity_creator_id)
-- 이유: 레코드 생성 시점에 이미 강화된 체크가 적용됐으므로 삭제는 단순 소유자 확인으로 충분.
