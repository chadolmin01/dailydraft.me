/**
 * Discord 서버 데이터 감사 스크립트
 * 봇이 접근 가능한 모든 데이터를 탐색한다.
 */
import { readFileSync } from 'fs'

// .env.local에서 토큰 직접 읽기
const envContent = readFileSync('.env.local', 'utf-8')
const tokenMatch = envContent.match(/DISCORD_BOT_TOKEN=(.+)/)
const TOKEN = tokenMatch?.[1]?.trim()

const DISCORD_API = 'https://discord.com/api/v10'
const GUILD_ID = '1492207944530399495'

async function api(path) {
  const res = await fetch(`${DISCORD_API}${path}`, {
    headers: { Authorization: `Bot ${TOKEN}` },
  })
  if (!res.ok) return { _error: res.status, _body: await res.text() }
  return res.json()
}

async function run() {
  // 1. 봇 & 앱 정보
  const me = await api('/users/@me')
  const app = await api('/oauth2/applications/@me')
  console.log('=== 봇 정보 ===')
  console.log(`id: ${me.id} | username: ${me.username}`)
  console.log(`app_id: ${app.id}`)
  console.log(`flags: ${app.flags} (0x${app.flags?.toString(16)})`)
  console.log(`GUILD_MEMBERS intent: ${Boolean(app.flags & (1 << 15))}`)
  console.log(`MESSAGE_CONTENT intent: ${Boolean(app.flags & (1 << 19))}`)

  // 2. 채널별 메시지 현황
  const channels = await api(`/guilds/${GUILD_ID}/channels`)
  const textChannels = channels.filter(c => c.type === 0)
  console.log(`\n=== 채널별 메시지 현황 (${textChannels.length}개 텍스트) ===`)
  for (const ch of textChannels) {
    const msgs = await api(`/channels/${ch.id}/messages?limit=5`)
    if (msgs._error) {
      console.log(`${ch.name}: 접근불가 (${msgs._error})`)
      continue
    }
    const humanCount = msgs.filter(m => !m.author.bot).length
    console.log(`#${ch.name}: ${msgs.length}개 (사람: ${humanCount})`)
  }

  // 3. 멤버 (Intent 필요)
  const members = await api(`/guilds/${GUILD_ID}/members?limit=100`)
  if (members._error) {
    console.log(`\n멤버 API: ${members._error} — Guild Members Intent 필요`)
  } else {
    console.log(`\n=== 멤버 (${members.length}명) ===`)
    members.forEach(m => console.log(`${m.user.username} | ${m.user.global_name || '-'} | ${m.user.id}`))
  }

  // 4. 메시지 객체 풀 필드
  const sample = await api(`/channels/1492244440327389346/messages?limit=1`)
  if (!sample._error && sample[0]) {
    console.log('\n=== 메시지 객체 필드 ===')
    console.log(Object.keys(sample[0]).join(', '))
    console.log(`type: ${sample[0].type}`)
    console.log(`mentions: ${JSON.stringify(sample[0].mentions)}`)
    console.log(`mention_roles: ${JSON.stringify(sample[0].mention_roles)}`)
    console.log(`reactions: ${JSON.stringify(sample[0].reactions || null)}`)
    console.log(`referenced_message: ${sample[0].referenced_message ? 'yes' : 'no'}`)
    console.log(`thread: ${sample[0].thread ? sample[0].thread.name : 'no'}`)
    console.log(`components: ${JSON.stringify(sample[0].components)}`)
    console.log(`flags: ${sample[0].flags}`)
  }

  // 5. 역할
  const roles = await api(`/guilds/${GUILD_ID}/roles`)
  console.log(`\n=== 역할 (${roles.length}개) ===`)
  roles.forEach(r => console.log(`${r.name} | ${r.id} | 색상: ${r.color}`))

  // 6. Guild 기능 확인
  const guild = await api(`/guilds/${GUILD_ID}`)
  console.log(`\n=== 서버 정보 ===`)
  console.log(`이름: ${guild.name}`)
  console.log(`features: ${JSON.stringify(guild.features)}`)
  console.log(`member_count: ${guild.approximate_member_count || 'N/A'}`)
  console.log(`premium_tier: ${guild.premium_tier}`)
}

run().catch(console.error)
