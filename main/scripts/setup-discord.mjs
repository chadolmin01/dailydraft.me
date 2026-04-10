import { readFileSync } from 'fs'
const envContent = readFileSync('.env.local', 'utf-8')
const tokenMatch = envContent.match(/DISCORD_BOT_TOKEN=(.+)/)
const TOKEN = ;
const GUILD = '1492207944530399495';
const API = 'https://discord.com/api/v10';

async function api(path, body) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { Authorization: TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('ERROR:', path, JSON.stringify(data));
    return null;
  }
  return data;
}

async function run() {
  // 1. 역할 생성
  console.log('=== 역할 생성 ===');
  const r1 = await api('/guilds/' + GUILD + '/roles', { name: '운영진', color: 0xe74c3c, hoist: true, mentionable: true });
  if (r1) console.log('✅ 운영진:', r1.id);
  const r2 = await api('/guilds/' + GUILD + '/roles', { name: '팀장', color: 0x3498db, hoist: true, mentionable: true });
  if (r2) console.log('✅ 팀장:', r2.id);
  const r3 = await api('/guilds/' + GUILD + '/roles', { name: '1기 멤버', color: 0x2ecc71, hoist: true, mentionable: true });
  if (r3) console.log('✅ 1기 멤버:', r3.id);

  if (!r1 || !r2 || !r3) {
    console.log('역할 생성 실패 — 중단');
    return;
  }

  // 2. 카테고리 생성 (type 4)
  console.log('\n=== 카테고리 생성 ===');
  const cat1 = await api('/guilds/' + GUILD + '/channels', { name: '📋 운영', type: 4 });
  if (cat1) console.log('✅ 운영 카테고리:', cat1.id);
  const cat2 = await api('/guilds/' + GUILD + '/channels', { name: '💡 프로젝트', type: 4 });
  if (cat2) console.log('✅ 프로젝트 카테고리:', cat2.id);
  const cat3 = await api('/guilds/' + GUILD + '/channels', { name: '🗣️ 자유', type: 4 });
  if (cat3) console.log('✅ 자유 카테고리:', cat3.id);
  const cat4 = await api('/guilds/' + GUILD + '/channels', { name: '🔊 음성', type: 4 });
  if (cat4) console.log('✅ 음성 카테고리:', cat4.id);

  if (!cat1 || !cat2 || !cat3 || !cat4) {
    console.log('카테고리 생성 실패 — 중단');
    return;
  }

  const everyoneId = GUILD;

  // 3. 채널 생성
  console.log('\n=== 채널 생성 ===');

  // 공지사항 - 운영진만 쓰기
  const ch1 = await api('/guilds/' + GUILD + '/channels', {
    name: '공지사항', type: 0, parent_id: cat1.id,
    permission_overwrites: [
      { id: everyoneId, type: 0, deny: '2048' },
      { id: r1.id, type: 0, allow: '2048' },
    ]
  });
  if (ch1) console.log('✅ #공지사항:', ch1.id, '(운영진만 작성)');

  // 일정
  const ch2 = await api('/guilds/' + GUILD + '/channels', { name: '일정', type: 0, parent_id: cat1.id });
  if (ch2) console.log('✅ #일정:', ch2.id);

  // 운영진 전용 - 운영진만 볼 수 있음
  const ch3 = await api('/guilds/' + GUILD + '/channels', {
    name: '운영진-전용', type: 0, parent_id: cat1.id,
    permission_overwrites: [
      { id: everyoneId, type: 0, deny: '1024' },
      { id: r1.id, type: 0, allow: '1024' },
    ]
  });
  if (ch3) console.log('✅ #운영진-전용:', ch3.id, '(운영진만 접근)');

  // 주간 업데이트
  const ch4 = await api('/guilds/' + GUILD + '/channels', { name: '주간-업데이트', type: 0, parent_id: cat2.id });
  if (ch4) console.log('✅ #주간-업데이트:', ch4.id, '(Draft 웹훅 연동)');

  // 잡담
  const ch5 = await api('/guilds/' + GUILD + '/channels', { name: '잡담', type: 0, parent_id: cat3.id });
  if (ch5) console.log('✅ #잡담:', ch5.id);

  // 질문-답변
  const ch6 = await api('/guilds/' + GUILD + '/channels', { name: '질문-답변', type: 0, parent_id: cat3.id });
  if (ch6) console.log('✅ #질문-답변:', ch6.id);

  // 음성 채널 (type 2)
  const vc1 = await api('/guilds/' + GUILD + '/channels', { name: '회의실', type: 2, parent_id: cat4.id });
  if (vc1) console.log('✅ #회의실(음성):', vc1.id);

  console.log('\n🎉 FLIP 서버 세팅 완료!');
}

run().catch(console.error);
