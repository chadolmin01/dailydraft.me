/**
 * Event Application Tracking Types
 *
 * 외부 행사(스타트업 이벤트)에 대한 사용자 지원 추적 시스템
 */

export type EventApplicationStatus =
  | 'interested'  // 관심 등록
  | 'preparing'   // 준비 중
  | 'applied'     // 지원 완료
  | 'accepted'    // 합격
  | 'rejected'    // 불합격
  | 'pending';    // 결과 대기

export const EVENT_APPLICATION_STATUS_LABELS: Record<EventApplicationStatus, string> = {
  interested: '관심 등록',
  preparing: '준비 중',
  applied: '지원 완료',
  accepted: '합격',
  rejected: '불합격',
  pending: '결과 대기',
};

export const EVENT_APPLICATION_STATUS_COLORS: Record<EventApplicationStatus, string> = {
  interested: 'bg-surface-sunken text-txt-secondary',
  preparing: 'bg-status-info-bg text-status-info-text',
  applied: 'bg-brand-bg text-brand',
  accepted: 'bg-status-success-bg text-status-success-text',
  rejected: 'bg-status-danger-bg text-status-danger-text',
  pending: 'bg-status-warning-bg text-status-warning-text',
};

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
}

export interface EventApplication {
  id: string;
  user_id: string;
  event_id: string;

  // Status tracking
  status: EventApplicationStatus;
  status_updated_at: string;

  // Application details
  applied_at: string | null;
  applied_url: string | null;
  result_notes: string | null;
  personal_notes: string | null;

  // Preparation checklist
  preparation_checklist: ChecklistItem[];

  // Reminder
  reminder_date: string | null;
  reminder_sent: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Joined data (optional)
  event?: {
    id: string;
    title: string;
    organizer: string;
    event_type: string;
    registration_end_date: string;
    registration_url: string | null;
    interest_tags: string[];
  };
}

export interface EventApplicationHistory {
  id: string;
  application_id: string;
  from_status: EventApplicationStatus | null;
  to_status: EventApplicationStatus;
  changed_at: string;
  notes: string | null;
}

export interface CreateEventApplicationRequest {
  event_id: string;
  status?: EventApplicationStatus;
  personal_notes?: string;
  reminder_date?: string;
}

export interface UpdateEventApplicationRequest {
  status?: EventApplicationStatus;
  applied_at?: string;
  applied_url?: string;
  result_notes?: string;
  personal_notes?: string;
  preparation_checklist?: ChecklistItem[];
  reminder_date?: string | null;
}

export interface EventApplicationStats {
  total: number;
  by_status: Record<EventApplicationStatus, number>;
  acceptance_rate: number; // 합격률 (accepted / (accepted + rejected))
  recent_applications: number; // 최근 30일 지원 수
}

export interface EventApplicationFilters {
  status?: EventApplicationStatus | EventApplicationStatus[];
  event_type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Status flow validation
export const VALID_STATUS_TRANSITIONS: Record<EventApplicationStatus, EventApplicationStatus[]> = {
  interested: ['preparing', 'applied'],
  preparing: ['applied', 'interested'],
  applied: ['pending', 'accepted', 'rejected'],
  pending: ['accepted', 'rejected'],
  accepted: [],
  rejected: [],
};

export function canTransitionTo(
  currentStatus: EventApplicationStatus,
  newStatus: EventApplicationStatus
): boolean {
  // Same status is always valid (no-op)
  if (currentStatus === newStatus) return true;

  // Check valid transitions
  return VALID_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
}

export function getNextStatuses(currentStatus: EventApplicationStatus): EventApplicationStatus[] {
  return VALID_STATUS_TRANSITIONS[currentStatus];
}
