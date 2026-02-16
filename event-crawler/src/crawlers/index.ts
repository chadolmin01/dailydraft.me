export { BaseCrawler, cleanupCrawlers } from './base-crawler.js';
export { ContestKoreaCrawler } from './contestkorea.js';
export { LinkareerCrawler } from './linkareer.js';
export { OnoffmixCrawler } from './onoffmix.js';
export { DevpostCrawler } from './devpost.js';
export { NaverSearchCrawler } from './naver-search.js';

import { ContestKoreaCrawler } from './contestkorea.js';
import { LinkareerCrawler } from './linkareer.js';
import { OnoffmixCrawler } from './onoffmix.js';
import { DevpostCrawler } from './devpost.js';
import { NaverSearchCrawler } from './naver-search.js';
import { EventSource } from '../types/index.js';

export type CrawlerClass =
  | typeof ContestKoreaCrawler
  | typeof LinkareerCrawler
  | typeof OnoffmixCrawler
  | typeof DevpostCrawler
  | typeof NaverSearchCrawler;

export const CRAWLERS: Record<string, CrawlerClass> = {
  contestkorea: ContestKoreaCrawler,
  linkareer: LinkareerCrawler,
  onoffmix: OnoffmixCrawler,
  devpost: DevpostCrawler,
  naver: NaverSearchCrawler,
};

export const AVAILABLE_SOURCES: (EventSource | 'naver')[] = [
  'contestkorea',
  'linkareer',
  'onoffmix',
  'devpost',
  'naver',
];

export function getCrawler(source: EventSource | 'naver') {
  const CrawlerClass = CRAWLERS[source];
  if (!CrawlerClass) {
    throw new Error(`Unknown source: ${source}`);
  }
  return new CrawlerClass();
}
