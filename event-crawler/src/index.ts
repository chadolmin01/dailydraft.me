/**
 * Event Crawler - 웹/SNS 크롤링 기반 행사 수집 시스템
 *
 * 수집 대상:
 * - 1차 (웹 크롤링): 콘테스트코리아, 링커리어, 온오프믹스, DevPost
 * - 2차 (SNS): 인스타그램, 페이스북, 트위터
 */

// Types
export * from './types/index.js';

// Crawlers
export {
  BaseCrawler,
  cleanupCrawlers,
  getCrawler,
  CRAWLERS,
  AVAILABLE_SOURCES,
  ContestKoreaCrawler,
  LinkareerCrawler,
  OnoffmixCrawler,
  DevpostCrawler,
} from './crawlers/index.js';

// Transformers
export {
  transformEvents,
  transformContestKoreaEvents,
  transformLinkareerEvents,
  transformOnoffmixEvents,
  transformDevpostEvents,
} from './transformers/index.js';

// Sync
export { SyncManager, syncManager } from './sync/sync-manager.js';

// Social (2차)
export {
  InstagramCrawler,
  FacebookCrawler,
  TwitterCrawler,
  SNS_SOURCES,
  checkSnsAvailability,
} from './social/index.js';

// Utils
export { logger, createSourceLogger } from './utils/logger.js';
export { RateLimiter, getRateLimiter } from './utils/rate-limiter.js';
export { getBrowser, createPage, closeBrowser, withPage } from './utils/browser.js';
