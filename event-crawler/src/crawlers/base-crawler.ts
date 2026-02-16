import * as cheerio from 'cheerio';
import { Page } from 'puppeteer';
import { createPage, closeBrowser } from '../utils/browser.js';
import { getRateLimiter, RateLimiter } from '../utils/rate-limiter.js';
import { createSourceLogger } from '../utils/logger.js';
import {
  EventSource,
  RawCrawledEvent,
  CrawlResult,
  CrawlError,
  CrawlOptions,
} from '../types/index.js';

export abstract class BaseCrawler {
  protected source: EventSource;
  protected baseUrl: string;
  protected rateLimiter: RateLimiter;
  protected logger: ReturnType<typeof createSourceLogger>;
  protected page: Page | null = null;

  constructor(source: EventSource, baseUrl: string) {
    this.source = source;
    this.baseUrl = baseUrl;
    this.rateLimiter = getRateLimiter(source);
    this.logger = createSourceLogger(source);
  }

  /**
   * Main entry point for crawling
   */
  async crawl(options: CrawlOptions = {}): Promise<CrawlResult> {
    const startedAt = new Date().toISOString();
    const events: RawCrawledEvent[] = [];
    const errors: CrawlError[] = [];

    this.logger.info('Starting crawl', { options });

    try {
      // Check robots.txt
      const canCrawl = await this.checkRobotsTxt();
      if (!canCrawl) {
        throw new Error('Crawling not allowed by robots.txt');
      }

      // Initialize browser page
      this.page = await createPage();

      // Get list of event URLs
      const eventUrls = await this.getEventList(options);
      this.logger.info(`Found ${eventUrls.length} events to crawl`);

      // Crawl each event
      for (const url of eventUrls) {
        try {
          const event = await this.rateLimiter.execute(() =>
            this.crawlEventPage(url)
          );
          if (event) {
            events.push(event);
            if (options.verbose) {
              this.logger.info(`Crawled: ${event.title}`);
            }
          }
        } catch (error) {
          const err = error as Error;
          this.logger.error(`Failed to crawl ${url}: ${err.message}`);
          errors.push({
            url,
            message: err.message,
            stack: err.stack,
          });
        }
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Crawl failed: ${err.message}`);
      errors.push({
        message: err.message,
        stack: err.stack,
      });
    } finally {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
    }

    const completedAt = new Date().toISOString();
    const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

    const result: CrawlResult = {
      source: this.source,
      success: errors.length === 0,
      eventsCount: events.length,
      events,
      errors,
      startedAt,
      completedAt,
      durationMs,
    };

    this.logger.info('Crawl completed', {
      eventsCount: events.length,
      errorsCount: errors.length,
      durationMs,
    });

    return result;
  }

  /**
   * Check robots.txt for crawling permissions
   */
  protected async checkRobotsTxt(): Promise<boolean> {
    try {
      const robotsUrl = new URL('/robots.txt', this.baseUrl).toString();
      const response = await fetch(robotsUrl);

      if (!response.ok) {
        // No robots.txt, assume allowed
        return true;
      }

      const robotsTxt = await response.text();

      // Parse robots.txt - check for User-agent: * rules
      const lines = robotsTxt.split('\n');
      let inWildcardAgent = false;
      let hasDisallowAll = false;
      let hasAllowAll = false;

      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();

        if (trimmed.startsWith('user-agent:')) {
          const agent = trimmed.replace('user-agent:', '').trim();
          inWildcardAgent = agent === '*';
        }

        if (inWildcardAgent) {
          if (trimmed === 'disallow: /') {
            hasDisallowAll = true;
          }
          if (trimmed === 'allow: /' || trimmed === 'allow:/') {
            hasAllowAll = true;
          }
        }
      }

      // If there's Allow: / anywhere in the file, consider it allowed
      // This handles cases where Disallow: / is followed by Allow: /
      if (hasDisallowAll && !hasAllowAll) {
        this.logger.warn('Crawling disallowed by robots.txt');
        return false;
      }

      return true;
    } catch (error) {
      // If we can't fetch robots.txt, proceed with caution
      this.logger.warn('Could not fetch robots.txt, proceeding');
      return true;
    }
  }

  /**
   * Parse HTML with Cheerio
   */
  protected parseHtml(html: string): cheerio.CheerioAPI {
    return cheerio.load(html);
  }

  /**
   * Navigate to a page and get its content
   */
  protected async navigateAndGetContent(url: string): Promise<string> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    await this.page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    return this.page.content();
  }

  /**
   * Clean text by removing extra whitespace
   */
  protected cleanText(text: string | undefined): string {
    if (!text) return '';
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }

  /**
   * Parse date string to ISO format
   */
  protected parseDate(dateStr: string | undefined): string | null {
    if (!dateStr) return null;

    // Clean the date string
    const cleaned = dateStr.replace(/\s+/g, ' ').trim();

    // Try various formats
    const patterns = [
      // YYYY-MM-DD
      /(\d{4})-(\d{2})-(\d{2})/,
      // YYYY.MM.DD
      /(\d{4})\.(\d{2})\.(\d{2})/,
      // YYYY년 MM월 DD일
      /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/,
      // MM/DD/YYYY
      /(\d{2})\/(\d{2})\/(\d{4})/,
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        let year: string, month: string, day: string;

        if (pattern.source.includes('월')) {
          // Korean format
          [, year, month, day] = match;
        } else if (pattern.source.startsWith('(\\d{2})\\/')) {
          // MM/DD/YYYY format
          [, month, day, year] = match;
        } else {
          // YYYY-MM-DD or YYYY.MM.DD
          [, year, month, day] = match;
        }

        const parsedMonth = month.padStart(2, '0');
        const parsedDay = day.padStart(2, '0');

        return `${year}-${parsedMonth}-${parsedDay}`;
      }
    }

    this.logger.warn(`Could not parse date: ${dateStr}`);
    return null;
  }

  /**
   * Create a raw crawled event object
   */
  protected createRawEvent(data: Partial<RawCrawledEvent>): RawCrawledEvent {
    return {
      source: this.source,
      sourceId: data.sourceId || '',
      sourceUrl: data.sourceUrl || '',
      title: data.title || '',
      organizer: data.organizer,
      description: data.description,
      category: data.category,
      startDate: data.startDate,
      endDate: data.endDate,
      registrationStartDate: data.registrationStartDate,
      registrationEndDate: data.registrationEndDate,
      registrationUrl: data.registrationUrl,
      targetAudience: data.targetAudience,
      location: data.location,
      prize: data.prize,
      imageUrl: data.imageUrl,
      tags: data.tags,
      rawData: data.rawData,
      crawledAt: new Date().toISOString(),
    };
  }

  /**
   * Abstract methods to be implemented by each crawler
   */
  abstract getEventList(options: CrawlOptions): Promise<string[]>;
  abstract crawlEventPage(url: string): Promise<RawCrawledEvent | null>;
}

/**
 * Close browser when done with all crawlers
 */
export async function cleanupCrawlers(): Promise<void> {
  await closeBrowser();
}
