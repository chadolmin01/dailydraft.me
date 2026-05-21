export interface MatchData {
  match_score: number
  match_reason: string
  match_details: {
    skill: number
    interest: number
    situation: number
    teamfit: number
  }
}

export interface ProfileDetailModalProps {
  profileId: string | null
  byUserId?: boolean
  matchData?: MatchData | null
  onClose: () => void
  onSelectProject?: (projectId: string) => void
  initialCoffeeChatOpen?: boolean
  initialCoffeeChatMessage?: string
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

export const TRAIT_COLORS: Record<string, { bar: string; barBg: string; dot: string; text: string; accent: string }> = {
  communication: { bar: 'bg-blue-500',    barBg: 'bg-blue-100',    dot: 'bg-blue-500',    text: 'text-blue-600',    accent: 'blue' },
  teamRole:      { bar: 'bg-violet-500',  barBg: 'bg-violet-100',  dot: 'bg-violet-500',  text: 'text-violet-600',  accent: 'violet' },
  risk:          { bar: 'bg-amber-500',   barBg: 'bg-amber-100',   dot: 'bg-amber-500',   text: 'text-amber-600',   accent: 'amber' },
  planning:      { bar: 'bg-indigo-500',  barBg: 'bg-indigo-100',  dot: 'bg-indigo-500',  text: 'text-indigo-600',  accent: 'indigo' },
  quality:       { bar: 'bg-rose-500',    barBg: 'bg-rose-100',    dot: 'bg-rose-500',    text: 'text-rose-600',    accent: 'rose' },
  time:          { bar: 'bg-emerald-500', barBg: 'bg-emerald-100', dot: 'bg-emerald-500', text: 'text-emerald-600', accent: 'emerald' },
}

export const traitLabels = [
  { key: 'communication', label: '소통 스타일', low: '조용히 작업', high: '수시 공유' },
  { key: 'risk', label: '도전 성향', low: '안정', high: '도전' },
  { key: 'planning', label: '작업 방식', low: '계획부터', high: '실행부터' },
  { key: 'quality', label: '완성도 vs 속도', low: '완성도', high: '속도' },
]
