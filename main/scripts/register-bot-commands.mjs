/**
 * Discord 슬래시 커맨드 등록
 *
 * 사용법: DISCORD_BOT_TOKEN=xxx DISCORD_APP_ID=xxx node scripts/register-bot-commands.mjs
 *
 * 한 번만 실행하면 됨 (글로벌 커맨드는 1시간 내 전파)
 * 테스트 시 DISCORD_GUILD_ID를 설정하면 해당 서버에만 즉시 등록
 */

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const APP_ID = process.env.DISCORD_APP_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID; // 테스트용 (선택)

if (!BOT_TOKEN || !APP_ID) {
  console.error('필요: DISCORD_BOT_TOKEN, DISCORD_APP_ID');
  process.exit(1);
}

const commands = [
  {
    name: '마무리',
    description: '오늘 대화 내용을 정리합니다 (할 일, 결정사항, 공유 자료)',
    type: 1, // CHAT_INPUT
  },
  {
    name: '투표',
    description: '투표를 만듭니다',
    type: 1,
    options: [
      {
        name: '주제',
        description: '투표 주제',
        type: 3, // STRING
        required: true,
      },
      {
        name: '옵션1',
        description: '첫 번째 선택지',
        type: 3,
        required: true,
      },
      {
        name: '옵션2',
        description: '두 번째 선택지',
        type: 3,
        required: true,
      },
      {
        name: '옵션3',
        description: '세 번째 선택지 (선택)',
        type: 3,
        required: false,
      },
      {
        name: '옵션4',
        description: '네 번째 선택지 (선택)',
        type: 3,
        required: false,
      },
      {
        name: '옵션5',
        description: '다섯 번째 선택지 (선택)',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: '일정',
    description: '모임 시간을 조율합니다',
    type: 1,
    options: [
      {
        name: '목적',
        description: '모임 목적 (예: 중간발표 준비)',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: '투두',
    description: '할 일을 등록합니다',
    type: 1,
    options: [
      {
        name: '내용',
        description: '할 일 내용',
        type: 3, // STRING
        required: true,
      },
      {
        name: '담당자',
        description: '담당할 사람',
        type: 6, // USER
        required: false,
      },
    ],
  },
  {
    name: '회의시작',
    description: '미완료 할 일 리마인드 + 회의 시작',
    type: 1,
    options: [
      {
        name: '안건',
        description: '오늘 회의 안건 (선택)',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: '한줄',
    description: '한줄 근황을 공유합니다',
    type: 1,
    options: [
      {
        name: '내용',
        description: '오늘 뭐 했는지, 뭐 할 건지',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: '설정',
    description: 'Draft 웹에서 Discord 연동 설정을 변경합니다',
    type: 1,
  },
  {
    name: '도움',
    description: 'Draft 봇 명령어 안내',
    type: 1,
  },
  {
    name: '프로필',
    description: 'Draft 프로필 링크를 확인합니다',
    type: 1,
    options: [
      {
        name: 'user',
        description: '프로필을 볼 멤버 (미지정 시 본인)',
        type: 6, // USER
        required: false,
      },
    ],
  },
  {
    name: '연결',
    description: 'Discord ↔ Draft 계정을 연결합니다',
    type: 1,
  },
];

const baseUrl = GUILD_ID
  ? `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`
  : `https://discord.com/api/v10/applications/${APP_ID}/commands`;

console.log(GUILD_ID ? `서버(${GUILD_ID})에 등록 중...` : '글로벌 등록 중 (전파 ~1시간)...');

const res = await fetch(baseUrl, {
  method: 'PUT', // bulk overwrite
  headers: {
    Authorization: `Bot ${BOT_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(commands),
});

if (!res.ok) {
  console.error('등록 실패:', res.status, await res.text());
  process.exit(1);
}

const registered = await res.json();
console.log(`\n✅ ${registered.length}개 커맨드 등록 완료:`);
registered.forEach((cmd) => {
  console.log(`  /${cmd.name} — ${cmd.description}`);
});
