/**
 * 팀 채널 알림 테스트 — DM + 팀 채널 메시지 + 스레드
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = readFileSync('.env.local', 'utf-8')
function getEnv(key) {
  return env.match(new RegExp(`${key}=(.+)`))?.[1]?.trim().replace(/^["']|["']$/g, '')
}

const TOKEN = getEnv('DISCORD_BOT_TOKEN')
const API = 'https://discord.com/api/v10'
const admin = createClient(
  getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY')
)

async function discord(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Discord ${res.status}: ${text}`)
  }
  return res.json()
}

// 최근 초안 가져오기
const { data: draft, error: draftErr } = await admin.from('weekly_update_drafts')
  .select('id, title, content, update_type, week_number, target_user_id, opportunity_id')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

if (draftErr || !draft) {
  console.log('❌ 초안 없음:', draftErr?.message)
  process.exit(1)
}

console.log(`📋 초안: ${draft.title} (${draft.week_number}주차)`)

// 팀 채널 ID 조회
const { data: teamCh } = await admin.from('discord_team_channels')
  .select('discord_channel_id')
  .eq('opportunity_id', draft.opportunity_id)
  .maybeSingle()

if (!teamCh?.discord_channel_id) {
  console.log('❌ 팀 채널 매핑 없음')
  process.exit(1)
}

const channelId = teamCh.discord_channel_id
console.log(`📢 팀 채널: ${channelId}`)

// summary 추출
let summary = ''
try {
  const parsed = JSON.parse(draft.content)
  summary = parsed.summary || ''
} catch {
  summary = draft.content?.slice(0, 500) || ''
}

const TYPE_LABELS = {
  ideation: '💡 고민', design: '🎨 설계', development: '🛠️ 구현',
  launch: '🚀 런칭', general: '📝 일반',
}
const typeLabel = TYPE_LABELS[draft.update_type] || '📝'
const baseUrl = getEnv('NEXT_PUBLIC_BASE_URL') || 'http://localhost:3000'
const approveUrl = `${baseUrl}/drafts/${draft.id}`

// 1. 팀 채널에 메인 메시지
console.log('\n📨 팀 채널 메시지 발송...')
const mainMsg = await discord(`/channels/${channelId}/messages`, {
  content: `📝 **${draft.week_number}주차 주간 업데이트 초안**이 생성됐습니다. 팀장의 승인을 기다리고 있습니다.`,
})
console.log(`✅ 메인 메시지: ${mainMsg.id}`)

// 2. 스레드 생성
const thread = await discord(`/channels/${channelId}/messages/${mainMsg.id}/threads`, {
  name: `${draft.week_number}주차 업데이트 초안`,
  auto_archive_duration: 10080,
})
console.log(`✅ 스레드 생성: ${thread.id} (${thread.name})`)

// 3. 스레드에 상세 내용
await discord(`/channels/${thread.id}/messages`, {
  content: [
    `**${draft.title}**`,
    `${typeLabel}`,
    '',
    summary.slice(0, 500) + (summary.length > 500 ? '...' : ''),
    '',
    `🔗 [Draft에서 확인하고 승인하기](${approveUrl})`,
  ].join('\n'),
})
console.log('✅ 스레드 상세 내용 게시 완료')

// 4. DM도 함께 발송
const { data: profile } = await admin.from('profiles')
  .select('discord_user_id')
  .eq('user_id', draft.target_user_id)
  .single()

if (profile?.discord_user_id) {
  console.log(`\n📱 DM 발송 중... (${profile.discord_user_id})`)
  const dmCh = await discord('/users/@me/channels', { recipient_id: profile.discord_user_id })

  const COLORS = { ideation: 0xf59e0b, design: 0x3b82f6, development: 0x22c55e, launch: 0xa855f7, general: 0x6b7280 }

  await discord(`/channels/${dmCh.id}/messages`, {
    embeds: [{
      title: `📝 ${draft.week_number}주차 업데이트 초안`,
      description: [
        '**FoodFinder**의 주간 업데이트 초안이 준비됐습니다.',
        '',
        `> **${draft.title}**`,
        `> ${summary.slice(0, 500)}${summary.length > 500 ? '...' : ''}`,
      ].join('\n'),
      color: COLORS[draft.update_type] || 0x6366f1,
      fields: [
        { name: '유형', value: typeLabel, inline: true },
        { name: '주차', value: `${draft.week_number}주차`, inline: true },
      ],
      footer: { text: 'Draft • 30초만 확인해주세요' },
    }],
    components: [{
      type: 1,
      components: [{
        type: 2, style: 5,
        label: '✅ 확인하고 승인하기',
        url: approveUrl,
      }],
    }],
  })
  console.log('✅ DM 발송 완료!')
} else {
  console.log('⚠️ discord_user_id 없음 — DM 스킵')
}

console.log('\n🎉 전체 완료! Discord에서 확인하세요.')
