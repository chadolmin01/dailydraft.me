/**
 * Common types for event crawler
 */

export type EventSource =
  | 'contestkorea'
  | 'linkareer'
  | 'onoffmix'
  | 'devpost'
  | 'instagram'
  | 'facebook'
  | 'twitter';

// DB 기본 허용 타입 (마이그레이션 전 호환)
export type EventType =
  | '사업화'
  | '시설·공간'
  | '행사·네트워크'
  | '글로벌'
  | '창업교육';

export type EventStatus = 'active' | 'expired' | 'closed';

/**
 * Raw event data from crawlers (before transformation)
 */
export interface RawCrawledEvent {
  source: EventSource;
  sourceId: string;          // ID from the source website
  sourceUrl: string;         // Original URL
  title: string;
  organizer?: string;
  description?: string;
  category?: string;         // Source-specific category
  startDate?: string;        // ISO date string
  endDate?: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  registrationUrl?: string;
  targetAudience?: string;
  location?: string;
  prize?: string;            // Prize/benefit info
  imageUrl?: string;
  tags?: string[];           // Tags from source
  rawData?: Record<string, unknown>;  // Original data
  crawledAt: string;         // ISO timestamp
}

/**
 * Transformed event ready for database insertion
 */
export interface TransformedEvent {
  external_id: string;       // Format: {source}:{sourceId}
  source: EventSource;
  title: string;
  organizer: string;
  description: string | null;
  event_type: EventType;
  start_date: string | null;
  end_date: string | null;
  registration_start_date: string | null;
  registration_end_date: string;
  registration_url: string | null;
  target_audience: string | null;
  status: EventStatus;
  raw_data: Record<string, unknown> | null;
}

/**
 * Crawl result from a single source
 */
export interface CrawlResult {
  source: EventSource;
  success: boolean;
  eventsCount: number;
  events: RawCrawledEvent[];
  errors: CrawlError[];
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

export interface CrawlError {
  url?: string;
  message: string;
  code?: string;
  stack?: string;
}

/**
 * Options for running crawlers
 */
export interface CrawlOptions {
  dryRun?: boolean;          // Don't save to database
  maxPages?: number;         // Limit pages to crawl
  verbose?: boolean;         // Extra logging
  categories?: string[];     // Filter by categories
}

/**
 * Sync result after saving to database
 */
export interface SyncResult {
  source: EventSource;
  newEvents: number;
  updatedEvents: number;
  skippedEvents: number;
  expiredEvents: number;
  errors: Array<{ externalId?: string; error: string }>;
}
