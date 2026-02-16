import { RawCrawledEvent, TransformedEvent, EventType } from '../types/index.js';

/**
 * Map Contest Korea categories to our event types
 */
const CATEGORY_MAP: Record<string, EventType> = {
  // 창업 관련
  '창업': '사업화',
  '스타트업': '사업화',
  'startup': '사업화',
  '비즈니스': '사업화',
  '사업계획서': '사업화',

  // 공모전
  '공모전': '공모전',
  '콘테스트': '공모전',
  'contest': '공모전',
  '디자인': '공모전',
  '영상': '공모전',
  '사진': '공모전',
  '마케팅': '공모전',
  '광고': '공모전',
  '슬로건': '공모전',
  '아이디어': '공모전',
  'idea': '공모전',

  // 해커톤
  '해커톤': '해커톤',
  'hackathon': '해커톤',
  '코딩': '해커톤',
  '개발': '해커톤',
  'IT': '해커톤',

  // 교육
  '교육': '창업교육',
  '캠프': '창업교육',
  '멘토링': '창업교육',
  '특강': '창업교육',
  '세미나': '창업교육',

  // 네트워킹
  '네트워킹': '행사·네트워크',
  '행사': '행사·네트워크',
  '컨퍼런스': '행사·네트워크',
  '페어': '행사·네트워크',

  // 글로벌
  '글로벌': '글로벌',
  '해외': '글로벌',
  'global': '글로벌',
  'international': '글로벌',
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

  // Default to 공모전 for Contest Korea
  return '공모전';
}

/**
 * Transform Contest Korea event to our format
 */
export function transformContestKoreaEvent(raw: RawCrawledEvent): TransformedEvent | null {
  // Validate required fields
  if (!raw.title || !raw.sourceId) {
    return null;
  }

  // Registration end date is required
  if (!raw.registrationEndDate) {
    // If we have end date but no registration end date, use end date
    if (raw.endDate) {
      raw.registrationEndDate = raw.endDate;
    } else {
      // Skip events without any deadline
      return null;
    }
  }

  // Check if event is already expired
  const now = new Date();
  const registrationEndDate = new Date(raw.registrationEndDate);
  const status = registrationEndDate < now ? 'expired' : 'active';

  return {
    external_id: `contestkorea:${raw.sourceId}`,
    source: 'contestkorea',
    title: raw.title,
    organizer: raw.organizer || '콘테스트코리아',
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
export function transformContestKoreaEvents(rawEvents: RawCrawledEvent[]): TransformedEvent[] {
  return rawEvents
    .map(transformContestKoreaEvent)
    .filter((event): event is TransformedEvent => event !== null);
}
