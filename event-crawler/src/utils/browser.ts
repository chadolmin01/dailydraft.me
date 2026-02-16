import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from './logger.js';

let browserInstance: Browser | null = null;

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

export interface BrowserOptions {
  headless?: boolean;
  userAgent?: string;
  timeout?: number;
}

export async function getBrowser(options: BrowserOptions = {}): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    logger.info('Launching new browser instance');
    browserInstance = await puppeteer.launch({
      headless: options.headless ?? true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    });
  }
  return browserInstance;
}

export async function createPage(options: BrowserOptions = {}): Promise<Page> {
  const browser = await getBrowser(options);
  const page = await browser.newPage();

  const userAgent = options.userAgent ?? process.env.USER_AGENT ?? DEFAULT_USER_AGENT;
  await page.setUserAgent(userAgent);

  await page.setViewport({ width: 1920, height: 1080 });

  // Set default timeout
  page.setDefaultTimeout(options.timeout ?? 30000);
  page.setDefaultNavigationTimeout(options.timeout ?? 30000);

  // Block unnecessary resources for faster crawling
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const resourceType = request.resourceType();
    if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
      request.abort();
    } else {
      request.continue();
    }
  });

  return page;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    logger.info('Closing browser instance');
    await browserInstance.close();
    browserInstance = null;
  }
}

export async function withPage<T>(
  fn: (page: Page) => Promise<T>,
  options: BrowserOptions = {}
): Promise<T> {
  const page = await createPage(options);
  try {
    return await fn(page);
  } finally {
    await page.close();
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeBrowser();
  process.exit(0);
});
