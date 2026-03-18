-- End-to-End 워크플로우를 위한 스키마 확장
-- validated_ideas <-> business_plans 연결

BEGIN;

-- 1. validated_ideas 테이블 확장
ALTER TABLE public.validated_ideas
ADD COLUMN IF NOT EXISTS score INTEGER CHECK (score >= 0 AND score <= 100),
ADD COLUMN IF NOT EXISTS persona_scores JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS action_plan JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS validation_level TEXT DEFAULT 'SKETCH'
  CHECK (validation_level IN ('SKETCH', 'MVP', 'DEFENSE'));

-- 기존 데이터의 validation_level NULL 처리 (안전장치)
UPDATE public.validated_ideas
SET validation_level = 'SKETCH'
WHERE validation_level IS NULL;

-- 2. business_plans 테이블에 FK 추가
ALTER TABLE public.business_plans
ADD COLUMN IF NOT EXISTS validated_idea_id UUID
  REFERENCES public.validated_ideas(id) ON DELETE SET NULL;

-- 3. 인덱스 추가
-- FK 인덱스 (JOIN 성능)
CREATE INDEX IF NOT EXISTS idx_business_plans_validated_idea
ON public.business_plans(validated_idea_id);

-- 점수 정렬용 단독 인덱스
CREATE INDEX IF NOT EXISTS idx_validated_ideas_score
ON public.validated_ideas(score DESC NULLS LAST);

-- 검증 레벨 필터링용
CREATE INDEX IF NOT EXISTS idx_validated_ideas_level
ON public.validated_ideas(validation_level);

-- 사용자별 점수 정렬용 복합 인덱스 (주요 쿼리 패턴 대응)
CREATE INDEX IF NOT EXISTS idx_validated_ideas_user_score
ON public.validated_ideas(user_id, score DESC NULLS LAST);

-- 4. 코멘트 추가
COMMENT ON COLUMN public.validated_ideas.score IS '검증 종합 점수 (0-100, CHECK 제약조건 적용됨)';
COMMENT ON COLUMN public.validated_ideas.persona_scores IS '페르소나별 점수 JSON {developer?: number, designer?: number, vc?: number}';
COMMENT ON COLUMN public.validated_ideas.action_plan IS '실행 계획 JSON {developer?: string[], designer?: string[], vc?: string[]}';
COMMENT ON COLUMN public.validated_ideas.validation_level IS '검증 난이도 (SKETCH/MVP/DEFENSE), 기본값: SKETCH';
COMMENT ON COLUMN public.business_plans.validated_idea_id IS '연결된 아이디어 검증 결과 (FK, 삭제 시 NULL)';

COMMIT;
