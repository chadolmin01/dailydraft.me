import type { ProfileDraft } from './types'

/**
 * 인터뷰 섹션 — 7문항을 3그룹으로 묶어 "어디쯤 왔는지" 인지 부하 감소.
 * ScriptedInterviewStep 가 섹션 경계에서 짧은 전환 화면을 보여 줌.
 */
export type InterviewSection = 'team' | 'work' | 'capacity'

export interface InterviewSectionMeta {
  key: InterviewSection
  /** 섹션 제목 (전환 화면에 큰 글씨로) */
  title: string
  /** 서브 카피 — 이 섹션에서 뭘 묻는지 한 줄 요약 */
  subtitle: string
  /** 이 섹션의 이모지 — 시각적 앵커 */
  emoji: string
}

export const INTERVIEW_SECTIONS: Record<InterviewSection, InterviewSectionMeta> = {
  team: {
    key: 'team',
    title: '팀 협업',
    subtitle: '어떤 역할로 움직이시고, 소통은 어떤 편이신지 여쭙습니다.',
    emoji: '🤝',
  },
  work: {
    key: 'work',
    title: '일하는 방식',
    subtitle: '새 프로젝트 시작·계획·완성도에 대한 감각을 확인합니다.',
    emoji: '🛠️',
  },
  capacity: {
    key: 'capacity',
    title: '투자 가능',
    subtitle: '시간과 강점을 알려 주시면 적합한 팀을 매칭해 드립니다.',
    emoji: '💪',
  },
}

export interface InterviewQuestion {
  id: string
  interactiveId: string
  section: InterviewSection
  getMessage: (profile: ProfileDraft, prevAnswers: Record<string, unknown>) => string
}

export const INTERVIEW_SCRIPT: InterviewQuestion[] = [
  // ───── 섹션 1: 팀 협업 ─────
  {
    id: 'q_teamrole',
    interactiveId: 'spectrum_teamrole',
    section: 'team',
    getMessage: () => '팀에서 주로 어떤 역할을 맡는 편이신가요?',
  },
  {
    id: 'q_communication',
    interactiveId: 'spectrum_communication',
    section: 'team',
    getMessage: (_p, prev) => {
      const role = prev['spectrum_teamrole'] as number | undefined
      if (role !== undefined && role >= 4)
        return '리더 스타일이시네요. 팀과 소통은 어떤 편이신가요?'
      if (role !== undefined && role <= 2)
        return '맡은 걸 확실히 해내시는 스타일이시네요. 소통은 어떤 편이신가요?'
      return '팀으로 작업하실 때 소통 스타일은 어떤 편이신가요?'
    },
  },
  // ───── 섹션 2: 일하는 방식 ─────
  {
    id: 'q_risk',
    interactiveId: 'spectrum_risk',
    section: 'work',
    getMessage: () => '새 프로젝트를 시작하실 때 어떤 스타일이신가요?',
  },
  {
    id: 'q_planning',
    interactiveId: 'spectrum_planning',
    section: 'work',
    getMessage: () => '프로젝트 킥오프 때 보통 어떻게 시작하시나요?',
  },
  {
    id: 'q_quality',
    interactiveId: 'spectrum_quality',
    section: 'work',
    getMessage: () => '데드라인이 다가올 때 어떤 편이신가요?',
  },
  // ───── 섹션 3: 투자 가능 ─────
  {
    id: 'q_hours',
    interactiveId: 'quick_number_hours',
    section: 'capacity',
    getMessage: () => '일주일에 프로젝트에 쓸 수 있는 시간은 어느 정도이신가요?',
  },
  {
    id: 'q_strengths',
    interactiveId: 'emoji_grid_strengths',
    section: 'capacity',
    getMessage: () => '마지막입니다. 자신 있는 강점을 골라 주세요.',
  },
]

/** 현재 질문이 섹션의 첫 번째인지 판정 — 전환 화면 표시 여부 결정. */
export function isFirstInSection(idx: number): boolean {
  if (idx === 0) return true
  return INTERVIEW_SCRIPT[idx].section !== INTERVIEW_SCRIPT[idx - 1].section
}
