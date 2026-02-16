import { BaseCrawler } from './base-crawler.js';
import { RawCrawledEvent, CrawlOptions } from '../types/index.js';

const BASE_URL = 'https://www.contestkorea.com';

// Contest Korea categories - actual URL structure uses /sub/list.php
// bcode mappings: 030110001=아이디어, 030210001=광고/마케팅, 030310001=네이밍/슬로건
// 030810001=디자인, 030610001=미술/사진, 030910001=캐릭터/만화
// 031210001=영상/UCC, 031410001=음악/뮤지션, 031610001=문학/시나리오
// 031810001=과학/공학
const CATEGORIES = {
  all: '/sub/list.php?int_gbn=1&Txt_bcode=030110001',  // 아이디어 (창업 관련 많음)
  idea: '/sub/list.php?int_gbn=1&Txt_bcode=030110001',
  design: '/sub/list.php?int_gbn=1&Txt_bcode=030810001',
  marketing: '/sub/list.php?int_gbn=1&Txt_bcode=030210001',
  video: '/sub/list.php?int_gbn=1&Txt_bcode=031210001',
};

export class ContestKoreaCrawler extends BaseCrawler {
  constructor() {
    super('contestkorea', BASE_URL);
  }

  /**
   * Get list of contest URLs from the listing page
   */
  async getEventList(options: CrawlOptions = {}): Promise<string[]> {
    const urls: string[] = [];
    const maxPages = options.maxPages ?? 5;

    // Determine which categories to crawl
    const categoriesToCrawl = options.categories?.length
      ? options.categories.filter(c => c in CATEGORIES)
      : ['all'];

    for (const category of categoriesToCrawl) {
      const categoryPath = CATEGORIES[category as keyof typeof CATEGORIES] || CATEGORIES.all;

      for (let page = 1; page <= maxPages; page++) {
        try {
          const separator = categoryPath.includes('?') ? '&' : '?';
          const listUrl = `${BASE_URL}${categoryPath}${separator}page=${page}`;
          this.logger.info(`Fetching list page: ${listUrl}`);

          const html = await this.rateLimiter.execute(() =>
            this.navigateAndGetContent(listUrl)
          );

          const $ = this.parseHtml(html);

          // Find contest links - Contest Korea uses view.php?...&str_no=XXX pattern
          const contestLinks = $('a[href*="view.php"][href*="str_no="]');

          if (contestLinks.length === 0) {
            this.logger.info(`No more contests found on page ${page}`);
            break;
          }

          const seenIds = new Set<string>();
          contestLinks.each((_, el) => {
            const href = $(el).attr('href');
            if (href) {
              // Extract str_no to avoid duplicates
              const strNoMatch = href.match(/str_no=(\d+)/);
              if (strNoMatch && !seenIds.has(strNoMatch[1])) {
                seenIds.add(strNoMatch[1]);
                // Build full URL, handling relative paths correctly
                let fullUrl: string;
                if (href.startsWith('http')) {
                  fullUrl = href;
                } else if (href.startsWith('/')) {
                  fullUrl = `${BASE_URL}${href}`;
                } else {
                  fullUrl = `${BASE_URL}/sub/${href}`;
                }
                if (!urls.includes(fullUrl)) {
                  urls.push(fullUrl);
                }
              }
            }
          });

          this.logger.info(`Found ${contestLinks.length} contests on page ${page}`);
        } catch (error) {
          this.logger.error(`Failed to fetch page ${page}: ${(error as Error).message}`);
          break;
        }
      }
    }

    return urls;
  }

  /**
   * Crawl a single contest detail page
   */
  async crawlEventPage(url: string): Promise<RawCrawledEvent | null> {
    try {
      const html = await this.navigateAndGetContent(url);
      const $ = this.parseHtml(html);

      // Extract contest ID from URL (str_no parameter)
      const idMatch = url.match(/str_no=(\d+)/);
      const sourceId = idMatch ? idMatch[1] : url;

      // Parse the contest details - Contest Korea uses table structure
      // Title is in <h1> tag
      const title = this.cleanText($('h1').first().text());

      if (!title) {
        this.logger.warn(`No title found for ${url}`);
        return null;
      }

      // Helper to find table cell by header text
      const getTableValue = (headerText: string): string => {
        const th = $(`th:contains("${headerText}")`);
        return this.cleanText(th.next('td').text());
      };

      // Organizer info - "주최 . 주관" header
      const organizer = getTableValue('주최') || getTableValue('주관');

      // Description - usually in a large content area
      const description = this.cleanText(
        $('.view_txt').first().text() ||
        $('.content').first().text()
      );

      // Category from page title or breadcrumb
      const category = this.cleanText(
        $('title').text().split('>')[0]?.trim() ||
        $('.location, .breadcrumb').first().text()
      );

      // Dates - Contest Korea typically shows dates in various formats
      const dateInfo = this.extractDates($);

      // Prize/benefit info - look for 상금 in table or text
      const prizeText = getTableValue('상금') || getTableValue('시상');
      const prize = prizeText || this.cleanText(
        $('td:contains("총상금")').text()
      );

      // Target audience
      const targetAudience = getTableValue('응모자격') || getTableValue('참가대상') || getTableValue('지원자격');

      // Registration URL - look for external link to host site
      const externalLink = $('a.homepage_go, a[href*="notion.site"], a[href*="forms."]').attr('href');
      const registrationUrl = externalLink || url;

      // Image URL - usually in view area
      const imageUrl =
        $('.view_img img').attr('src') ||
        $('meta[property="og:image"]').attr('content');

      // Tags from category or type
      const tags: string[] = [];
      if (category) {
        tags.push(category);
      }

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
        registrationUrl: registrationUrl.startsWith('http')
          ? registrationUrl
          : `${BASE_URL}${registrationUrl}`,
        targetAudience: targetAudience || undefined,
        prize: prize || undefined,
        imageUrl: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`) : undefined,
        tags,
        rawData: {
          crawledUrl: url,
          html: html.substring(0, 5000), // Store first 5000 chars for debugging
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

    // Try to find registration period - Contest Korea uses th/td table structure
    const registrationPeriodText =
      $('th:contains("접수기간")').next('td').text() ||
      $('th:contains("모집기간")').next('td').text() ||
      $('th:contains("응모기간")').next('td').text();

    if (registrationPeriodText) {
      const dates = this.parseDateRange(registrationPeriodText);
      result.registrationStartDate = dates.start;
      result.registrationEndDate = dates.end;
    }

    // Try to find event/announcement period
    const eventPeriodText =
      $('th:contains("행사기간")').next('td').text() ||
      $('th:contains("대회기간")').next('td').text() ||
      $('th:contains("공모기간")').next('td').text();

    if (eventPeriodText) {
      const dates = this.parseDateRange(eventPeriodText);
      result.startDate = dates.start;
      result.endDate = dates.end;
    }

    // If no registration end date, try to find deadline
    if (!result.registrationEndDate) {
      const deadlineText =
        $('th:contains("마감")').next('td').text() ||
        $('th:contains("접수마감")').next('td').text();

      result.registrationEndDate = this.parseDate(deadlineText);
    }

    return result;
  }

  /**
   * Parse a date range string like "2024.01.01 ~ 2024.02.28"
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

    // If no separator found, try to parse the whole string as a single date
    if (!start && !end) {
      const singleDate = this.parseDate(rangeText);
      if (singleDate) {
        end = singleDate;
      }
    }

    return { start, end };
  }
}
