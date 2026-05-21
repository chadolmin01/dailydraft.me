const token = process.env.DISCORD_BOT_TOKEN;
const guildId = '1492207944530399495';

const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
  headers: { Authorization: `Bot ${token}` }
});
const channels = await res.json();

const cats = channels.filter(c => c.type === 4).sort((a,b) => a.position - b.position);
const text = channels.filter(c => c.type === 0);
const voice = channels.filter(c => c.type === 2);
const forum = channels.filter(c => c.type === 15);

console.log('=== FLIP 서버 채널 구조 ===\n');

for (const cat of cats) {
  console.log('📁 ' + cat.name);
  const children = [...text, ...voice, ...forum]
    .filter(c => c.parent_id === cat.id)
    .sort((a,b) => a.position - b.position);
  for (const ch of children) {
    const icon = ch.type === 0 ? '#' : ch.type === 2 ? '🔊' : '📋';
    console.log(`  ${icon} ${ch.name} (ID: ${ch.id})`);
  }
  console.log();
}

const orphans = [...text, ...voice, ...forum].filter(c => c.parent_id === null || c.parent_id === undefined);
if (orphans.length > 0) {
  console.log('📁 (카테고리 없음)');
  orphans.forEach(ch => {
    const icon = ch.type === 0 ? '#' : ch.type === 2 ? '🔊' : '📋';
    console.log(`  ${icon} ${ch.name} (ID: ${ch.id})`);
  });
}

console.log(`\n총: 텍스트 ${text.length}개, 음성 ${voice.length}개, 포럼 ${forum.length}개`);
