import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = readFileSync('.env.local','utf-8')
function getEnv(key) {
  return env.match(new RegExp(`${key}=(.+)`))?.[1]?.trim().replace(/^["']|["']$/g,'')
}

const TOKEN = getEnv('DISCORD_BOT_TOKEN')
const admin = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))

// 최근 초안 가져오기
const { data: draft } = await admin.from('weekly_update_drafts')
  .select('id, title, content, update_type, week_number, target_user_id')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

const parsed = JSON.parse(draft.content)
const summary = parsed.summary || ''

// discord_user_id
const { data: profile } = await admin.from('profiles').select('discord_user_id').eq('user_id', draft.target_user_id).single()

// DM 발송
const dmChRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
  method: 'POST',
  headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ recipient_id: profile.discord_user_id }),
})
const dmCh = await dmChRes.json()

const dmRes = await fetch(`https://discord.com/api/v10/channels/${dmCh.id}/messages`, {
  method: 'POST',
  headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    embeds: [{
      title: `📝 ${draft.week_number}주차 업데이트 초안`,
      description: [
        '**FoodFinder**의 주간 업데이트 초안이 준비됐습니다.',
        '',
        `> **${draft.title}**`,
        `> ${summary.slice(0, 500)}${summary.length > 500 ? '...' : ''}`,
      ].join('\n'),
      color: 0x22c55e,
      fields: [
        { name: '유형', value: draft.update_type, inline: true },
        { name: '주차', value: `${draft.week_number}주차`, inline: true },
      ],
      footer: { text: 'Draft • 30초만 확인해주세요' },
    }],
    components: [{
      type: 1,
      components: [{
        type: 2, style: 5,
        label: '✅ 확인하고 승인하기',
        url: `http://localhost:3000/drafts/${draft.id}`,
      }],
    }],
  }),
})

if (dmRes.ok) {
  console.log('✅ DM 재발송 완료!')
  console.log(`   summary 길이: ${summary.length}자 (전문 포함)`)
} else {
  console.log('❌ 실패:', await dmRes.text())
}
