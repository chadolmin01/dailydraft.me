/**
 * FLIP 서버 닉네임 일괄 동기화
 * Draft 프로필 닉네임 → Discord 서버 닉네임
 *
 * 사용법: node scripts/sync-nicknames.mjs
 * 환경변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DISCORD_BOT_TOKEN
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = '1492207944530399495'; // FLIP

if (!SUPABASE_URL || !SUPABASE_KEY || !BOT_TOKEN) {
  console.error('필요: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DISCORD_BOT_TOKEN');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const { data: profiles } = await supabase
  .from('profiles')
  .select('nickname, discord_user_id')
  .not('discord_user_id', 'is', null);

if (!profiles || profiles.length === 0) {
  console.log('Discord 연결된 프로필 없음');
  process.exit(0);
}

console.log(`Discord 연결 프로필: ${profiles.length}명\n`);

let synced = 0, skipped = 0, failed = 0;

for (const p of profiles) {
  const nick = p.nickname || '멤버';
  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${p.discord_user_id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nick }),
      }
    );

    if (res.status === 200 || res.status === 204) {
      console.log(`  ✅ ${p.discord_user_id} → ${nick}`);
      synced++;
    } else if (res.status === 404) {
      console.log(`  ⏭️  ${nick} — 서버에 없음`);
      skipped++;
    } else {
      const body = await res.text();
      console.log(`  ❌ ${nick} — ${res.status}: ${body}`);
      failed++;
    }

    // rate limit 방지
    await new Promise(r => setTimeout(r, 1000));
  } catch (e) {
    console.log(`  ❌ ${nick} — ${e.message}`);
    failed++;
  }
}

console.log(`\n결과: 성공 ${synced} / 스킵 ${skipped} / 실패 ${failed}`);
