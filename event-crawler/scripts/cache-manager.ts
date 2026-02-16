#!/usr/bin/env tsx
/**
 * Cache Manager CLI
 *
 * Usage:
 *   npm run cache:stats       - 캐시 통계 보기
 *   npm run cache:clear       - 전체 캐시 삭제
 *   npm run cache:clear:urls  - URL 캐시만 삭제
 */

import 'dotenv/config';
import { parseArgs } from 'node:util';
import { cacheManager } from '../src/utils/cache.js';

async function main() {
  const { values } = parseArgs({
    options: {
      action: {
        type: 'string',
        short: 'a',
        default: 'stats',
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

  const action = values.action || 'stats';

  // Wait for Redis connection
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (!cacheManager.isAvailable()) {
    console.error('Redis not available. Check REDIS_URL in .env');
    process.exit(1);
  }

  switch (action) {
    case 'stats':
      await showStats();
      break;
    case 'clear':
      await clearCache();
      break;
    case 'clear:urls':
      await clearCache('url');
      break;
    case 'clear:search':
      await clearCache('search');
      break;
    case 'clear:events':
      await clearCache('event');
      break;
    default:
      console.error(`Unknown action: ${action}`);
      printHelp();
      process.exit(1);
  }

  await cacheManager.disconnect();
}

async function showStats() {
  console.log('\n=== Cache Statistics ===\n');

  const stats = await cacheManager.getStats();
  if (!stats) {
    console.log('Failed to get stats');
    return;
  }

  console.log(`  URL Cache:     ${stats.urls} entries (TTL: 6h)`);
  console.log(`  Search Cache:  ${stats.searches} entries (TTL: 1h)`);
  console.log(`  Event Cache:   ${stats.events} entries (TTL: 24h)`);
  console.log(`  --------------------------------`);
  console.log(`  Total:         ${stats.urls + stats.searches + stats.events} entries`);
  console.log('');
}

async function clearCache(prefix?: 'url' | 'search' | 'event') {
  const target = prefix ? `${prefix} cache` : 'all caches';
  console.log(`\nClearing ${target}...`);

  const deleted = await cacheManager.clearCache(prefix);
  console.log(`Deleted ${deleted} entries\n`);
}

function printHelp() {
  console.log(`
Cache Manager CLI

Usage:
  npm run cache -- --action=<action>

Actions:
  stats         Show cache statistics (default)
  clear         Clear all caches
  clear:urls    Clear URL cache only
  clear:search  Clear search result cache only
  clear:events  Clear event cache only

Examples:
  npm run cache                      # Show stats
  npm run cache -- --action=clear    # Clear all
  npm run cache -- -a clear:urls     # Clear URL cache
`);
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
