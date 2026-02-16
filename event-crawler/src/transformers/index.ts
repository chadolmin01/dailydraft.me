export { transformContestKoreaEvent, transformContestKoreaEvents } from './contestkorea-transformer.js';
export { transformLinkareerEvent, transformLinkareerEvents } from './linkareer-transformer.js';
export { transformOnoffmixEvent, transformOnoffmixEvents } from './onoffmix-transformer.js';
export { transformDevpostEvent, transformDevpostEvents } from './devpost-transformer.js';
export { transformNaverSearchEvent, transformNaverSearchEvents } from './naver-search-transformer.js';

import { RawCrawledEvent, TransformedEvent, EventSource } from '../types/index.js';
import { transformContestKoreaEvents } from './contestkorea-transformer.js';
import { transformLinkareerEvents } from './linkareer-transformer.js';
import { transformOnoffmixEvents } from './onoffmix-transformer.js';
import { transformDevpostEvents } from './devpost-transformer.js';
import { transformNaverSearchEvents } from './naver-search-transformer.js';

type TransformerFn = (events: RawCrawledEvent[]) => TransformedEvent[];

const TRANSFORMERS: Record<EventSource | 'naver', TransformerFn> = {
  contestkorea: transformContestKoreaEvents,
  linkareer: transformLinkareerEvents,
  onoffmix: transformOnoffmixEvents,
  devpost: transformDevpostEvents,
  naver: transformNaverSearchEvents,
  // SNS crawlers (placeholder)
  instagram: () => [],
  facebook: () => [],
  twitter: () => [],
};

/**
 * Transform raw events from any source
 */
export function transformEvents(source: EventSource | 'naver', rawEvents: RawCrawledEvent[]): TransformedEvent[] {
  const transformer = TRANSFORMERS[source];
  if (!transformer) {
    throw new Error(`No transformer for source: ${source}`);
  }
  return transformer(rawEvents);
}
