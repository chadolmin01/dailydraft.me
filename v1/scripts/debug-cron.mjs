import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = readFileSync('.env.local','utf-8')
function getEnv(key) {
  return env.match(new RegExp(`${key}=(.+)`))?.[1]?.trim().replace(/^["']|["']$/g,'')
}

const admin = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))
const TOKEN = getEnv('DISCORD_BOT_TOKEN')

// 1. team channel 상태
const { data: ch } = await admin.from('discord_team_channels').select('*').eq('discord_channel_id', '1492363167135957082').single()
console.log('Team channel:', JSON.stringify(ch, null, 2))

// 2. club_ghostwriter_settings 확인
const { data: settings } = await admin.from('club_ghostwriter_settings').select('*').eq('club_id', ch.club_id).maybeSingle()
console.log('\nSettings:', settings)

// 3. Discord에서 직접 메시지 가져오기
const after = ch.last_fetched_message_id ? `&after=${ch.last_fetched_message_id}` : ''
const res = await fetch(`https://discord.com/api/v10/channels/1492363167135957082/messages?limit=100${after}`, {
  headers: { Authorization: `Bot ${TOKEN}` }
})
const msgs = await res.json()
const human = msgs.filter(m => m.author.bot !== true && (m.content?.trim().length > 0 || m.attachments?.length > 0))
console.log(`\nDiscord 메시지: 전체=${msgs.length}, 사람=${human.length}`)
console.log(`last_fetched_message_id: ${ch.last_fetched_message_id}`)
if (human.length > 0) {
  for (const m of human) {
    console.log(`  ${m.author.global_name || m.author.username}: ${(m.content || '').slice(0,60)}`)
  }
}
