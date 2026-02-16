/**
 * 공통 이벤트 타입 정의
 * backend/src/types/startup-events.ts 패턴 기반
 */

// 이벤트 유형 (기존 DB 스키마와 호환)
export type EventType =
  | '사업화'
  | '시설·공간'
  | '행사·네트워크'
  | '글로벌'
  | '창업교육';

// 이벤트 상태
export type EventStatus = 'active' | 'expired' | 'closed';

// 소스 타입
export type EventSource =
  | 'k-startup'  // 정부 창업지원 (backend에서 처리)
  | 'devpost';   // 온라인 해커톤

/**
 * 변환된 이벤트 (DB 삽입 전)
 */
export interface TransformedEvent {
  external_id: string;
  source: EventSource;
  title: string;
  organizer: string;
  event_type: EventType;
  description: string | null;
  start_date: string | null;       // ISO date string
  end_date: string | null;         // ISO date string
  registration_start_date: string | null;
  registration_end_date: string;   // ISO date string (required)
  registration_url: string | null;
  views_count: number;
  target_audience: string | null;
  location: string | null;         // "Online" or 지역명
  prize_amount: number | null;     // 상금 (원 단위)
  raw_data: Record<string, unknown>;
}

/**
 * AI 처리 완료된 이벤트 (DB 저장용)
 */
export interface ProcessedEvent extends TransformedEvent {
  interest_tags: string[];
  content_embedding: number[] | null;
}

/**
 * DB 저장된 이벤트
 */
export interface StartupEvent extends ProcessedEvent {
  id: string;
  status: EventStatus;
  created_at: string;
  updated_at: string;
  last_synced_at: string;
}

/**
 * Devpost 해커톤 원본 데이터
 */
export interface DevpostHackathon {
  id: string;
  title: string;
  tagline: string | null;
  url: string;
  thumbnail_url: string | null;
  submission_period_dates: string;
  time_left_to_submission: string | null;
  prize_amount: string | null;
  registrations_count: number;
  themes: string[];
  displayed_location: {
    location: string;  // "Online" or city name
  } | null;
  organization_name: string | null;
  open: boolean;
  analytics_identifier: string;
}

/**
 * Meetup 이벤트 원본 데이터
 */
export interface MeetupEvent {
  id: string;
  title: string;
  description: string | null;
  eventUrl: string;
  dateTime: string;        // ISO datetime
  endTime: string | null;  // ISO datetime
  going: number;
  venue: {
    name: string;
    city: string;
    country: string;
  } | null;
  isOnline: boolean;
  group: {
    name: string;
    urlname: string;
  };
  eventType: string;
  status: string;
}
