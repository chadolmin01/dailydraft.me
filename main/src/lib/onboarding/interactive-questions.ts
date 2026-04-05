import type { InteractiveQuestion } from './types'

/**
 * Required interactive elements that MUST be completed before finishing deep chat.
 * If the AI didn't trigger them during conversation, they're shown at wrap-up.
 */
export const REQUIRED_INTERACTIVE_IDS: { id: string; prompt: string }[] = [
  { id: 'spectrum_communication', prompt: '소통 스타일은 어떤 편이세요?' },
  { id: 'spectrum_risk', prompt: '도전 성향은 어떤 편이세요?' },
  { id: 'quick_number_hours', prompt: '주당 얼마나 시간을 투자할 수 있으세요?' },
  { id: 'emoji_grid_strengths', prompt: '마지막으로 본인의 강점을 골라주세요!' },
]

/**
 * Predefined interactive question bank.
 * AI references these by key via [INTERACTIVE: key] tag.
 *
 * Storage strategy:
 * - Binary/ternary choices → store the chosen option ID as-is (categorical)
 * - Spectrum (5-point) → store 1-5 (actual resolution exists)
 * - Numbers → store actual number
 * - Lists → store ordered array
 * - Booleans → store true/false
 */
export const INTERACTIVE_QUESTIONS: Record<string, InteractiveQuestion> = {

  // ── Scenario Cards (SJT) → categorical values ──

  scenario_collaboration: {
    type: 'scenario-card',
    measuredFields: ['collaboration_style'],
    options: [
      {
        id: 'solo',
        icon: 'Search',
        label: '혼자 파고든다',
        description: '조용히 집중해서 원인을 찾아보고\n해결되면 팀에 공유해요',
        scores: {},
      },
      {
        id: 'share',
        icon: 'MessageCircle',
        label: '바로 팀에 공유',
        description: '상황을 바로 알리고\n같이 해결 방법을 찾아요',
        scores: {},
      },
      {
        id: 'organize',
        icon: 'ClipboardList',
        label: '정리 후 분배',
        description: '이슈를 정리하고\n누가 뭘 할지 나눠서 진행해요',
        scores: {},
      },
    ],
  },

  scenario_decision: {
    type: 'scenario-card',
    measuredFields: ['decision_style'],
    options: [
      {
        id: 'fast',
        icon: 'Zap',
        label: '빠르게 결정',
        description: '일단 시도해보고\n문제 생기면 그때 수정해요',
        scores: {},
      },
      {
        id: 'careful',
        icon: 'Shield',
        label: '충분히 검토',
        description: '장단점을 비교해보고\n확신이 들면 진행해요',
        scores: {},
      },
      {
        id: 'consult',
        icon: 'Users',
        label: '의견 모아서',
        description: '팀원들 의견을 들어보고\n합의점을 찾아서 결정해요',
        scores: {},
      },
    ],
  },

  // ── Spectrum → 1-5 personality traits ──

  spectrum_risk: {
    type: 'spectrum-pick',
    measuredFields: ['risk_style'],
    leftLabel: '검증된 방식',
    leftDescription: '확실한 아이디어로\n안정적으로 진행',
    rightLabel: '새로운 시도',
    rightDescription: '실패해도 배우는\n과감한 도전',
    points: 5,
    comments: ['검증된 길만 가요', '안정적이지만 가끔 새로운 시도도', '상황에 따라 달라요', '새로운 걸 좋아하지만 리스크 체크는 해요', '일단 해보자! 실패도 경험이에요'],
  },

  spectrum_planning: {
    type: 'spectrum-pick',
    measuredFields: ['planning_style'],
    leftLabel: '계획부터',
    leftDescription: '문서 정리하고\n계획 세운 뒤 시작',
    rightLabel: '실행부터',
    rightDescription: '일단 만들어보면서\n방향을 잡아가기',
    points: 5,
    comments: ['계획 없이는 못 움직여요', '큰 그림은 그리고 시작해요', '반반이에요', '대충 방향 잡고 바로 시작해요', '일단 만들면서 생각해요'],
  },

  spectrum_quality: {
    type: 'spectrum-pick',
    measuredFields: ['quality_style'],
    leftLabel: '완성도 우선',
    leftDescription: '시간이 걸려도\n제대로 만들기',
    rightLabel: '속도 우선',
    rightDescription: '빠르게 완성하고\n반복 개선하기',
    points: 5,
    comments: ['완벽하지 않으면 내놓기 싫어요', '퀄리티를 챙기되 기한은 지켜요', '상황에 따라 달라요', '빠르게 내고 피드백 받아요', 'MVP 먼저! 개선은 그다음이에요'],
  },

  // ── Emoji Grid → strengths ──

  emoji_grid_strengths: {
    type: 'emoji-grid',
    measuredFields: ['strengths'],
    minSelect: 1,
    maxSelect: 3,
    options: [
      { id: 'planning', emoji: '📋', label: '기획력' },
      { id: 'implementation', emoji: '⚡', label: '빠른 구현' },
      { id: 'design', emoji: '🎨', label: '디자인 감각' },
      { id: 'communication', emoji: '💬', label: '소통·조율' },
      { id: 'problem_solving', emoji: '🧩', label: '문제 해결' },
      { id: 'leadership', emoji: '🚀', label: '리더십·추진력' },
    ],
  },

  // ── Drag Rank → ordered label arrays ──

  drag_rank_goals: {
    type: 'drag-rank',
    measuredFields: ['goals'],
    items: [
      { id: 'portfolio', label: '포트폴리오', emoji: '📁' },
      { id: 'growth', label: '실력 성장', emoji: '📈' },
      { id: 'fun', label: '재미', emoji: '🎮' },
      { id: 'award', label: '수상/스펙', emoji: '🏆' },
      { id: 'startup', label: '창업 준비', emoji: '💡' },
    ],
  },

  drag_rank_wants: {
    type: 'drag-rank',
    measuredFields: ['wants_from_team'],
    items: [
      { id: 'skill', label: '높은 실력', emoji: '💪' },
      { id: 'responsible', label: '책임감', emoji: '✅' },
      { id: 'communicate', label: '원활한 소통', emoji: '💬' },
      { id: 'creative', label: '창의적 아이디어', emoji: '✨' },
      { id: 'time', label: '충분한 시간 투자', emoji: '⏰' },
    ],
  },

  // ── Emoji Grid → selected ID arrays ──

  emoji_grid_atmosphere: {
    type: 'emoji-grid',
    measuredFields: ['atmosphere'],
    minSelect: 1,
    maxSelect: 2,
    options: [
      { id: 'serious', emoji: '🔥', label: '실전 몰입형' },
      { id: 'learning', emoji: '📚', label: '학습 중심' },
      { id: 'side', emoji: '🎮', label: '함께 만들기' },
      { id: 'remote', emoji: '🏠', label: '재택/비대면' },
      { id: 'cafe', emoji: '☕', label: '카페/대면' },
      { id: 'contest', emoji: '🏆', label: '대회/공모전' },
    ],
  },

  emoji_grid_team_size: {
    type: 'emoji-grid',
    measuredFields: ['preferred_size'],
    minSelect: 1,
    maxSelect: 1,
    options: [
      { id: 'duo', emoji: '👥', label: '2명' },
      { id: 'small', emoji: '👫', label: '3-4명' },
      { id: 'medium', emoji: '👨‍👩‍👧‍👦', label: '5-6명' },
      { id: 'large', emoji: '🏢', label: '7명+' },
    ],
  },

  // ── Quick Number → actual numbers + boolean ──

  quick_number_hours: {
    type: 'quick-number',
    measuredFields: ['hours_per_week', 'semester_available'],
    presets: [
      { label: '5h', value: 5 },
      { label: '10h', value: 10 },
      { label: '15h', value: 15 },
      { label: '20h', value: 20 },
      { label: '30h+', value: 30 },
    ],
    unit: '시간/주',
    subQuestion: {
      question: '학기 중에도 가능한가요?',
      yesLabel: '가능해요',
      noLabel: '방학만',
    },
  },

  // ── Spectrum Pick → 1-5 numeric (actual resolution) ──

  spectrum_communication: {
    type: 'spectrum-pick',
    measuredFields: ['communication'],
    leftLabel: '조용히 작업',
    leftDescription: '각자 작업하고\n결과물로 합치기',
    rightLabel: '수시로 공유',
    rightDescription: '진행상황을\n계속 나누기',
    points: 5,
    comments: ['혼자 집중하는 게 최고예요', '필요할 때만 소통해요', '적당히 공유하는 편이에요', '자주 얘기하는 걸 좋아해요', '실시간 소통이 편해요'],
  },

  spectrum_teamrole: {
    type: 'spectrum-pick',
    measuredFields: ['team_role'],
    leftLabel: '팔로워',
    leftDescription: '방향이 정해지면\n맡은 걸 확실히',
    rightLabel: '리더',
    rightDescription: '직접 방향 잡고\n팀을 이끌기',
    points: 5,
    comments: ['맡은 일에 집중하는 타입이에요', '서포트하면서 의견도 내요', '상황에 따라 유연하게요', '주도하되 의견은 들어요', '직접 방향 잡고 이끌어요'],
  },
}

/** All question IDs available for the AI to use */
export const INTERACTIVE_QUESTION_IDS = Object.keys(INTERACTIVE_QUESTIONS)
