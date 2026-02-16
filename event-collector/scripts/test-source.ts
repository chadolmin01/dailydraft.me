/**
 * 개별 소스 테스트 스크립트
 *
 * 사용법:
 *   npx tsx scripts/test-source.ts devpost
 *   npx tsx scripts/test-source.ts meetup
 */

import 'dotenv/config';
import { DevpostCollector } from '../src/sources/devpost/index.js';
import type { BaseCollector } from '../src/sources/base-collector.js';

async function main() {
  const args = process.argv.slice(2);
  const sourceName = args[0]?.toLowerCase();

  if (!sourceName) {
    console.log('Usage: npx tsx scripts/test-source.ts <source>');
    console.log('Available sources: devpost');
    process.exit(1);
  }

  let collector: BaseCollector;

  switch (sourceName) {
    case 'devpost':
      collector = new DevpostCollector({ maxPages: 2 });
      break;
    default:
      console.error(`Unknown source: ${sourceName}`);
      console.log('Available sources: devpost');
      process.exit(1);
  }

  console.log(`Testing ${sourceName} collector...`);
  console.log('');

  try {
    // 가용성 확인
    console.log('Checking availability...');
    const isAvailable = await collector.checkAvailability();
    console.log(`Available: ${isAvailable}`);

    if (!isAvailable) {
      console.error('Source is not available. Check your credentials.');
      process.exit(1);
    }

    // 이벤트 수집
    console.log('\nCollecting events...');
    const events = await collector.collect();

    console.log(`\nCollected ${events.length} events:`);
    console.log('');

    // 샘플 출력
    for (const event of events.slice(0, 5)) {
      console.log('---');
      console.log(`Title: ${event.title}`);
      console.log(`Organizer: ${event.organizer}`);
      console.log(`Type: ${event.event_type}`);
      console.log(`Location: ${event.location}`);
      console.log(`End Date: ${event.registration_end_date}`);
      console.log(`URL: ${event.registration_url}`);
      if (event.prize_amount) {
        console.log(`Prize: ${event.prize_amount.toLocaleString()}원`);
      }
    }

    if (events.length > 5) {
      console.log(`\n... and ${events.length - 5} more events`);
    }

    // 에러 확인
    const errors = collector.getAndClearErrors();
    if (errors.length > 0) {
      console.log('\nErrors:');
      for (const err of errors) {
        console.log(`  - ${err.error}`);
      }
    }

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

main();
