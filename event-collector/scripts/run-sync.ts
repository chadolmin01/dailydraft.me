/**
 * 전체 동기화 실행 스크립트
 *
 * 사용법:
 *   npx tsx scripts/run-sync.ts
 *   npx tsx scripts/run-sync.ts --no-ai
 */

import 'dotenv/config';
import { SyncOrchestrator } from '../src/sync/index.js';

async function main() {
  const args = process.argv.slice(2);
  const noAI = args.includes('--no-ai');

  console.log('Starting event synchronization...');
  console.log(`AI processing: ${noAI ? 'disabled' : 'enabled'}`);
  console.log('');

  const orchestrator = new SyncOrchestrator({
    enableAI: !noAI,
  });

  try {
    const result = await orchestrator.syncAll();

    console.log('\n=== SYNC RESULT ===');
    console.log(JSON.stringify(result, null, 2));

    // 소스별 요약
    console.log('\n=== SUMMARY BY SOURCE ===');
    for (const source of result.sources) {
      console.log(`\n[${source.source}]`);
      console.log(`  New: ${source.new_events}`);
      console.log(`  Skipped: ${source.skipped_events}`);
      console.log(`  Errors: ${source.errors.length}`);
      if (source.errors.length > 0) {
        console.log('  Error details:');
        for (const err of source.errors.slice(0, 5)) {
          console.log(`    - ${err.error}`);
        }
      }
    }

    process.exit(result.total_errors > 0 ? 1 : 0);
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

main();
