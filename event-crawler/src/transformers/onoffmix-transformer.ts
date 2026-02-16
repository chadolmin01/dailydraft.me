import { RawCrawledEvent, TransformedEvent, EventType } from '../types/index.js';

/**
 * Map Onoffmix categories to our event types
 */
const CATEGORY_MAP: Record<string, EventType> = {
  // IT/Tech
  'it': '해커톤',
  'tech': '해커톤',
  '개발': '해커톤',
  '프로그래밍': '해커톤',

  // Startup
  'startup': '사업화',
  '창업': '사업화',
  '스타트업': '사업화',
  '비즈니스': '사업화',

  // Networking
  'networking': '행사·네트워크',
  '네트워킹': '행사·네트워크',
  '밋업': '행사·네트워크',
  'meetup': '행사·네트워크',

  // Seminar/Education
  'seminar': '창업교육',
  '세미나': '창업교육',
  '강연': '창업교육',
  '교육': '창업교육',
  '워크숍': '창업교육',
  'workshop': '창업교육',

  // Conference
  '컨퍼런스': '행사·네트워크',
  'conference': '행사·네트워크',
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

  // Default to 행사·네트워크 for Onoffmix
  return '행사·네트워크';
}

/**
 * Transform Onoffmix event to our format
 */
export function transformOnoffmixEvent(raw: RawCrawledEvent): TransformedEvent | null {
  if (!raw.title || !raw.sourceId) {
    return null;
  }

  // For events without registration deadline, use the event start date
  let registrationEndDate = raw.registrationEndDate;
  if (!registrationEndDate) {
    registrationEndDate = raw.startDate || raw.endDate;
  }

  if (!registrationEndDate) {
    return null;
  }

  const now = new Date();
  const endDate = new Date(registrationEndDate);
  const status = endDate < now ? 'expired' : 'active';

  return {
    external_id: `onoffmix:${raw.sourceId}`,
    source: 'onoffmix',
    title: raw.title,
    organizer: raw.organizer || '온오프믹스',
    description: raw.description || null,
    event_type: determineEventType(raw),
    start_date: raw.startDate || null,
    end_date: raw.endDate || null,
    registration_start_date: raw.registrationStartDate || null,
    registration_end_date: registrationEndDate,
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
export function transformOnoffmixEvents(rawEvents: RawCrawledEvent[]): TransformedEvent[] {
  return rawEvents
    .map(transformOnoffmixEvent)
    .filter((event): event is TransformedEvent => event !== null);
}
