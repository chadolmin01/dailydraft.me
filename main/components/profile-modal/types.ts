export interface MatchData {
  match_score: number
  match_reason: string
  match_details: {
    vision: number
    skill: number
    founder: number
    interest: number
    situation: number
  }
}

export interface ProfileDetailModalProps {
  profileId: string | null
  byUserId?: boolean
  matchData?: MatchData | null
  onClose: () => void
  onSelectProject?: (projectId: string) => void
}

export const SITUATION_LABELS: Record<string, string> = {
  has_project: '프로젝트 진행 중',
  want_to_join: '팀 합류 희망',
  solo: '함께 시작할 팀원 탐색 중',
  exploring: '탐색 중',
}

export const AFFILIATION_LABELS: Record<string, string> = {
  student: '대학생',
  graduate: '졸업생',
  professional: '현직자',
  freelancer: '프리랜서',
  other: '기타',
}

export const TRAIT_COLORS: Record<string, { bar: string; dot: string; text: string }> = {
  risk:          { bar: 'bg-rose-500',    dot: 'bg-rose-400',    text: 'text-rose-600' },
  time:          { bar: 'bg-amber-500',   dot: 'bg-amber-400',   text: 'text-amber-600' },
  communication: { bar: 'bg-sky-500',     dot: 'bg-sky-400',     text: 'text-sky-600' },
  decision:      { bar: 'bg-emerald-500', dot: 'bg-emerald-400', text: 'text-emerald-600' },
  collaboration: { bar: 'bg-violet-500',  dot: 'bg-violet-400',  text: 'text-violet-600' },
  planning:      { bar: 'bg-teal-500',    dot: 'bg-teal-400',    text: 'text-teal-600' },
  perfectionism: { bar: 'bg-orange-500',  dot: 'bg-orange-400',  text: 'text-orange-600' },
}

export const traitLabels = [
  { key: 'risk', label: '도전 성향', low: '안정', high: '도전' },
  { key: 'time', label: '시간 투자', low: '여유 없음', high: '풀타임' },
  { key: 'communication', label: '소통 선호', low: '혼자 집중', high: '수시 소통' },
  { key: 'decision', label: '실행 속도', low: '신중한 계획', high: '빠른 실행' },
]

export const workStyleLabels = [
  { key: 'collaboration', label: '협업 스타일', low: '독립형', high: '팀 소통형' },
  { key: 'planning', label: '작업 방식', low: '바로 실행', high: '기획 우선' },
  { key: 'perfectionism', label: '품질 기준', low: '속도 우선', high: '완벽주의' },
]
