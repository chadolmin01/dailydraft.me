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

export const TRAIT_COLORS: Record<string, { bar: string; dot: string; text: string }> = {
  risk:          { bar: 'bg-neutral-800', dot: 'bg-neutral-600', text: 'text-txt-primary' },
  time:          { bar: 'bg-neutral-700', dot: 'bg-neutral-500', text: 'text-txt-primary' },
  communication: { bar: 'bg-neutral-600', dot: 'bg-neutral-400', text: 'text-txt-primary' },
  decision:      { bar: 'bg-neutral-800', dot: 'bg-neutral-600', text: 'text-txt-primary' },
  collaboration: { bar: 'bg-neutral-700', dot: 'bg-neutral-500', text: 'text-txt-primary' },
  planning:      { bar: 'bg-neutral-600', dot: 'bg-neutral-400', text: 'text-txt-primary' },
  perfectionism: { bar: 'bg-neutral-700', dot: 'bg-neutral-500', text: 'text-txt-primary' },
}

export const traitLabels = [
  { key: 'risk', label: '도전 성향', low: '안정', high: '도전' },
  { key: 'time', label: '시간 투자', low: '여유 없음', high: '풀타임' },
  { key: 'communication', label: '소통 선호', low: '혼자 집중', high: '수시 소통' },
]
