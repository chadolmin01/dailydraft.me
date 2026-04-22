/**
 * Ambient MicroPrompt 용 질문 풀.
 *
 * 인터뷰 풀(INTERACTIVE_QUESTIONS) 에서 1탭으로 답할 수 있는 라이트한 질문만 선별.
 * scenario-card (3선택지), emoji-grid 는 Ambient 에는 무겁다 → 제외.
 * spectrum (1~5) 과 emoji-grid (small) 만 사용.
 *
 * 각 엔트리는 short prompt + interactiveId + slot 힌트.
 */

export interface MicroPromptEntry {
  /** 상위 `INTERACTIVE_QUESTIONS` 의 키 */
  interactiveId: string
  /** 사용자에게 보여 줄 짧은 질문 */
  prompt: string
  /** 이 질문에 잘 어울리는 슬롯 (sidebar / popup / inline 등) */
  slots?: Array<'sidebar' | 'popup' | 'inline'>
  /** 상위 context — 이 질문이 뭘 수집하는지 한 줄 (details 접는 설명용) */
  why: string
}

export const MICRO_PROMPT_POOL: MicroPromptEntry[] = [
  {
    interactiveId: 'spectrum_teamrole',
    prompt: '팀에서 주로 맡는 역할은 어떤 편이신가요?',
    slots: ['sidebar', 'popup', 'inline'],
    why: '리더 성향의 멤버를 우선 추천해 드리기 위해 사용합니다.',
  },
  {
    interactiveId: 'spectrum_communication',
    prompt: '팀과 소통은 어떤 편이신가요?',
    slots: ['sidebar', 'popup', 'inline'],
    why: '소통 빈도가 비슷한 팀원을 추천할 때 활용됩니다.',
  },
  {
    interactiveId: 'spectrum_risk',
    prompt: '새 프로젝트를 시작하실 때 어떤 스타일이신가요?',
    slots: ['sidebar', 'popup', 'inline'],
    why: '검증된 방식 vs 새로운 시도 — 비슷한 성향끼리 매칭합니다.',
  },
  {
    interactiveId: 'spectrum_planning',
    prompt: '프로젝트 킥오프 때 보통 어떻게 시작하시나요?',
    slots: ['sidebar', 'popup'],
    why: '계획·실행 성향을 팀 추천에 반영합니다.',
  },
  {
    interactiveId: 'spectrum_quality',
    prompt: '데드라인이 다가올 때 어떤 편이신가요?',
    slots: ['sidebar', 'popup'],
    why: '완성도 vs 속도 — 팀 내 기대치 충돌을 줄이기 위해 쓰입니다.',
  },
  // emoji-grid 는 slot 크기 커서 popup/inline 한정
  {
    interactiveId: 'emoji_grid_strengths',
    prompt: '자신 있는 강점을 최대 3가지 골라 주세요',
    slots: ['popup', 'inline'],
    why: '이 강점을 필요로 하는 프로젝트를 우선 보여 드립니다.',
  },
]

/** 유저가 답하지 않은 것 중 슬롯에 맞는 첫 번째 질문 반환. 없으면 null. */
export function pickPromptForSlot(
  slot: 'sidebar' | 'popup' | 'inline',
  answered: Set<string>,
): MicroPromptEntry | null {
  return (
    MICRO_PROMPT_POOL.find(
      p => (p.slots ?? ['sidebar', 'popup', 'inline']).includes(slot) && !answered.has(p.interactiveId),
    ) ?? null
  )
}
