/**
 * 페르소나 슬롯 카탈로그.
 *
 * 각 슬롯의 UI 라벨, 기본 merge 전략, 기본 잠금 정책을 정의.
 * 상속 관계에서 "어떤 슬롯은 부모에서만 나와야 한다"의 디폴트.
 *
 * club 페르소나가 새로 만들어질 때, club 쪽 필드의 기본 merge_strategy/locked는
 * `defaultForClub`을 따른다. project 페르소나가 부모(club)를 상속할 때는
 * 부모 쪽 merge_strategy/locked를 우선 적용하고, project 자체는 `defaultForProject`를
 * 자신의 필드 생성 시 기본값으로 쓴다.
 *
 * 사용자 확정: "경희대 FLIP 10-1기 소속"까지만 상속 → identity는 부모에서 잠김.
 */

import type { FieldKey, MergeStrategy } from './types'

interface FieldSpec {
  key: FieldKey
  label: string
  description: string
  /** 동아리 페르소나가 이 필드를 만들 때의 기본값. */
  defaultForClub: {
    merge_strategy: MergeStrategy
    /** 자식(프로젝트)에게 이 필드 편집을 잠글지. */
    locked: boolean
  }
  /** 프로젝트 페르소나가 이 필드를 자체적으로 오버라이드할 때의 기본값. */
  defaultForProject: {
    merge_strategy: MergeStrategy
    locked: boolean
  }
}

export const FIELD_CATALOG: Record<FieldKey, FieldSpec> = {
  identity: {
    key: 'identity',
    label: '정체성',
    description: '이 사람/조직은 누구이며 어디 소속인지',
    // "FLIP 10-1기 소속 {프로젝트명}"까지 상속 → 부모에서 고정.
    defaultForClub: { merge_strategy: 'full_inherit', locked: true },
    defaultForProject: { merge_strategy: 'override', locked: false },
  },
  content_patterns: {
    key: 'content_patterns',
    label: '인기 콘텐츠 패턴',
    description: '어떤 포맷/주제가 반응이 좋았는지',
    defaultForClub: { merge_strategy: 'override', locked: false },
    defaultForProject: { merge_strategy: 'override', locked: false },
  },
  audience: {
    key: 'audience',
    label: '독자',
    description: '콘텐츠를 소비하는 사람',
    defaultForClub: { merge_strategy: 'extend', locked: false },
    defaultForProject: { merge_strategy: 'override', locked: false },
  },
  sentence_style: {
    key: 'sentence_style',
    label: '문장 스타일',
    description: '평균 문장 길이, 단락 구성, 줄바꿈 패턴',
    defaultForClub: { merge_strategy: 'override', locked: false },
    defaultForProject: { merge_strategy: 'override', locked: false },
  },
  ending_signature: {
    key: 'ending_signature',
    label: '어미 시그니처',
    description: '어미 Top 5, 문어체/구어체 비율',
    defaultForClub: { merge_strategy: 'override', locked: false },
    defaultForProject: { merge_strategy: 'override', locked: false },
  },
  thought_development: {
    key: 'thought_development',
    label: '논리 전개',
    description: '논리 구조, 결론 패턴',
    defaultForClub: { merge_strategy: 'override', locked: false },
    defaultForProject: { merge_strategy: 'override', locked: false },
  },
  hooking_style: {
    key: 'hooking_style',
    label: '후킹 스타일',
    description: '첫 1~2문장의 시선 끌기 패턴',
    defaultForClub: { merge_strategy: 'override', locked: false },
    defaultForProject: { merge_strategy: 'override', locked: false },
  },
  emotional_distance: {
    key: 'emotional_distance',
    label: '감정 거리감',
    description: '독자와의 관계, 자신감 수준, 자기 노출도',
    defaultForClub: { merge_strategy: 'override', locked: false },
    defaultForProject: { merge_strategy: 'override', locked: false },
  },
  humor: {
    key: 'humor',
    label: '유머',
    description: '유머 기제와 빈도',
    defaultForClub: { merge_strategy: 'override', locked: false },
    defaultForProject: { merge_strategy: 'override', locked: false },
  },
  vocabulary: {
    key: 'vocabulary',
    label: '어휘 특성',
    description: '전문 용어, 반복 표현, 비유/직유',
    defaultForClub: { merge_strategy: 'override', locked: false },
    defaultForProject: { merge_strategy: 'override', locked: false },
  },
  rhythm: {
    key: 'rhythm',
    label: '리듬/음악성',
    description: '문장 길이 변주, 반복 구조, 대구법',
    defaultForClub: { merge_strategy: 'override', locked: false },
    defaultForProject: { merge_strategy: 'override', locked: false },
  },
  taboos: {
    key: 'taboos',
    label: '절대 금기',
    description: 'Absolute Taboos - 하지 말아야 할 것',
    // 상위 금기는 하위에도 누적 적용 (자식이 부모 taboos를 없앨 수 없음).
    defaultForClub: { merge_strategy: 'extend', locked: false },
    defaultForProject: { merge_strategy: 'extend', locked: false },
  },
  reproduction_checklist: {
    key: 'reproduction_checklist',
    label: '재현 체크리스트',
    description: '톤 재현을 위한 자가 점검 항목',
    defaultForClub: { merge_strategy: 'extend', locked: false },
    defaultForProject: { merge_strategy: 'extend', locked: false },
  },
}

export const FIELD_KEYS_ORDERED: FieldKey[] = [
  'identity',
  'audience',
  'content_patterns',
  'hooking_style',
  'sentence_style',
  'ending_signature',
  'thought_development',
  'vocabulary',
  'rhythm',
  'humor',
  'emotional_distance',
  'taboos',
  'reproduction_checklist',
]
