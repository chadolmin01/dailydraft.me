/**
 * 동기화 결과 타입 정의
 */

export interface SyncError {
  external_id?: string;
  source?: string;
  error: string;
  timestamp: string;
}

export interface SyncResult {
  source: string;
  new_events: number;
  updated_events: number;
  skipped_events: number;  // 이미 존재하거나 만료된 이벤트
  errors: SyncError[];
  started_at: string;
  completed_at: string;
}

export interface FullSyncResult {
  total_new: number;
  total_updated: number;
  total_skipped: number;
  total_errors: number;
  sources: SyncResult[];
  started_at: string;
  completed_at: string;
}

/**
 * 수집기 상태
 */
export interface CollectorStatus {
  source: string;
  is_available: boolean;
  last_sync: string | null;
  error: string | null;
}
