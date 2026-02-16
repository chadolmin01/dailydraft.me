import { RawCrawledEvent, TransformedEvent, EventType } from '../types/index.js';

/**
 * Transform DevPost hackathon to our format
 * DevPost is primarily for hackathons, so the type is straightforward
 */
export function transformDevpostEvent(raw: RawCrawledEvent): TransformedEvent | null {
  if (!raw.title || !raw.sourceId) {
    return null;
  }

  // Registration end date is required
  if (!raw.registrationEndDate) {
    // Use event dates as fallback
    if (raw.startDate) {
      raw.registrationEndDate = raw.startDate;
    } else if (raw.endDate) {
      raw.registrationEndDate = raw.endDate;
    } else {
      return null;
    }
  }

  const now = new Date();
  const registrationEndDate = new Date(raw.registrationEndDate);
  const status = registrationEndDate < now ? 'expired' : 'active';

  // Determine if it's global based on title/description
  const isGlobal = /global|international|worldwide/i.test(
    `${raw.title} ${raw.description || ''}`
  );

  const eventType: EventType = isGlobal ? '글로벌' : '해커톤';

  return {
    external_id: `devpost:${raw.sourceId}`,
    source: 'devpost',
    title: raw.title,
    organizer: raw.organizer || 'DevPost',
    description: raw.description || null,
    event_type: eventType,
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
export function transformDevpostEvents(rawEvents: RawCrawledEvent[]): TransformedEvent[] {
  return rawEvents
    .map(transformDevpostEvent)
    .filter((event): event is TransformedEvent => event !== null);
}
