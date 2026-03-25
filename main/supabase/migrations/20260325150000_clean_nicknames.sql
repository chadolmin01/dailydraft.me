-- Clean nicknames that contain [affiliation](department) patterns
-- e.g. "이성민[학생](공과대학 사회기반시스템공학과)" → nickname: "이성민", affiliation_type: "student", university: "공과대학 사회기반시스템공학과"

-- Extract clean nickname (everything before '[')
UPDATE profiles
SET
  nickname = trim(both E'\u200D' from regexp_replace(nickname, '\[.*$', '', 'g')),
  affiliation_type = COALESCE(affiliation_type, 'student'),
  university = COALESCE(
    university,
    (regexp_match(nickname, '\((.+?)\)'))[1]
  )
WHERE nickname ~ '\[.+\]\(.+\)';
