/**
 * Discord 슬래시 커맨드 등록 (1회성 셋업)
 *
 * 사용법:
 *   node scripts/register-discord-commands.mjs
 *
 * 필요 환경변수:
 *   DISCORD_BOT_TOKEN, DISCORD_APP_ID
 */

const DISCORD_API = 'https://discord.com/api/v10'
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const APP_ID = process.env.DISCORD_APP_ID

if (!BOT_TOKEN || !APP_ID) {
  console.error('필요 환경변수: DISCORD_BOT_TOKEN, DISCORD_APP_ID')
  process.exit(1)
}

const COMMANDS = [
  {
    name: 'profile',
    description: 'Draft 프로필 링크를 확인합니다',
    type: 1, // CHAT_INPUT
    options: [
      {
        name: 'user',
        description: '프로필을 볼 멤버 (미지정 시 본인)',
        type: 6, // USER
        required: false,
      },
    ],
  },
]

async function main() {
  console.log('슬래시 커맨드 등록 중...\n')

  for (const command of COMMANDS) {
    const res = await fetch(`${DISCORD_API}/applications/${APP_ID}/commands`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`✗ /${command.name} 등록 실패: ${res.status} ${body}`)
      continue
    }

    const data = await res.json()
    console.log(`✓ /${command.name} 등록 완료 (id: ${data.id})`)
  }

  console.log('\n완료! Discord Developer Portal → Interactions Endpoint URL에 설정:')
  console.log('  https://<your-domain>/api/discord/interactions')
}

main().catch(console.error)
