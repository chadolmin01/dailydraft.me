/**
 * Crawler Types
 */

export type CrawlerSource =
  | 'contestkorea'
  | 'linkareer'
  | 'onoffmix';

export interface RawCrawledEvent {
  source: CrawlerSource;
  sourceId: string;
  sourceUrl: string;
  title: string;
  organizer?: string;
  description?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  registrationUrl?: string;
  targetAudience?: string;
  location?: string;
  prize?: string;
  imageUrl?: string;
  tags?: string[];
  rawData?: Record<string, unknown>;
  crawledAt: string;
}

export interface CrawlResult {
  source: CrawlerSource;
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
  stack?: string;
}

export interface CrawlOptions {
  maxPages?: number;
  categories?: string[];
  verbose?: boolean;
}
