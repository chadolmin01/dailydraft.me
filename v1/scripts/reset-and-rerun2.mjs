import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = readFileSync('.env.local','utf-8')
function getEnv(key) {
  return env.match(new RegExp(`${key}=(.+)`))?.[1]?.trim().replace(/^["']|["']$/g,'')
}

const admin = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))
const CRON_SECRET = getEnv('CRON_SECRET')

// 1. 기존 초안 삭제
await admin.from('weekly_update_drafts').delete().gte('week_number', 15)
console.log('🗑️  초안 삭제 완료')

// 2. last_fetched_message_id 리셋 (처음부터 다시 가져오도록)
await admin.from('discord_team_channels').update({ last_fetched_message_id: null }).eq('discord_channel_id', '1492363167135957082')
console.log('🔄 last_fetched_message_id 리셋 완료\n')

// 3. 크론 호출
console.log('🚀 크론 호출 중...\n')
const res = await fetch('http://localhost:3000/api/cron/ghostwriter-generate', {
  method: 'POST',
  headers: { Authorization: `Bearer ${CRON_SECRET}` },
})

const body = await res.json()
console.log(`HTTP ${res.status}`)
console.log(JSON.stringify(body, null, 2))

// 4. 결과 확인
const { data: draft } = await admin
  .from('weekly_update_drafts')
  .select('id, title, status, content')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

if (draft) {
  console.log(`\n✅ 초안 생성됨: ${draft.title} (${draft.status})`)
  console.log(`   페이지: http://localhost:3000/drafts/${draft.id}`)
  console.log('\n📱 Discord DM을 확인하세요!')
}
