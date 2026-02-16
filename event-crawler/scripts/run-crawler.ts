#!/usr/bin/env tsx
/**
 * Event Crawler CLI
 *
 * Usage:
 *   npm run crawl -- --source=contestkorea --dry-run
 *   npm run crawl -- --source=all --max-pages=3
 *   npm run crawl:contestkorea
 */

import 'dotenv/config';
import { parseArgs } from 'node:util';
import {
  getCrawler,
  cleanupCrawlers,
  AVAILABLE_SOURCES,
  NaverSearchCrawler,
} from '../src/crawlers/index.js';
import { transformEvents } from '../src/transformers/index.js';
import { syncManager } from '../src/sync/sync-manager.js';
import { logger } from '../src/utils/logger.js';
import { EventSource, CrawlResult, SyncResult, RawCrawledEvent } from '../src/types/index.js';

type SourceType = EventSource | 'naver';

interface CrawlSummary {
  source: SourceType;
  crawlResult: CrawlResult;
  syncResult: SyncResult | null;
}

async function main() {
  const { values } = parseArgs({
    options: {
      source: {
        type: 'string',
        short: 's',
        default: 'all',
      },
      'dry-run': {
        type: 'boolean',
        default: false,
      },
      'max-pages': {
        type: 'string',
        short: 'p',
        default: '5',
      },
      verbose: {
        type: 'boolean',
        short: 'v',
        default: false,
      },
      categories: {
        type: 'string',
        short: 'c',
      },
      help: {
        type: 'boolean',
        short: 'h',
        default: false,
      },
    },
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  const sourceArg = values.source || 'all';
  const dryRun = values['dry-run'] || false;
  const maxPages = parseInt(values['max-pages'] || '5', 10);
  const verbose = values.verbose || false;
  const categories = values.categories?.split(',');

  // Determine which sources to crawl
  const sourcesToCrawl: SourceType[] =
    sourceArg === 'all'
      ? AVAILABLE_SOURCES as SourceType[]
      : [sourceArg as SourceType];

  // Validate sources
  for (const source of sourcesToCrawl) {
    if (!AVAILABLE_SOURCES.includes(source as EventSource | 'naver')) {
      logger.error(`Unknown source: ${source}`);
      logger.info(`Available sources: ${AVAILABLE_SOURCES.join(', ')}`);
      process.exit(1);
    }
  }

  logger.info('Starting crawler', {
    sources: sourcesToCrawl,
    dryRun,
    maxPages,
    categories,
  });

  const summaries: CrawlSummary[] = [];
  const startTime = Date.now();

  try {
    for (const source of sourcesToCrawl) {
      logger.info(`\n${'='.repeat(50)}`);
      logger.info(`Crawling: ${source}`);
      logger.info('='.repeat(50));

      let crawlResult: CrawlResult;
      let rawEvents: RawCrawledEvent[] = [];

      // Handle Naver search differently
      if (source === 'naver') {
        const naverCrawler = new NaverSearchCrawler();

        if (!naverCrawler.isAvailable()) {
          logger.error('Naver API credentials not configured');
          logger.info('Set NAVER_CLIENT_ID and NAVER_CLIENT_SECRET in .env');
          continue;
        }

        const startedAt = new Date().toISOString();
        rawEvents = await naverCrawler.searchEvents({ maxPages });
        const completedAt = new Date().toISOString();

        crawlResult = {
          source: 'contestkorea', // Naver results use contestkorea as base
          success: true,
          eventsCount: rawEvents.length,
          events: rawEvents,
          errors: [],
          startedAt,
          completedAt,
          durationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
        };
      } else {
        const crawler = getCrawler(source);
        crawlResult = await crawler.crawl({
          dryRun,
          maxPages,
          verbose,
          categories,
        });
        rawEvents = crawlResult.events;
      }

      logger.info(`Crawled ${crawlResult.eventsCount} events from ${source}`);

      // Transform
      const transformedEvents = transformEvents(source, rawEvents);
      logger.info(`Transformed ${transformedEvents.length} events`);

      // Sync to database
      let syncResult: SyncResult | null = null;
      if (transformedEvents.length > 0) {
        syncResult = await syncManager.syncEvents(transformedEvents, { dryRun });
      }

      summaries.push({
        source,
        crawlResult,
        syncResult,
      });
    }
  } finally {
    // Cleanup browser
    await cleanupCrawlers();
  }

  // Print summary
  const totalDuration = Date.now() - startTime;
  printSummary(summaries, totalDuration);
}

function printHelp() {
  console.log(`
Event Crawler CLI

Usage:
  npm run crawl -- [options]

Options:
  -s, --source <source>     Source to crawl (default: all)
                            Available: ${AVAILABLE_SOURCES.join(', ')}
  -p, --max-pages <n>       Maximum pages to crawl per category (default: 5)
  -c, --categories <list>   Comma-separated list of categories
  --dry-run                 Don't save to database
  -v, --verbose             Extra logging
  -h, --help               Show this help

Examples:
  npm run crawl -- --source=contestkorea --dry-run
  npm run crawl -- --source=linkareer --max-pages=3
  npm run crawl -- --source=all --categories=startup,contest
`);
}

function printSummary(summaries: CrawlSummary[], totalDurationMs: number) {
  console.log('\n');
  console.log('='.repeat(60));
  console.log('CRAWL SUMMARY');
  console.log('='.repeat(60));

  let totalCrawled = 0;
  let totalNew = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  for (const summary of summaries) {
    const { source, crawlResult, syncResult } = summary;
    console.log(`\n${source.toUpperCase()}`);
    console.log('-'.repeat(40));
    console.log(`  Crawled:   ${crawlResult.eventsCount} events`);
    console.log(`  Duration:  ${(crawlResult.durationMs / 1000).toFixed(1)}s`);
    console.log(`  Errors:    ${crawlResult.errors.length}`);

    if (syncResult) {
      console.log(`  New:       ${syncResult.newEvents}`);
      console.log(`  Updated:   ${syncResult.updatedEvents}`);
      console.log(`  Expired:   ${syncResult.expiredEvents}`);

      totalNew += syncResult.newEvents;
      totalUpdated += syncResult.updatedEvents;
    }

    totalCrawled += crawlResult.eventsCount;
    totalErrors += crawlResult.errors.length;

    // Print errors if any
    if (crawlResult.errors.length > 0) {
      console.log('\n  Errors:');
      crawlResult.errors.slice(0, 5).forEach(err => {
        console.log(`    - ${err.url || 'unknown'}: ${err.message}`);
      });
      if (crawlResult.errors.length > 5) {
        console.log(`    ... and ${crawlResult.errors.length - 5} more`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('TOTALS');
  console.log('='.repeat(60));
  console.log(`  Sources:      ${summaries.length}`);
  console.log(`  Crawled:      ${totalCrawled} events`);
  console.log(`  New:          ${totalNew} events`);
  console.log(`  Updated:      ${totalUpdated} events`);
  console.log(`  Errors:       ${totalErrors}`);
  console.log(`  Total Time:   ${(totalDurationMs / 1000).toFixed(1)}s`);
  console.log('='.repeat(60));
}

main().catch(error => {
  logger.error('Crawler failed', { error: error.message, stack: error.stack });
  process.exit(1);
});
