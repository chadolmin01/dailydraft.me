import { POSITIONS } from '@/src/constants/roles'
import { PROJECT_CATEGORIES } from '@/src/constants/categories'

// 유입 경로 — 온보딩 첫 질문. 이후 스텝이 경로별로 분기됩니다.
// 2026-04-23: 서비스 실체(클럽 운영 중심) 와 온보딩 설계(개인 매칭 중심) 의 괴리를
// 해소하기 위해 도입. 매칭 경로만 기존 6단계 유지.
export const SOURCE_OPTIONS = [
  {
    value: 'invite' as const,
    label: '동아리·클럽 초대를 받아서 왔습니다',
    desc: '초대 코드 또는 초대 링크로 가입하시는 경우',
    emoji: '🎟️',
  },
  {
    value: 'matching' as const,
    label: '팀원·프로젝트를 찾으러 왔습니다',
    desc: '매칭 정확도를 위해 몇 가지 질문을 더 드립니다',
    emoji: '🤝',
  },
  {
    value: 'operator' as const,
    label: '동아리·프로젝트를 운영하러 왔습니다',
    desc: '운영 중인 클럽을 Draft 로 옮기거나 새로 만드시는 경우',
    emoji: '🏗️',
  },
  {
    value: 'exploring' as const,
    label: '일단 둘러보러 왔습니다',
    desc: '기본 정보만 받고 바로 시작합니다',
    emoji: '👀',
  },
] as const

export const SITUATION_OPTIONS = [
  { value: 'has_project', label: '팀원을 찾고 있습니다', desc: '프로젝트 진행 중' },
  { value: 'want_to_join', label: '프로젝트에 참여하고 싶습니다', desc: '합류 희망' },
  { value: 'solo', label: '같이 시작할 사람을 찾습니다', desc: '함께 시작' },
  { value: 'exploring', label: '아직 둘러보는 중입니다', desc: '탐색 중' },
] as const

export const AFFILIATION_OPTIONS = [
  { value: 'student', label: '대학생', orgPlaceholder: '대학교', rolePlaceholder: '전공' },
  { value: 'graduate', label: '졸업생', orgPlaceholder: '출신 대학', rolePlaceholder: '전공' },
  { value: 'professional', label: '현직자', orgPlaceholder: '회사', rolePlaceholder: '직무' },
  { value: 'freelancer', label: '프리랜서', orgPlaceholder: '소속 (선택)', rolePlaceholder: '분야' },
  { value: 'other', label: '기타', orgPlaceholder: '소속 (선택)', rolePlaceholder: '분야 (선택)' },
] as const

export const POPULAR_SKILLS: Record<string, string[]> = {
  frontend:  ['React', 'Next.js', 'TypeScript', 'Vue', 'Tailwind CSS', 'JavaScript', 'HTML/CSS', 'Svelte'],
  backend:   ['Node.js', 'Python', 'Java', 'Spring', 'Django', 'Express', 'Go', 'SQL'],
  fullstack: ['React', 'Next.js', 'Node.js', 'TypeScript', 'Python', 'SQL', 'Docker', 'AWS'],
  design:    ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Sketch', 'Prototyping', 'Design System', 'Framer'],
  pm:        ['Notion', 'Jira', 'Figma', 'Slack', 'Google Analytics', 'SQL', '사용자 리서치', '와이어프레임'],
  marketing: ['Google Ads', 'Meta Ads', 'Google Analytics', 'SEO', '콘텐츠 마케팅', 'Canva', 'Notion', '브랜딩'],
  data:      ['Python', 'SQL', 'Pandas', 'Tableau', 'R', 'Excel', 'Power BI', 'TensorFlow'],
  other:     ['Python', 'Figma', 'Notion', 'Excel', 'SQL', 'Canva', 'JavaScript', 'React'],
}

/** 포지션 무관 전체 스킬 (flat & 중복 제거) */
export const ALL_SKILLS = [...new Set(Object.values(POPULAR_SKILLS).flat())]

// ─── Categorical ↔ Score mappings ────────────────────────────

/** categorical ID → 1-5 숫자 변환 (DB 저장용) */
export const CATEGORICAL_TO_SCORE: Record<string, Record<string, number>> = {
  collaboration_style: { solo: 1, organize: 3, share: 5 },
  decision_style: { careful: 2, consult: 3, fast: 4 },
  planning_style: { build_first: 2, plan_first: 4 },
  quality_style: { speed: 2, quality: 4 },
}

/** 1-5 숫자 → categorical ID 역변환 */
export const SCORE_TO_CATEGORICAL: Record<string, (v: number) => string> = {
  collaboration_style: (v) => v <= 2 ? 'solo' : v <= 4 ? 'organize' : 'share',
  decision_style: (v) => v <= 2 ? 'careful' : v <= 3 ? 'consult' : 'fast',
  planning_style: (v) => v <= 3 ? 'build_first' : 'plan_first',
  quality_style: (v) => v <= 3 ? 'speed' : 'quality',
}

/** categorical ID → 한글 라벨 (UI 표시용) */
export const CATEGORICAL_LABELS: Record<string, Record<string, string>> = {
  collaboration_style: { solo: '혼자 파고든다', share: '바로 팀에 공유', organize: '정리 후 분배' },
  decision_style: { fast: '빠르게 결정', careful: '충분히 검토', consult: '의견 모아서' },
  planning_style: { plan_first: '기획형', build_first: '실행형' },
  quality_style: { quality: '완성도', speed: '속도' },
}
