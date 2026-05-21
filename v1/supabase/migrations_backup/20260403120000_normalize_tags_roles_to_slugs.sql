-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--  한글 태그/역할 → 영문 slug 정규화 마이그레이션
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--
--  배경:
--    기존에 interest_tags, needed_roles, desired_position 등에
--    한글 문자열이 그대로 저장되었음 (예: '에듀테크', '개발자', '프론트엔드 개발').
--    이를 영문 slug로 통일하여 라벨 변경 시 DB 무관하게 만듦.
--
--  매핑 (categories.ts, roles.ts와 동일해야 함):
--    interest_tags:    'AI/ML'→'ai-ml', '웹/앱 개발'→'web-app' ...
--    needed_roles:     '개발자'→'developer', '디자이너'→'designer' ...
--    desired_position: '프론트엔드 개발'→'frontend', 'UI/UX 디자인'→'design' ...
--    location_type:    'offline'→'onsite'
--
--  롤백: 각 섹션의 역방향 array_replace를 실행하면 됨.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ─── 1. interest_tags (profiles + opportunities) ───────────────

-- profiles.interest_tags
DO $$
DECLARE
  pairs text[][] := ARRAY[
    ['AI/ML',         'ai-ml'],
    ['웹/앱 개발',     'web-app'],
    ['소셜/커뮤니티',   'social'],
    ['교육/에듀테크',   'edu'],
    ['에듀테크',       'edu'],
    ['커머스/F&B',     'commerce'],
    ['커머스',         'commerce'],
    ['콘텐츠/미디어',   'content'],
    ['핀테크',         'fintech'],
    ['헬스케어',       'health'],
    ['게임/엔터',      'game'],
    ['게임',          'game'],
    ['환경/ESG',      'esg'],
    ['데이터분석',     'data'],
    ['디자인/UX',     'design-ux'],
    ['하드웨어/IoT',   'hardware'],
    ['공모전/해커톤',   'contest'],
    ['포트폴리오',     'portfolio']
  ];
  p text[];
BEGIN
  FOREACH p SLICE 1 IN ARRAY pairs LOOP
    UPDATE profiles
    SET interest_tags = array_replace(interest_tags, p[1], p[2])
    WHERE p[1] = ANY(interest_tags);
  END LOOP;
END $$;

-- opportunities.interest_tags (동일 매핑)
DO $$
DECLARE
  pairs text[][] := ARRAY[
    ['AI/ML',         'ai-ml'],
    ['웹/앱 개발',     'web-app'],
    ['소셜/커뮤니티',   'social'],
    ['교육/에듀테크',   'edu'],
    ['에듀테크',       'edu'],
    ['커머스/F&B',     'commerce'],
    ['커머스',         'commerce'],
    ['콘텐츠/미디어',   'content'],
    ['핀테크',         'fintech'],
    ['헬스케어',       'health'],
    ['게임/엔터',      'game'],
    ['게임',          'game'],
    ['환경/ESG',      'esg'],
    ['데이터분석',     'data'],
    ['디자인/UX',     'design-ux'],
    ['하드웨어/IoT',   'hardware'],
    ['공모전/해커톤',   'contest'],
    ['포트폴리오',     'portfolio']
  ];
  p text[];
BEGIN
  FOREACH p SLICE 1 IN ARRAY pairs LOOP
    UPDATE opportunities
    SET interest_tags = array_replace(interest_tags, p[1], p[2])
    WHERE p[1] = ANY(interest_tags);
  END LOOP;
END $$;

-- ─── 2. needed_roles (opportunities) ──────────────────────────

DO $$
DECLARE
  pairs text[][] := ARRAY[
    ['개발자',    'developer'],
    ['디자이너',  'designer'],
    ['기획자',    'pm'],
    ['마케터',    'marketer'],
    ['PM',       'pm'],
    ['데이터분석', 'data']
  ];
  p text[];
BEGIN
  FOREACH p SLICE 1 IN ARRAY pairs LOOP
    UPDATE opportunities
    SET needed_roles = array_replace(needed_roles, p[1], p[2])
    WHERE p[1] = ANY(needed_roles);
  END LOOP;
END $$;

-- ─── 3. desired_position (profiles) ───────────────────────────

DO $$
DECLARE
  pairs text[][] := ARRAY[
    ['프론트엔드 개발', 'frontend'],
    ['백엔드 개발',    'backend'],
    ['풀스택 개발',    'fullstack'],
    ['UI/UX 디자인',  'design'],
    ['PM / 기획',     'pm'],
    ['마케팅',         'marketing'],
    ['데이터분석',     'data'],
    ['기타',          'other']
  ];
  p text[];
BEGIN
  FOREACH p SLICE 1 IN ARRAY pairs LOOP
    UPDATE profiles
    SET desired_position = p[2]
    WHERE desired_position = p[1];
  END LOOP;
END $$;

-- ─── 4. location_type 통일 ('offline' → 'onsite') ─────────────

UPDATE opportunities
SET location_type = 'onsite'
WHERE location_type = 'offline';

-- ─── 5. filled_roles (opportunities) ──────────────────────────
-- filled_roles도 한글로 저장되었을 수 있음

DO $$
DECLARE
  pairs text[][] := ARRAY[
    ['개발자',    'developer'],
    ['디자이너',  'designer'],
    ['기획자',    'pm'],
    ['마케터',    'marketer'],
    ['PM',       'pm'],
    ['데이터분석', 'data']
  ];
  p text[];
BEGIN
  FOREACH p SLICE 1 IN ARRAY pairs LOOP
    UPDATE opportunities
    SET filled_roles = array_replace(filled_roles, p[1], p[2])
    WHERE filled_roles IS NOT NULL AND p[1] = ANY(filled_roles);
  END LOOP;
END $$;
