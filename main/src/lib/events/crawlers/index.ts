/**
 * Event Crawlers - 웹 크롤링 기반 이벤트 수집
 *
 * 크롤러는 Puppeteer가 필요하므로 서버리스 환경에서는 제한적입니다.
 * 대신 외부 크롤러 서비스에서 /api/cron/ingest-crawled-events로 결과를 전송하는 방식을 사용합니다.
 */

export * from './types';
export {
  crawlContestKorea,
  transformContestKoreaEvent,
  transformContestKoreaEvents,
} from './contestkorea';

// 향후 추가 크롤러
// export { crawlLinkareer, transformLinkareerEvents } from './linkareer';
// export { crawlOnoffmix, transformOnoffmixEvents } from './onoffmix';

import type { TransformedEvent } from '@/src/types/startup-events';
import type { RawCrawledEvent, CrawlerSource } from './types';
import { transformContestKoreaEvent } from './contestkorea';

/**
 * 소스별 변환 함수 매핑
 */
const transformers: Record<
  CrawlerSource,
  (raw: RawCrawledEvent) => TransformedEvent
> = {
  contestkorea: transformContestKoreaEvent,
  linkareer: transformGenericEvent,
  onoffmix: transformGenericEvent,
};

/**
 * RawCrawledEvent를 TransformedEvent로 변환
 */
export function transformCrawledEvent(raw: RawCrawledEvent): TransformedEvent {
  const transformer = transformers[raw.source];
  if (transformer) {
    return transformer(raw);
  }
  return transformGenericEvent(raw);
}

/**
 * 여러 RawCrawledEvent 일괄 변환
 */
export function transformCrawledEvents(
  events: RawCrawledEvent[]
): TransformedEvent[] {
  return events.map(transformCrawledEvent);
}

/**
 * 범용 변환 함수 (소스별 변환기가 없는 경우)
 */
function transformGenericEvent(raw: RawCrawledEvent): TransformedEvent {
  let registrationEndDate = raw.registrationEndDate || raw.endDate;
  if (!registrationEndDate) {
    const defaultEnd = new Date();
    defaultEnd.setDate(defaultEnd.getDate() + 30);
    registrationEndDate = defaultEnd.toISOString().split('T')[0];
  }

  return {
    external_id: `${raw.source}:${raw.sourceId}`,
    source: raw.source,
    title: raw.title,
    organizer: raw.organizer || raw.source,
    event_type: '행사·네트워크',
    description: raw.description || null,
    start_date: raw.startDate || null,
    end_date: raw.endDate || null,
    registration_start_date: raw.registrationStartDate || null,
    registration_end_date: registrationEndDate,
    registration_url: raw.registrationUrl || raw.sourceUrl,
    views_count: 0,
    target_audience: raw.targetAudience || null,
    raw_data: raw.rawData || {},
  };
}
