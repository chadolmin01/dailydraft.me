/**
 * Discord 슬래시 커맨드 등록
 *
 * 사용법: DISCORD_BOT_TOKEN=xxx DISCORD_APP_ID=xxx node scripts/register-bot-commands.mjs
 *
 * 한 번만 실행하면 됨 (글로벌 커맨드는 1시간 내 전파)
 * 테스트 시 DISCORD_GUILD_ID를 설정하면 해당 서버에만 즉시 등록
 *
 * 2026-04-18: 슬래시 커맨드 13→3개로 축소 (@Draft 멘션 런처 + Modal 전환).
 * 나머지 10개는 ARCHIVED_COMMANDS로 보존 — DISCORD_ENABLE_LEGACY_COMMANDS=true 로 복원 가능.
 */

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const APP_ID = process.env.DISCORD_APP_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID; // 테스트용 (선택)
const ENABLE_LEGACY = process.env.DISCORD_ENABLE_LEGACY_COMMANDS === 'true';

if (!BOT_TOKEN || !APP_ID) {
  console.error('필요: DISCORD_BOT_TOKEN, DISCORD_APP_ID');
  process.exit(1);
}

// 현역 커맨드 — 파워유저가 자주 쓰거나 초기 세팅 1회성
const commands = [
  {
    name: '마무리',
    description: '오늘 대화 내용을 정리합니다 (할 일, 결정사항, 공유 자료)',
    type: 1, // CHAT_INPUT
  },
  {
    name: '개발현황',
    description: '오늘의 개발 활동 로그를 확인합니다',
    type: 1,
  },
  {
    name: 'github',
    description: 'GitHub 레포 연동 관리',
    type: 1,
    options: [
      {
        type: 1, // SUB_COMMAND
        name: '연결',
        description: 'GitHub 레포를 이 클럽에 연결합니다',
        options: [
          {
            type: 3, // STRING
            name: 'repo',
            description: '레포 이름 (예: owner/repo-name)',
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: '목록',
        description: '연결된 GitHub 레포 목록',
      },
      {
        type: 1,
        name: '해제',
        description: 'GitHub 레포 연결을 해제합니다',
        options: [
          {
            type: 3,
            name: 'repo',
            description: '해제할 레포 이름 (예: owner/repo-name)',
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: '내계정',
        description: 'GitHub 계정을 Draft 프로필에 연결합니다',
        options: [
          {
            type: 3,
            name: 'username',
            description: 'GitHub 사용자명',
            required: true,
          },
        ],
      },
    ],
  },
];

// 보존 — 멘션 런처 + Modal로 대체됨. 핸들러 함수는 interactions/route.ts에 그대로 남아 있어 롤백 시 즉시 복구 가능.
// DISCORD_ENABLE_LEGACY_COMMANDS=true 로 다시 등록 가능.
const ARCHIVED_COMMANDS = [
  {
    name: '투표',
    description: '투표를 만듭니다',
    type: 1,
    options: [
      { name: '주제', description: '투표 주제', type: 3, required: true },
      { name: '옵션1', description: '첫 번째 선택지', type: 3, required: true },
      { name: '옵션2', description: '두 번째 선택지', type: 3, required: true },
      { name: '옵션3', description: '세 번째 선택지 (선택)', type: 3, required: false },
      { name: '옵션4', description: '네 번째 선택지 (선택)', type: 3, required: false },
      { name: '옵션5', description: '다섯 번째 선택지 (선택)', type: 3, required: false },
    ],
  },
  {
    name: '일정',
    description: '모임 시간을 조율합니다',
    type: 1,
    options: [
      { name: '목적', description: '모임 목적 (예: 중간발표 준비)', type: 3, required: false },
    ],
  },
  {
    name: '투두',
    description: '할 일을 등록합니다',
    type: 1,
    options: [
      { name: '내용', description: '할 일 내용', type: 3, required: true },
      { name: '담당자', description: '담당할 사람', type: 6, required: false },
    ],
  },
  {
    name: '회의시작',
    description: '미완료 할 일 리마인드 + 회의 시작',
    type: 1,
    options: [
      { name: '안건', description: '오늘 회의 안건 (선택)', type: 3, required: false },
    ],
  },
  {
    name: '한줄',
    description: '한줄 근황을 공유합니다',
    type: 1,
    options: [
      { name: '내용', description: '오늘 뭐 했는지, 뭐 할 건지', type: 3, required: true },
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
      { name: 'user', description: '프로필을 볼 멤버 (미지정 시 본인)', type: 6, required: false },
    ],
  },
  {
    name: '연결',
    description: 'Discord ↔ Draft 계정을 연결합니다',
    type: 1,
  },
];

const finalCommands = ENABLE_LEGACY ? [...commands, ...ARCHIVED_COMMANDS] : commands;

const baseUrl = GUILD_ID
  ? `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`
  : `https://discord.com/api/v10/applications/${APP_ID}/commands`;

console.log(
  `${GUILD_ID ? `서버(${GUILD_ID})` : '글로벌'}에 등록 중${
    ENABLE_LEGACY ? ' (레거시 포함)' : ' (현역 3개)'
  }...`,
);

const res = await fetch(baseUrl, {
  method: 'PUT', // bulk overwrite
  headers: {
    Authorization: `Bot ${BOT_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(finalCommands),
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
