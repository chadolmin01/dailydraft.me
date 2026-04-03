export const POSITION_OPTIONS = [
  '프론트엔드 개발자', '백엔드 개발자', '풀스택 개발자', 'iOS 개발자', 'Android 개발자',
  'PM/PO', 'UI/UX 디자이너', '데이터 분석가', 'AI/ML 엔지니어', '마케터', '기획자',
]

export const INTEREST_OPTIONS = [
  'AI/ML', 'SaaS', '에듀테크', '핀테크', '헬스케어', '소셜', '커머스',
  '콘텐츠', '게임', '블록체인', '모빌리티', '부동산', 'HR테크', '푸드테크',
]

export const SITUATION_OPTIONS = [
  { value: 'has_project', label: '프로젝트 진행 중 — 팀원을 찾고 있어요' },
  { value: 'want_to_join', label: '팀 합류 희망 — 좋은 프로젝트에 참여하고 싶어요' },
  { value: 'solo', label: '함께 시작할 팀원 탐색 중' },
  { value: 'exploring', label: '탐색 중 — 아직 구체적인 계획은 없어요' },
]

export const AFFILIATION_OPTIONS = [
  { value: 'student', label: '대학생', orgLabel: '대학교', roleLabel: '전공', orgPlaceholder: '예: 서울대학교', rolePlaceholder: '예: 컴퓨터공학과' },
  { value: 'graduate', label: '졸업생', orgLabel: '출신 대학', roleLabel: '전공', orgPlaceholder: '예: 서울대학교', rolePlaceholder: '예: 컴퓨터공학과' },
  { value: 'professional', label: '현직자', orgLabel: '회사', roleLabel: '직무 / 부서', orgPlaceholder: '예: 네이버', rolePlaceholder: '예: 프론트엔드 개발' },
  { value: 'freelancer', label: '프리랜서', orgLabel: '소속 (선택)', roleLabel: '분야', orgPlaceholder: '예: 스튜디오명', rolePlaceholder: '예: 웹 개발' },
  { value: 'other', label: '기타', orgLabel: '소속 (선택)', roleLabel: '분야 (선택)', orgPlaceholder: '예: 소속명', rolePlaceholder: '예: 분야' },
]

export const SKILL_SUGGESTIONS = [
  'React', 'Next.js', 'TypeScript', 'Node.js', 'Python',
  'Flutter', 'Swift', 'Kotlin', 'Java', 'Go',
  'Figma', 'SQL', 'AWS', 'Docker', 'Git',
]
