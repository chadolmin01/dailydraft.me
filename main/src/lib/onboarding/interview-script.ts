import type { ProfileDraft } from './types'

export interface InterviewQuestion {
  id: string
  interactiveId: string
  getMessage: (profile: ProfileDraft, prevAnswers: Record<string, unknown>) => string
}

export const INTERVIEW_SCRIPT: InterviewQuestion[] = [
  {
    id: 'q_teamrole',
    interactiveId: 'spectrum_teamrole',
    getMessage: () => '팀에서 주로 어떤 역할을 맡는 편이에요?',
  },
  {
    id: 'q_communication',
    interactiveId: 'spectrum_communication',
    getMessage: (_p, prev) => {
      const role = prev['spectrum_teamrole'] as number | undefined
      if (role !== undefined && role >= 4) return '리더 스타일이시군요! 팀과 소통은 어떤 편이에요?'
      if (role !== undefined && role <= 2) return '맡은 걸 확실히 하는 스타일이군요! 소통은 어떤 편이에요?'
      return '팀으로 작업할 때 소통 스타일은 어떤 편이에요?'
    },
  },
  {
    id: 'q_risk',
    interactiveId: 'this_or_that_risk',
    getMessage: () => '프로젝트를 고를 때 어떤 스타일이에요?',
  },
  {
    id: 'q_hours',
    interactiveId: 'quick_number_hours',
    getMessage: () => '일주일에 프로젝트에 쓸 수 있는 시간은 어느 정도예요?',
  },
  {
    id: 'q_planning',
    interactiveId: 'this_or_that_planning',
    getMessage: () => '프로젝트 시작할 때 어떤 스타일이에요?',
  },
  {
    id: 'q_strengths',
    interactiveId: 'emoji_grid_strengths',
    getMessage: () => '마지막! 자신 있는 강점을 골라주세요 💪',
  },
]
