import type { LucideIcon } from 'lucide-react'
import { Bell, CalendarCheck, Megaphone, PartyPopper } from 'lucide-react'
import type { EventType } from '@/src/lib/personas/types'

// NewBundleShell 도메인 타입 + EVENTS + META_FIELDS.
// NewBundleShell.tsx 에서 분리. 메인 컴포넌트와 step 들이 import.

export type Step = 'pick-event' | 'fill-meta' | 'generating' | 'schedule' | 'error'

export interface EventDef {
  key: EventType
  icon: LucideIcon
  label: string
  tagline: string
  useCase: string
  example: string
  timeline: string
}

export const EVENTS: EventDef[] = [
  {
    key: 'announcement',
    icon: Bell,
    label: '공지·안내',
    tagline: '가장 많이 쓰시는 범용 글',
    useCase:
      '모임 안내·이벤트 공지·스터디 모집·후기 등 어떤 주제든. 제목과 하고 싶은 말만 적어주시면 AI가 채널별로 다듬습니다.',
    example: '"다음 주 화요일 AI 툴 워크숍 합니다" / "해커톤 1위 후기 공유" 등',
    timeline: '매주 아무 때나',
  },
  {
    key: 'weekly_update',
    icon: CalendarCheck,
    label: '주간 업데이트',
    tagline: '이번 주 팀이 뭐 했는지',
    useCase:
      'Discord 대화를 AI가 읽고 "이번 주 우리 동아리 소식"으로 재구성합니다. 인스타 스토리·이메일 뉴스레터로 한 번에.',
    example: '"이번 주 MVP 팀 3곳이 사용자 인터뷰 완료했습니다" 같은 요약',
    timeline: '매주 일요일 자동 · 수동도 가능',
  },
  {
    key: 'recruit_open',
    icon: Megaphone,
    label: '신입 모집',
    tagline: '새 기수 모집 시즌',
    useCase: '모집 공고 글을 5채널에 맞게. 지원 링크와 마감일만 알려주시면 됩니다.',
    example: '"FLIP 10-1기 모집 시작! 4/25까지 지원해 주세요"',
    timeline: '학기 시작 3~4주차 · 연 2회',
  },
  {
    key: 'final_showcase',
    icon: PartyPopper,
    label: '학기말 쇼케이스',
    tagline: '결과 발표·자랑할 시간',
    useCase:
      '기수 마무리 데모데이 홍보 + 팀별 성과 정리를 5채널에 걸쳐 한 번에 준비합니다.',
    example: '"10-1기 12개 팀의 12주 여정, 이번 주 금요일 공개합니다"',
    timeline: '학기말 14~15주차',
  },
]

export interface MetaField {
  name: string
  label: string
  type: 'text' | 'date' | 'url' | 'number' | 'textarea' | 'select'
  required: boolean
  placeholder?: string
  hint?: string
  options?: Array<{ value: string; label: string }>
}

