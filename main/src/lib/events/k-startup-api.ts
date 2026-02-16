import type { KStartupAPIResponse, KStartupAPIOptions, KStartupEventItem } from '@/src/types/startup-events';

// Correct API endpoint from K-Startup Open API guide
const API_BASE_URL = 'https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Fetch events from K-Startup API with retry logic
 */
export async function fetchKStartupEvents(
  options: Partial<KStartupAPIOptions> = {}
): Promise<KStartupEventItem[]> {
  const serviceKey = process.env.KSTARTUP_API_KEY;

  if (!serviceKey) {
    throw new Error('KSTARTUP_API_KEY is not configured');
  }

  const params = new URLSearchParams({
    serviceKey,
    returnType: 'JSON',
    page: String(options.page || 1),
    perPage: String(options.perPage || 100),
  });

  const url = `${API_BASE_URL}?${params.toString()}`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: KStartupAPIResponse = await response.json();

      // Get events from data array
      const events = data.data || [];

      return events;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
        await sleep(delay);
      }
    }
  }

  throw new Error(
    `Failed to fetch K-Startup events after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}

/**
 * Fetch all events with pagination
 */
export async function fetchAllKStartupEvents(
  maxPages: number = 10
): Promise<KStartupEventItem[]> {
  const allEvents: KStartupEventItem[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore && currentPage <= maxPages) {
    const events = await fetchKStartupEvents({
      page: currentPage,
      perPage: 100,
    });

    allEvents.push(...events);

    // If we got less than 100 events, we've reached the end
    hasMore = events.length === 100;
    currentPage++;

    // Add delay between pages to avoid rate limiting
    if (hasMore) {
      await sleep(1000);
    }
  }

  return allEvents;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
