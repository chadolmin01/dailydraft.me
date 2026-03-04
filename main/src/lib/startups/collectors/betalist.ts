/**
 * BetaList Collector
 * Uses Atom feed for startup discovery
 * https://feeds.feedburner.com/BetaList
 */

import {
  StartupCollector,
  CollectedStartup,
  SyncOptions,
  BetaListItem,
} from '../types';

const BETALIST_FEED_URL = 'https://feeds.feedburner.com/BetaList';

/**
 * Parse Atom feed (BetaList uses Atom, not RSS)
 */
function parseAtomFeed(xml: string): BetaListItem[] {
  const items: BetaListItem[] = [];

  // Extract all <entry> elements (Atom format)
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];

    // Extract title (format: "Name – Tagline")
    const title = extractTagContent(entryXml, 'title');

    // Extract link (href attribute)
    const linkMatch = entryXml.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/);
    const link = linkMatch ? linkMatch[1] : null;

    // Extract content (HTML description)
    const content = extractTagContent(entryXml, 'content');

    // Extract published date
    const published = extractTagContent(entryXml, 'published');

    if (title && link) {
      // Parse "Name – Tagline" format
      const titleParts = title.split(' – ');
      const name = titleParts[0]?.trim() || title;
      const tagline = titleParts[1]?.trim() || '';

      // Clean description from HTML content
      const description = cleanHtml(content || '');

      items.push({
        title: name,
        link: cleanUrl(link),
        description: tagline || description.substring(0, 200),
        pubDate: published || new Date().toISOString(),
        category: undefined, // BetaList doesn't provide categories in feed
      });
    }
  }

  return items;
}

function extractTagContent(xml: string, tag: string): string | null {
  // Handle CDATA
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1];

  // Handle regular content (with possible attributes)
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function cleanHtml(text: string): string {
  return text
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanUrl(url: string): string {
  // Remove tracking params from BetaList URLs
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.delete('utm_campaign');
    urlObj.searchParams.delete('utm_medium');
    urlObj.searchParams.delete('utm_source');
    return urlObj.toString();
  } catch {
    return url;
  }
}

function extractSlugFromUrl(url: string): string {
  // https://betalist.com/startups/example-startup -> example-startup
  const match = url.match(/\/startups\/([^/?#]+)/);
  return match ? match[1] : url.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

function transformBetaListItem(item: BetaListItem): CollectedStartup {
  const slug = extractSlugFromUrl(item.link);

  return {
    externalId: `betalist:${slug}`,
    source: 'betalist',
    sourceUrl: item.link,
    name: item.title,
    tagline: item.description || undefined,
    description: item.description || undefined,
    category: item.category || ['Other'],
    upvotes: 0,
    rawData: {
      pubDate: item.pubDate,
    },
  };
}

async function fetchAtomFeed(): Promise<BetaListItem[]> {
  try {
    const response = await fetch(BETALIST_FEED_URL, {
      headers: {
        'Accept': 'application/atom+xml, application/xml, text/xml',
        'User-Agent': 'Draft-StartupCollector/1.0',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`BetaList feed fetch failed: ${response.status}`);
    }

    const xml = await response.text();
    return parseAtomFeed(xml);
  } catch (error) {
    console.error('BetaList feed fetch error:', error);
    throw error;
  }
}

export const betalistCollector: StartupCollector = {
  source: 'betalist',
  tier: 2,

  async collect(options?: SyncOptions): Promise<CollectedStartup[]> {
    const limit = options?.limit;

    try {
      console.log('Fetching BetaList Atom feed...');
      const items = await fetchAtomFeed();

      let results = items.map(transformBetaListItem);

      if (limit) {
        results = results.slice(0, limit);
      }

      console.log(`BetaList Collector: Found ${results.length} startups`);
      return results;
    } catch (error) {
      console.error('BetaList collection error:', error);
      return [];
    }
  },
};

// Convenience function for direct use
export async function collectBetaListStartups(
  options?: SyncOptions
): Promise<CollectedStartup[]> {
  return betalistCollector.collect(options);
}