export const META_FIELDS: Record<EventType, MetaField[]> = {
  announcement: [
    {
      name: 'category',
      label: '어떤 종류의 공지인가요?',
      type: 'select',
      required: true,
      options: [
        { value: 'general', label: '일반 공지' },
        { value: 'meeting', label: '모임 안내' },
        { value: 'event', label: '이벤트 공지' },
        { value: 'study', label: '스터디 모집' },
        { value: 'recap', label: '후기·회고' },
        { value: 'partnership', label: '제휴·스폰서 소식' },
        { value: 'recruiting_members', label: '구성원 모집 (팀원·운영진)' },
        { value: 'other', label: '기타' },
      ],
      hint: '분류에 따라 AI가 톤과 구조를 맞춥니다.',
    },
    {
      name: 'title',
      label: '공지 제목',
      type: 'text',
      required: true,
      placeholder: '예: 다음 주 화요일 AI 툴 워크숍',
      hint: '회장님이 머릿속에 떠올린 제목 그대로. AI가 이걸 기반으로 채널별로 다시 씁니다.',
    },
    {
      name: 'body_hint',
      label: '꼭 들어가야 하는 내용',
      type: 'textarea',
      required: false,
      placeholder: '예: 오후 7시 경희대 노벨정 301호. 노트북 지참. 선착순 20명.',
      hint: '선택. 빈칸이면 AI가 페르소나 기반으로 알아서 씁니다.',
    },
    {
      name: 'date',
      label: '언제 (관련 날짜)',
      type: 'text',
      required: false,
      placeholder: '예: 2026년 4월 25일 오후 7시',
      hint: '선택. 행사·모임 날짜가 있으면 적어주세요.',
    },
    {
      name: 'location',
      label: '어디서',
      type: 'text',
      required: false,
      placeholder: '예: 경희대 노벨정 301호 / Zoom 링크',
    },
    {
      name: 'call_to_action',
      label: '독자가 했으면 하는 행동',
      type: 'text',
      required: false,
      placeholder: '예: DM 주세요 / 지원 링크에서 신청 / 후기 댓글 남기기',
      hint: '선택. 있으면 AI가 글 끝에 명확한 행동 유도를 넣습니다.',
    },
    {
      name: 'link',
      label: '관련 링크',
      type: 'url',
      required: false,
      placeholder: 'https://...',
    },
  ],

  recruit_open: [
    {
      name: 'cohort',
      label: '기수',
      type: 'text',
      required: true,
      placeholder: '예: 10-1기',
      hint: '동아리에서 부르는 기수명 그대로 적어주세요. 대회 이름처럼 자유롭게.',
    },
    {
      name: 'deadline',
      label: '지원 마감일',
      type: 'date',
      required: true,
      hint: '모집 마감 날짜. "D-7" 같은 긴박감을 AI가 글에 녹입니다.',
    },
    {
      name: 'apply_url',
      label: '지원 링크',
      type: 'url',
      required: true,
      placeholder: 'https://forms.gle/...',
      hint: '구글폼·타입폼·노션 등 지원서 작성 페이지 URL.',
    },
    {
      name: 'target_count',
      label: '목표 인원',
      type: 'number',
      required: false,
      placeholder: '30',
      hint: '선택. 적으시면 "30명 선발" 같이 구체적으로 반영됩니다.',
    },
  ],
  weekly_update: [
    {
      name: 'week_number',
      label: '주차',
      type: 'number',
      required: true,
      placeholder: '5',
      hint: '이번이 몇 주차인지. 학기 전체 일정에서 지금 위치를 AI가 이해합니다.',
    },
    {
      name: 'cohort',
      label: '기수',
      type: 'text',
      required: false,
      placeholder: '예: 10-1기',
      hint: '선택. 기수 표기를 원하시면 입력.',
    },
  ],
  final_showcase: [
    {
      name: 'event_date',
      label: '쇼케이스 날짜',
      type: 'date',
      required: true,
      hint: '데모데이·발표회 당일 날짜.',
    },
    {
      name: 'venue',
      label: '장소',
      type: 'text',
      required: false,
      placeholder: '예: 경희대 크라운관 201호',
      hint: '선택. 오프라인이면 장소, 온라인이면 "Zoom" 등.',
    },
    {
      name: 'cohort',
      label: '기수',
      type: 'text',
      required: false,
      placeholder: '예: 10-1기',
    },
    {
      name: 'highlights',
      label: '주요 성과 요약',
      type: 'textarea',
      required: false,
      placeholder: '예: MVP 8개, 투자 1건, BEP 돌파 2팀',
      hint: '선택. 자랑할 거리를 적어주시면 AI가 글 전반에 녹입니다.',
    },
  ],
  // 나머지 이벤트는 현재 UI 에서 생성 불가 (R3.2+)
  recruit_teaser: [],
  recruit_close: [],
  onboarding: [],
  project_kickoff: [],
  monthly_recap: [],
  mid_showcase: [],
  sponsor_outreach: [],
  semester_report: [],
  vacation_harvest: [],
}

export function getDefaultMeta(_ev: EventType): Record<string, string> {
  return {}
}

/**
 * raw 메타 객체를 EventType 별 typed 객체로 변환.
 * - 빈 값은 제외
 * - number 타입은 Number() 로 변환
 * - 나머지는 trim 한 string
 */
export function toTypedMeta(
  ev: EventType,
  raw: Record<string, string>
): Record<string, unknown> {
  const fields = META_FIELDS[ev] ?? []
  const out: Record<string, unknown> = {}
  for (const f of fields) {
    const v = raw[f.name]
    if (!v?.trim()) continue
    if (f.type === 'number') {
      const n = Number(v)
      if (!Number.isNaN(n)) out[f.name] = n
    } else {
      out[f.name] = v.trim()
    }
  }
  return out
}
