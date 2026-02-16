import { RawCrawledEvent, TransformedEvent, EventType } from '../types/index.js';

/**
 * Map Linkareer categories to our event types
 */
const CATEGORY_MAP: Record<string, EventType> = {
  // 대외활동
  '대외활동': '대외활동',
  '서포터즈': '대외활동',
  '봉사': '대외활동',
  '기자단': '대외활동',
  '홍보대사': '대외활동',

  // 공모전
  '공모전': '공모전',
  '콘테스트': '공모전',
  '디자인': '공모전',
  '영상': '공모전',
  '마케팅': '공모전',
  '광고': '공모전',
  '아이디어': '공모전',

  // 창업
  '창업': '사업화',
  '스타트업': '사업화',
  '비즈니스': '사업화',

  // 해커톤
  '해커톤': '해커톤',
  'IT': '해커톤',
  '개발': '해커톤',
  '코딩': '해커톤',

  // 교육
  '인턴': '창업교육',
  '교육': '창업교육',
  '캠프': '창업교육',
  '멘토링': '창업교육',

  // 네트워킹
  '네트워킹': '행사·네트워크',
  '행사': '행사·네트워크',
  '컨퍼런스': '행사·네트워크',

  // 글로벌
  '해외': '글로벌',
  '글로벌': '글로벌',
};

/**
 * Determine event type from category and title
 */
function determineEventType(raw: RawCrawledEvent): EventType {
  const searchText = `${raw.category || ''} ${raw.title} ${raw.tags?.join(' ') || ''}`.toLowerCase();

  for (const [keyword, eventType] of Object.entries(CATEGORY_MAP)) {
    if (searchText.includes(keyword.toLowerCase())) {
      return eventType;
    }
  }

  // Default to 대외활동 for Linkareer
  return '대외활동';
}

/**
 * Transform Linkareer event to our format
 */
export function transformLinkareerEvent(raw: RawCrawledEvent): TransformedEvent | null {
  if (!raw.title || !raw.sourceId) {
    return null;
  }

  // Registration end date is required
  if (!raw.registrationEndDate) {
    if (raw.endDate) {
      raw.registrationEndDate = raw.endDate;
    } else {
      return null;
    }
  }

  const now = new Date();
  const registrationEndDate = new Date(raw.registrationEndDate);
  const status = registrationEndDate < now ? 'expired' : 'active';

  return {
    external_id: `linkareer:${raw.sourceId}`,
    source: 'linkareer',
    title: raw.title,
    organizer: raw.organizer || '링커리어',
    description: raw.description || null,
    event_type: determineEventType(raw),
    start_date: raw.startDate || null,
    end_date: raw.endDate || null,
    registration_start_date: raw.registrationStartDate || null,
    registration_end_date: raw.registrationEndDate,
    registration_url: raw.registrationUrl || raw.sourceUrl || null,
    target_audience: raw.targetAudience || null,
    status,
    raw_data: {
      source_url: raw.sourceUrl,
      category: raw.category,
      location: raw.location,
      prize: raw.prize,
      image_url: raw.imageUrl,
      tags: raw.tags,
      crawled_at: raw.crawledAt,
    },
  };
}

/**
 * Transform multiple events
 */
export function transformLinkareerEvents(rawEvents: RawCrawledEvent[]): TransformedEvent[] {
  return rawEvents
    .map(transformLinkareerEvent)
    .filter((event): event is TransformedEvent => event !== null);
}
