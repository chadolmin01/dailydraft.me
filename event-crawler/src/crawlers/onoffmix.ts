import { BaseCrawler } from './base-crawler.js';
import { RawCrawledEvent, CrawlOptions } from '../types/index.js';

const BASE_URL = 'https://onoffmix.com';

// Onoffmix categories - focus on networking and startup events
const CATEGORIES = {
  all: '/event',
  it: '/event?c=it',
  startup: '/event?c=startup',
  business: '/event?c=business',
  networking: '/event?c=networking',
  seminar: '/event?c=seminar',
};

export class OnoffmixCrawler extends BaseCrawler {
  constructor() {
    super('onoffmix', BASE_URL);
  }

  /**
   * Get list of event URLs
   */
  async getEventList(options: CrawlOptions = {}): Promise<string[]> {
    const urls: string[] = [];
    const maxPages = options.maxPages ?? 5;

    const categoriesToCrawl = options.categories?.length
      ? options.categories.filter(c => c in CATEGORIES)
      : ['startup', 'it', 'networking']; // Default categories

    for (const category of categoriesToCrawl) {
      const categoryPath = CATEGORIES[category as keyof typeof CATEGORIES] || CATEGORIES.all;

      for (let page = 1; page <= maxPages; page++) {
        try {
          const listUrl = `${BASE_URL}${categoryPath}&page=${page}`;
          this.logger.info(`Fetching list page: ${listUrl}`);

          const html = await this.rateLimiter.execute(() =>
            this.navigateAndGetContent(listUrl)
          );

          const $ = this.parseHtml(html);

          // Onoffmix event cards
          const eventLinks = $('a[href*="/event/"]');

          if (eventLinks.length === 0) {
            this.logger.info(`No more events found on page ${page}`);
            break;
          }

          eventLinks.each((_, el) => {
            const href = $(el).attr('href');
            if (href && href.match(/\/event\/\d+/)) {
              const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
              if (!urls.includes(fullUrl)) {
                urls.push(fullUrl);
              }
            }
          });

          this.logger.info(`Found ${eventLinks.length} events on page ${page}`);
        } catch (error) {
          this.logger.error(`Failed to fetch page ${page}: ${(error as Error).message}`);
          break;
        }
      }
    }

    return urls;
  }

  /**
   * Crawl a single event detail page
   */
  async crawlEventPage(url: string): Promise<RawCrawledEvent | null> {
    try {
      const html = await this.navigateAndGetContent(url);
      const $ = this.parseHtml(html);

      // Extract ID from URL
      const idMatch = url.match(/\/event\/(\d+)/);
      const sourceId = idMatch ? idMatch[1] : url;

      // Title
      const title = this.cleanText(
        $('h1.event-title, .title, h1').first().text()
      );

      if (!title) {
        this.logger.warn(`No title found for ${url}`);
        return null;
      }

      // Organizer/Host
      const organizer = this.cleanText(
        $('.host-name, .organizer').first().text() ||
        $('[class*="host"]').first().text()
      );

      // Description
      const description = this.cleanText(
        $('.event-content, .description, .content').first().text()
      );

      // Category
      const category = this.cleanText(
        $('.category, .event-category').first().text()
      );

      // Event date/time
      const dateInfo = this.extractDates($);

      // Location
      const location = this.cleanText(
        $('.location, .venue, .place').first().text() ||
        $('[class*="location"]').first().text()
      );

      // Price (free or paid)
      const price = this.cleanText(
        $('.price, .fee').first().text()
      );

      // Image
      const imageUrl =
        $('.event-image img, .poster img').attr('src') ||
        $('meta[property="og:image"]').attr('content');

      // Tags
      const tags: string[] = [];
      $('.tag, .keyword').each((_, el) => {
        const tag = this.cleanText($(el).text());
        if (tag && tag.length < 30 && !tags.includes(tag)) {
          tags.push(tag);
        }
      });

      return this.createRawEvent({
        sourceId,
        sourceUrl: url,
        title,
        organizer: organizer || undefined,
        description: description || undefined,
        category: category || undefined,
        startDate: dateInfo.startDate || undefined,
        endDate: dateInfo.endDate || undefined,
        registrationStartDate: dateInfo.registrationStartDate || undefined,
        registrationEndDate: dateInfo.registrationEndDate || undefined,
        registrationUrl: url,
        location: location || undefined,
        prize: price ? `참가비: ${price}` : undefined,
        imageUrl: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`) : undefined,
        tags,
        rawData: {
          crawledUrl: url,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to parse ${url}: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Extract dates from the page
   */
  private extractDates($: ReturnType<typeof import('cheerio').load>): {
    startDate: string | null;
    endDate: string | null;
    registrationStartDate: string | null;
    registrationEndDate: string | null;
  } {
    const result = {
      startDate: null as string | null,
      endDate: null as string | null,
      registrationStartDate: null as string | null,
      registrationEndDate: null as string | null,
    };

    // Event date
    const eventDateText =
      $('.event-date, .date, [class*="date"]').first().text() ||
      $('dt:contains("일시")').next('dd').text();

    if (eventDateText) {
      const dates = this.parseDateRange(eventDateText);
      result.startDate = dates.start || dates.end;
      result.endDate = dates.end;
      // For onoffmix, event date is usually the registration deadline
      result.registrationEndDate = dates.start || dates.end;
    }

    // Registration period (if separate)
    const registrationText =
      $('dt:contains("접수기간"), dt:contains("모집기간")').next('dd').text();

    if (registrationText) {
      const dates = this.parseDateRange(registrationText);
      result.registrationStartDate = dates.start;
      result.registrationEndDate = dates.end || result.registrationEndDate;
    }

    return result;
  }

  /**
   * Parse a date range string
   */
  private parseDateRange(rangeText: string): { start: string | null; end: string | null } {
    const separators = ['~', '-', '–', '→', 'to'];
    let start: string | null = null;
    let end: string | null = null;

    for (const sep of separators) {
      if (rangeText.includes(sep)) {
        const parts = rangeText.split(sep);
        if (parts.length >= 2) {
          start = this.parseDate(parts[0]);
          end = this.parseDate(parts[1]);
          break;
        }
      }
    }

    if (!start && !end) {
      const singleDate = this.parseDate(rangeText);
      if (singleDate) {
        start = singleDate;
        end = singleDate;
      }
    }

    return { start, end };
  }
}
