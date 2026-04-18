/**
 * Channel Adapter 공통 타입.
 *
 * 각 채널 어댑터는 "어떤 페르소나로, 어떤 이벤트를, 어떤 메타데이터로" 받아
 * 해당 채널 포맷에 맞는 텍스트(+ 메타)를 생성한다.
 *
 * persona는 ResolvedPersona (상속 체인 해석 완료). 어댑터 내부에서 슬롯을 꺼내
 * 프롬프트에 삽입한다.
 */

import type {
  ChannelFormat,
  EventType,
  ResolvedPersona,
} from '@/src/lib/personas/types'

export interface AdapterInput {
  persona: ResolvedPersona
  orgName: string               // "FLIP 10-1기" 같은 표시명
  eventType: EventType
  eventMetadata: Record<string, unknown>
  /**
   * 선택적 corpus 힌트. weekly_update는 "이번 주 메시지 요약"을,
   * final_showcase는 "학기말 최고 성과 메시지들"을 넘길 수 있음.
   */
  corpusHint?: string
}

export interface AdapterOutput {
  channel_format: ChannelFormat
  /** 본문 (마크다운 또는 플레인 텍스트, 채널마다 다름). */
  generated_content: string
  /** 제목/주제 (이메일 subject, 에타 제목 등). 없으면 null. */
  title: string | null
  /** 채널 포맷 제약 메타. UI에서 "2200자 중 1820자 사용" 같은 표시에 사용. */
  format_constraints: {
    char_limit?: number
    char_used?: number
    hashtag_min?: number
    hashtag_max?: number
    hashtag_count?: number
    is_copy_only: boolean
    [key: string]: unknown
  }
  /**
   * 이 출력이 자동 발행 불가한지(복사 전용). 에브리타임은 항상 true,
   * R3.1 기준 인스타/링크드인도 true (OAuth 미구현).
   */
  is_copy_only: boolean
  /** 디버그/트레이싱용 — 어떤 슬롯이 프롬프트에 들어갔는지. */
  used_slots?: string[]
}

export interface ChannelAdapter {
  readonly channelFormat: ChannelFormat
  run(input: AdapterInput): Promise<AdapterOutput>
}
