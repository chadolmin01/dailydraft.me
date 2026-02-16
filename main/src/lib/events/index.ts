/**
 * Events Library - 이벤트 수집 및 동기화
 */

// Core sync functions
export { syncEventsToDatabase } from './event-sync-manager';
export { fetchKStartupEvents } from './k-startup-api';
export { transformKStartupEvent } from './transform-event';

// Collectors (API-based)
export { collectDevpostHackathons } from './collectors';

// Crawlers (Web scraping - requires external service for serverless)
export {
  transformCrawledEvent,
  transformCrawledEvents,
  transformContestKoreaEvent,
  transformContestKoreaEvents,
} from './crawlers';

export type {
  RawCrawledEvent,
  CrawlResult,
  CrawlError,
  CrawlOptions,
  CrawlerSource,
} from './crawlers';
