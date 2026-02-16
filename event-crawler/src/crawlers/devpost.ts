import { Element } from 'domhandler';
import { BaseCrawler } from './base-crawler.js';
import { RawCrawledEvent, CrawlOptions } from '../types/index.js';

const BASE_URL = 'https://devpost.com';

// DevPost hackathon filters
const CATEGORIES = {
  all: '/hackathons',
  online: '/hackathons?type=online',
  inPerson: '/hackathons?type=in-person',
  upcoming: '/hackathons?status=upcoming',
  open: '/hackathons?status=open',
};

export class DevpostCrawler extends BaseCrawler {
  constructor() {
    super('devpost', BASE_URL);
  }

  /**
   * Get list of hackathon URLs
   */
  async getEventList(options: CrawlOptions = {}): Promise<string[]> {
    const urls: string[] = [];
    const maxPages = options.maxPages ?? 3;

    const categoriesToCrawl = options.categories?.length
      ? options.categories.filter(c => c in CATEGORIES)
      : ['open', 'upcoming']; // Default to open and upcoming hackathons

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

          // DevPost hackathon tiles
          const hackathonLinks = $('a[href*="/hackathons/"]');

          if (hackathonLinks.length === 0) {
            this.logger.info(`No more hackathons found on page ${page}`);
            break;
          }

          hackathonLinks.each((_, el) => {
            const href = $(el).attr('href');
            if (href && !href.includes('?') && href.match(/\/hackathons\/[^\/]+$/)) {
              const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
              if (!urls.includes(fullUrl)) {
                urls.push(fullUrl);
              }
            }
          });

          this.logger.info(`Found ${hackathonLinks.length} hackathons on page ${page}`);
        } catch (error) {
          this.logger.error(`Failed to fetch page ${page}: ${(error as Error).message}`);
          break;
        }
      }
    }

    return urls;
  }

  /**
   * Crawl a single hackathon detail page
   */
  async crawlEventPage(url: string): Promise<RawCrawledEvent | null> {
    try {
      const html = await this.navigateAndGetContent(url);
      const $ = this.parseHtml(html);

      // Extract slug from URL
      const slugMatch = url.match(/\/hackathons\/([^\/\?]+)/);
      const sourceId = slugMatch ? slugMatch[1] : url;

      // Title
      const title = this.cleanText(
        $('h1.hackathon-title, h1, .title').first().text()
      );

      if (!title) {
        this.logger.warn(`No title found for ${url}`);
        return null;
      }

      // Organizer (host organization)
      const organizer = this.cleanText(
        $('.host-name, .organizer, .managed-by').first().text() ||
        $('[class*="host"]').first().text()
      );

      // Description/tagline
      const description = this.cleanText(
        $('.challenge-description, .tagline, .description').first().text() ||
        $('meta[name="description"]').attr('content')
      );

      // Dates - DevPost has structured date info
      const dateInfo = this.extractDates($);

      // Prize info
      const prize = this.cleanText(
        $('.prize, .prizes-header, [class*="prize"]').first().text()
      );

      // Location (online/in-person)
      const location = this.cleanText(
        $('.location, .venue, [class*="location"]').first().text()
      );

      // Image
      const imageUrl =
        $('.hackathon-image img, .banner img').attr('src') ||
        $('meta[property="og:image"]').attr('content');

      // Themes/technologies as tags
      const tags: string[] = [];
      $('.theme, .technology, .tag, [class*="theme"]').each((_, el) => {
        const tag = this.cleanText($(el).text());
        if (tag && tag.length < 50 && !tags.includes(tag)) {
          tags.push(tag);
        }
      });

      // Add 'hackathon' tag
      if (!tags.includes('hackathon')) {
        tags.unshift('hackathon');
      }

      // Participants count
      const participantsText = this.cleanText(
        $('[class*="participants"]').first().text()
      );

      return this.createRawEvent({
        sourceId,
        sourceUrl: url,
        title,
        organizer: organizer || 'DevPost',
        description: description || undefined,
        category: 'hackathon',
        startDate: dateInfo.startDate || undefined,
        endDate: dateInfo.endDate || undefined,
        registrationStartDate: dateInfo.registrationStartDate || undefined,
        registrationEndDate: dateInfo.registrationEndDate || undefined,
        registrationUrl: url,
        location: location || 'Online',
        prize: prize || undefined,
        imageUrl: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`) : undefined,
        tags,
        rawData: {
          crawledUrl: url,
          participants: participantsText,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to parse ${url}: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Extract dates from DevPost hackathon page
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

    // DevPost shows dates in various formats
    // Try to find submission period
    const submissionText =
      $('[class*="submission"], [class*="deadline"]').first().text() ||
      $('time').first().attr('datetime');

    if (submissionText) {
      // If it's an ISO datetime
      if (submissionText.includes('T') || submissionText.match(/^\d{4}-\d{2}-\d{2}/)) {
        const date = submissionText.split('T')[0];
        result.registrationEndDate = date;
      } else {
        const dates = this.parseDateRange(submissionText);
        result.registrationStartDate = dates.start;
        result.registrationEndDate = dates.end;
      }
    }

    // Hackathon dates (the actual event period)
    const hackathonDates = this.cleanText(
      $('[class*="dates"], [class*="hackathon-date"]').first().text()
    );

    if (hackathonDates) {
      const dates = this.parseDateRange(hackathonDates);
      result.startDate = dates.start;
      result.endDate = dates.end;

      // If no registration deadline, use start date
      if (!result.registrationEndDate) {
        result.registrationEndDate = dates.start || dates.end;
      }
    }

    // Try time elements with datetime attribute
    $('time[datetime]').each((_: number, el: Element) => {
      const datetime = $(el).attr('datetime');
      if (datetime) {
        const date = datetime.split('T')[0];
        const label = $(el).parent().text().toLowerCase();

        if (label.includes('end') || label.includes('submission')) {
          result.registrationEndDate = result.registrationEndDate || date;
          result.endDate = result.endDate || date;
        } else if (label.includes('start') || label.includes('begin')) {
          result.startDate = result.startDate || date;
          result.registrationStartDate = result.registrationStartDate || date;
        }
      }
    });

    return result;
  }

  /**
   * Parse a date range string
   */
  private parseDateRange(rangeText: string): { start: string | null; end: string | null } {
    const separators = ['–', '-', '~', 'to', 'through'];
    let start: string | null = null;
    let end: string | null = null;

    for (const sep of separators) {
      if (rangeText.toLowerCase().includes(sep)) {
        const parts = rangeText.split(new RegExp(sep, 'i'));
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
        end = singleDate;
      }
    }

    return { start, end };
  }
}
