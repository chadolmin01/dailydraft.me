import { readFileSync } from 'fs'
const env = readFileSync('.env.local','utf-8')
const TOKEN = env.match(/DISCORD_BOT_TOKEN=(.+)/)?.[1]?.trim().replace(/^["']|["']$/g,'')
const res = await fetch('https://discord.com/api/v10/guilds/1492207944530399495/members?limit=20', {
  headers: { Authorization: `Bot ${TOKEN}` }
})
const members = await res.json()
console.log('Discord 서버 멤버:')
for (const m of members) {
  const isBot = m.user.bot ? ' [BOT]' : ''
  console.log(`  ${m.user.id} | ${m.user.global_name || m.user.username}${isBot}`)
}
