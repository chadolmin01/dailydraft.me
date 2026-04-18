/**
 * Event Catalog (R3)
 *
 * 11개 표준 이벤트 × 채널 포맷 매핑 + 이벤트별 메타데이터 스키마.
 *
 * R3.1 활성 이벤트: weekly_update / recruit_open / final_showcase (3종)
 * 나머지 8종은 타입/스키마만 정의하고 channels 비워둠 → R3.2+에서 확장.
 */

import { z } from 'zod'
import type { ChannelFormat, EventType } from './types'

export interface EventConfig {
  label: string
  description: string
  /** 이 이벤트에서 생성할 채널 포맷 목록. 빈 배열이면 아직 미활성. */
  channels: ChannelFormat[]
  /** event_metadata의 Zod 스키마. bundles.ts에서 createBundle 시 검증. */
  metadata_schema: z.ZodTypeAny
  /** UI에서 "지금 이 이벤트 번들 만들기" 버튼 노출 여부. */
  manual_trigger_enabled: boolean
  /** 학기 주차 기반 자동 제안 범위 (R3.2 UI에서 활용). */
  typical_weeks?: [number, number]
}

// 공통 서브 스키마
const COHORT_META = z.object({
  cohort: z.string().min(1).describe('예: 10-1기'),
  deadline: z.string().optional(),
  apply_url: z.string().url().optional(),
})

export const EVENT_CONFIG: Record<EventType, EventConfig> = {
  recruit_teaser: {
    label: '기수 모집 예고',
    description: '정식 모집 2주 전 관심 환기용 티저',
    channels: [], // R3.2+
    metadata_schema: COHORT_META.extend({
      official_open_date: z.string(),
    }),
    manual_trigger_enabled: false,
    typical_weeks: [-2, 0],
  },

  recruit_open: {
    label: '신입 모집 시작',
    description: '지원서 링크 공개. 인스타·에타·링크드인·이메일 4채널 동시 발행',
    channels: [
      'instagram_caption',
      'everytime_post',
      'linkedin_post',
      'email_newsletter',
    ],
    metadata_schema: COHORT_META.extend({
      apply_url: z.string().url(),
      deadline: z.string(),
      target_count: z.number().optional(),
    }),
    manual_trigger_enabled: true,
    typical_weeks: [1, 3],
  },

  recruit_close: {
    label: '모집 마감 D-3 리마인드',
    description: '마감 직전 지원자 끌어올리기',
    channels: [],
    metadata_schema: COHORT_META,
    manual_trigger_enabled: false,
    typical_weeks: [2, 3],
  },

  onboarding: {
    label: '합격/OT/발대식',
    description: '합격자 공지 + 발대식 안내',
    channels: [],
    metadata_schema: COHORT_META.extend({
      ot_datetime: z.string().optional(),
      venue: z.string().optional(),
    }),
    manual_trigger_enabled: false,
    typical_weeks: [3, 4],
  },

  project_kickoff: {
    label: '팀 빌딩 공개',
    description: '팀별 아이디어·멤버 공개',
    channels: [],
    metadata_schema: z.object({
      teams: z.array(z.object({ name: z.string(), pitch: z.string().optional() })),
    }),
    manual_trigger_enabled: false,
    typical_weeks: [4, 5],
  },

  weekly_update: {
    label: '주간 업데이트',
    description: '매주 자동 생성되는 팀별 진행 상황 요약',
    channels: [
      'discord_forum_markdown',
      'instagram_caption',
      'email_newsletter',
    ],
    metadata_schema: z.object({
      week_number: z.number().int().min(1).max(24),
      cohort: z.string(),
      team_id: z.string().optional(),
      team_name: z.string().optional(),
      // 크론에서 넘겨주는 기존 초안 id. 디버깅 연결용.
      source_weekly_draft_id: z.string().uuid().optional(),
    }),
    manual_trigger_enabled: true,
    typical_weeks: [5, 13],
  },

  monthly_recap: {
    label: '월간 회고',
    description: '한 달 하이라이트 카드뉴스',
    channels: [],
    metadata_schema: z.object({ month_label: z.string() }),
    manual_trigger_enabled: false,
  },

  mid_showcase: {
    label: '중간 발표/해커톤',
    description: '현장 릴스 + 팀별 카드뉴스',
    channels: [],
    metadata_schema: z.object({
      event_name: z.string(),
      event_date: z.string(),
    }),
    manual_trigger_enabled: false,
    typical_weeks: [8, 9],
  },

  sponsor_outreach: {
    label: '스폰서 영업',
    description: '스폰서 제안서 + IR 티저',
    channels: [],
    metadata_schema: z.object({
      target_sponsor: z.string().optional(),
      pitch_deck_url: z.string().url().optional(),
    }),
    manual_trigger_enabled: false,
    typical_weeks: [10, 13],
  },

  final_showcase: {
    label: '학기말 쇼케이스',
    description: '데모데이 초대 + 팀 성과 요약. 5채널 모두 활용',
    channels: [
      'instagram_caption',
      'linkedin_post',
      'email_newsletter',
      'discord_forum_markdown',
      'everytime_post',
    ],
    metadata_schema: z.object({
      event_date: z.string(),
      venue: z.string().optional(),
      highlights: z.array(z.string()).optional(),
      cohort: z.string(),
    }),
    manual_trigger_enabled: true,
    typical_weeks: [14, 15],
  },

  semester_report: {
    label: '학기 결과 보고',
    description: '학생처·LINC 제출용 보고서 (R3.5에서 XLSX/DOCX 추가)',
    channels: [],
    metadata_schema: z.object({
      semester_ref: z.string(),
      submission_target: z.enum(['student_affairs', 'linc', 'startup_center']).optional(),
    }),
    manual_trigger_enabled: false,
    typical_weeks: [16, 16],
  },

  vacation_harvest: {
    label: '방학 수확',
    description: '지난 학기 corpus 재활용. R3.5',
    channels: [],
    metadata_schema: z.object({}),
    manual_trigger_enabled: false,
  },

  announcement: {
    label: '공지·안내',
    description:
      '범용 공지글. 모임 안내·이벤트 공지·스터디 모집·후기 등 다양한 용도. 서브카테고리를 category로 지정.',
    channels: [
      'discord_forum_markdown',
      'instagram_caption',
      'everytime_post',
      'linkedin_post',
      'email_newsletter',
    ],
    metadata_schema: z.object({
      category: z.string().min(1).describe('일반공지 / 모임안내 / 이벤트공지 / 스터디모집 / 후기 등'),
      title: z.string().min(1).max(80),
      body_hint: z.string().optional(),
      call_to_action: z.string().optional(),
      date: z.string().optional(),
      location: z.string().optional(),
      link: z.string().url().optional(),
    }),
    manual_trigger_enabled: true,
  },
}

/** 해당 이벤트가 R3.1에서 활성화됐는지 (채널이 정의돼 있는지). */
export function isEventActive(type: EventType): boolean {
  return EVENT_CONFIG[type].channels.length > 0
}

/** 이벤트의 채널 목록 가져오기. 비활성 이벤트면 빈 배열. */
export function getChannelsForEvent(type: EventType): ChannelFormat[] {
  return EVENT_CONFIG[type].channels
}
