import { BaseCrawler } from './base-crawler.js';
import { RawCrawledEvent, CrawlOptions } from '../types/index.js';

const BASE_URL = 'https://linkareer.com';

// Linkareer categories - focus on startup-related
const CATEGORIES = {
  all: '/list/activity',
  contest: '/list/activity?filterBy=CONTEST',
  activity: '/list/activity?filterBy=ACTIVITY',
  intern: '/list/activity?filterBy=INTERN',
};

export class LinkareerCrawler extends BaseCrawler {
  constructor() {
    super('linkareer', BASE_URL);
  }

  /**
   * Get list of activity/contest URLs
   */
  async getEventList(options: CrawlOptions = {}): Promise<string[]> {
    const urls: string[] = [];
    const maxPages = options.maxPages ?? 5;

    // Determine which categories to crawl
    const categoriesToCrawl = options.categories?.length
      ? options.categories.filter(c => c in CATEGORIES)
      : ['contest', 'activity']; // Default to contest and activity

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

          // Linkareer uses card-based layout
          // Look for activity/contest links
          const activityLinks = $('a[href*="/activity/"]');

          if (activityLinks.length === 0) {
            this.logger.info(`No more items found on page ${page}`);
            break;
          }

          activityLinks.each((_, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('/activity/')) {
              const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
              // Avoid duplicates and list pages
              if (!urls.includes(fullUrl) && !fullUrl.includes('?')) {
                urls.push(fullUrl);
              }
            }
          });

          this.logger.info(`Found ${activityLinks.length} items on page ${page}`);
        } catch (error) {
          this.logger.error(`Failed to fetch page ${page}: ${(error as Error).message}`);
          break;
        }
      }
    }

    return urls;
  }

  /**
   * Crawl a single activity detail page
   */
  async crawlEventPage(url: string): Promise<RawCrawledEvent | null> {
    try {
      const html = await this.navigateAndGetContent(url);
      const $ = this.parseHtml(html);

      // Extract ID from URL
      const idMatch = url.match(/\/activity\/(\d+)/);
      const sourceId = idMatch ? idMatch[1] : url;

      // Parse activity details
      // Linkareer typically has structured data
      const title = this.cleanText(
        $('h1.title, .activity-title, h1').first().text()
      );

      if (!title) {
        this.logger.warn(`No title found for ${url}`);
        return null;
      }

      // Organizer
      const organizer = this.cleanText(
        $('.company-name, .organizer, .host').first().text() ||
        $('[class*="company"]').first().text()
      );

      // Description - Linkareer often has rich content
      const description = this.cleanText(
        $('.content-area, .activity-content, .description').first().text() ||
        $('[class*="content"]').first().text()
      );

      // Category/Type
      const category = this.cleanText(
        $('.category, .type, .badge').first().text() ||
        $('[class*="category"]').first().text()
      );

      // Extract dates
      const dateInfo = this.extractDates($);

      // Target audience
      const targetAudience = this.cleanText(
        $('dt:contains("지원자격"), dt:contains("참가대상")').next('dd').text() ||
        $('[class*="qualification"]').first().text()
      );

      // Prize/Benefits
      const prize = this.cleanText(
        $('dt:contains("활동혜택"), dt:contains("상금")').next('dd').text() ||
        $('[class*="benefit"]').first().text()
      );

      // Location
      const location = this.cleanText(
        $('dt:contains("활동지역"), dt:contains("장소")').next('dd').text() ||
        $('[class*="location"]').first().text()
      );

      // Image URL
      const imageUrl =
        $('.poster img, .thumbnail img, .activity-image img').attr('src') ||
        $('meta[property="og:image"]').attr('content');

      // Tags/keywords
      const tags: string[] = [];
      $('.tag, .keyword, [class*="tag"]').each((_, el) => {
        const tag = this.cleanText($(el).text());
        if (tag && tag.length < 30 && !tags.includes(tag)) {
          tags.push(tag);
        }
      });

      // Registration URL
      const registrationUrl =
        $('a.apply-btn, a[href*="apply"], button.apply').attr('href') || url;

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
        registrationUrl: registrationUrl?.startsWith('http')
          ? registrationUrl
          : registrationUrl ? `${BASE_URL}${registrationUrl}` : url,
        targetAudience: targetAudience || undefined,
        location: location || undefined,
        prize: prize || undefined,
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

    // Try to find registration period
    const registrationText =
      $('dt:contains("접수기간"), dt:contains("모집기간")').next('dd').text() ||
      $('[class*="period"]').first().text() ||
      $('[class*="deadline"]').first().text();

    if (registrationText) {
      const dates = this.parseDateRange(registrationText);
      result.registrationStartDate = dates.start;
      result.registrationEndDate = dates.end;
    }

    // Activity period
    const activityText =
      $('dt:contains("활동기간"), dt:contains("행사기간")').next('dd').text();

    if (activityText) {
      const dates = this.parseDateRange(activityText);
      result.startDate = dates.start;
      result.endDate = dates.end;
    }

    // If still no registration end date, look for D-day or deadline
    if (!result.registrationEndDate) {
      const ddayText = $('[class*="dday"], [class*="d-day"]').first().text();
      if (ddayText) {
        const daysMatch = ddayText.match(/D-(\d+)/i);
        if (daysMatch) {
          const daysLeft = parseInt(daysMatch[1], 10);
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + daysLeft);
          result.registrationEndDate = endDate.toISOString().split('T')[0];
        }
      }
    }

    return result;
  }

  /**
   * Parse a date range string
   */
  private parseDateRange(rangeText: string): { start: string | null; end: string | null } {
    const separators = ['~', '-', '–', '→', 'to', '부터'];
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
        end = singleDate;
      }
    }

    return { start, end };
  }
}
