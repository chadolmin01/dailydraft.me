import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = readFileSync('.env.local','utf-8')
function getEnv(key) {
  return env.match(new RegExp(`${key}=(.+)`))?.[1]?.trim().replace(/^["']|["']$/g,'')
}

const admin = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))
const CRON_SECRET = getEnv('CRON_SECRET')
const CHANNEL_ID = '1492363167135957082'
const GUILD_ID = '1492207944530399495'

// 1. 기존 초안 전부 삭제
await admin.from('weekly_update_drafts').delete().gte('week_number', 1)
console.log('🗑️  초안 전부 삭제')

// 2. 클럽 + opportunity + 매핑 확인
const { data: club } = await admin.from('clubs').select('id').limit(1).single()
const { data: opp } = await admin.from('opportunities').select('id, creator_id').limit(1).single()
console.log(`클럽: ${club.id}`)
console.log(`Opportunity: ${opp.id} (creator: ${opp.creator_id})`)

// 3. team channel 매핑 확인/재생성
const { data: existing } = await admin.from('discord_team_channels').select('id').eq('discord_channel_id', CHANNEL_ID).maybeSingle()
if (existing) {
  // last_fetched_message_id 리셋
  await admin.from('discord_team_channels').update({ last_fetched_message_id: null }).eq('id', existing.id)
  console.log('✅ Team channel 존재, last_fetched_message_id 리셋')
} else {
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1 })
  await admin.from('discord_team_channels').insert({
    club_id: club.id,
    opportunity_id: opp.id,
    discord_channel_id: CHANNEL_ID,
    discord_channel_name: '🍔-foodfinder-팀채널',
    created_by: users[0].id,
  })
  console.log('✅ Team channel 매핑 생성')
}

// 4. bot installation 확인
const { data: botInst } = await admin.from('discord_bot_installations').select('id').eq('club_id', club.id).maybeSingle()
if (!botInst) {
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1 })
  await admin.from('discord_bot_installations').insert({
    club_id: club.id, discord_guild_id: GUILD_ID, discord_guild_name: 'Draft 테스트', installed_by: users[0].id,
  })
  console.log('✅ Bot installation 생성')
} else {
  console.log('✅ Bot installation 존재')
}

// 5. discord_user_id 확인
const { data: profile } = await admin.from('profiles').select('discord_user_id').eq('user_id', opp.creator_id).single()
console.log(`Discord user ID: ${profile?.discord_user_id || '없음'}`)

// 6. 크론 실행
console.log('\n🚀 크론 실행...\n')
const res = await fetch('http://localhost:3000/api/cron/ghostwriter-generate', {
  method: 'POST',
  headers: { Authorization: `Bearer ${CRON_SECRET}` },
})
const body = await res.json()
console.log(`HTTP ${res.status}`)
console.log(JSON.stringify(body, null, 2))

// 7. 결과
const { data: draft } = await admin.from('weekly_update_drafts')
  .select('id, title, status')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()

if (draft) {
  console.log(`\n✅ 초안: ${draft.title} (${draft.status})`)
  console.log(`   http://localhost:3000/drafts/${draft.id}`)
  console.log('\n📱 Discord DM 확인하세요!')
} else {
  console.log('\n❌ 초안 미생성')
}
