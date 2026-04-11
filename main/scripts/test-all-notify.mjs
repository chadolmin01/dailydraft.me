/**
 * 전체 알림 테스트 — DM + 팀 채널 + 운영 대시보드 채널
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = readFileSync('.env.local', 'utf-8')
function getEnv(key) {
  return env.match(new RegExp(`${key}=(.+)`))?.[1]?.trim().replace(/^["']|["']$/g, '')
}

const TOKEN = getEnv('DISCORD_BOT_TOKEN')
const API = 'https://discord.com/api/v10'
const OPS_CHANNEL_ID = getEnv('DISCORD_OPS_DASHBOARD_CHANNEL_ID')
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

// 최근 초안
const { data: draft } = await admin.from('weekly_update_drafts')
  .select('id, title, content, update_type, week_number, target_user_id, opportunity_id')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

console.log(`📋 초안: ${draft.title} (${draft.week_number}주차)`)

// 프로젝트 제목
const { data: opp } = await admin.from('opportunities')
  .select('title')
  .eq('id', draft.opportunity_id)
  .single()
const projectTitle = opp?.title || 'FoodFinder'

let summary = ''
try { summary = JSON.parse(draft.content).summary || '' } catch { summary = draft.content?.slice(0, 500) || '' }

const TYPE_LABELS = { ideation: '💡 고민', design: '🎨 설계', development: '🛠️ 구현', launch: '🚀 런칭', general: '📝 일반' }
const typeLabel = TYPE_LABELS[draft.update_type] || '📝'

// ── 1. 팀 채널 ──
const { data: teamCh } = await admin.from('discord_team_channels')
  .select('discord_channel_id')
  .eq('opportunity_id', draft.opportunity_id)
  .maybeSingle()

if (teamCh?.discord_channel_id) {
  console.log('\n📢 팀 채널 알림...')
  const mainMsg = await discord(`/channels/${teamCh.discord_channel_id}/messages`, {
    content: `📝 **${draft.week_number}주차 주간 업데이트 초안**이 생성됐습니다. 팀장의 승인을 기다리고 있습니다.`,
  })
  const thread = await discord(`/channels/${teamCh.discord_channel_id}/messages/${mainMsg.id}/threads`, {
    name: `${draft.week_number}주차 업데이트 초안`, auto_archive_duration: 10080,
  })
  const baseUrl = getEnv('NEXT_PUBLIC_BASE_URL') || 'http://localhost:3000'
  await discord(`/channels/${thread.id}/messages`, {
    content: [`**${draft.title}**`, typeLabel, '', summary.slice(0, 500), '', `🔗 [Draft에서 확인하고 승인하기](${baseUrl}/drafts/${draft.id})`].join('\n'),
  })
  console.log('✅ 팀 채널 완료')
}

// ── 2. 운영 대시보드 채널 ──
if (OPS_CHANNEL_ID) {
  console.log('\n👔 운영 대시보드 채널 알림...')
  await discord(`/channels/${OPS_CHANNEL_ID}/messages`, {
    content: `📝 **${projectTitle}** — ${draft.week_number}주차 초안 생성 완료 (${typeLabel}). 팀장 승인 대기 중.`,
  })
  console.log('✅ 운영 채널 완료')
} else {
  console.log('⚠️ DISCORD_OPS_DASHBOARD_CHANNEL_ID 미설정')
}

// ── 3. DM ──
const { data: profile } = await admin.from('profiles')
  .select('discord_user_id')
  .eq('user_id', draft.target_user_id)
  .single()

if (profile?.discord_user_id) {
  console.log('\n📱 DM 발송...')
  const dmCh = await discord('/users/@me/channels', { recipient_id: profile.discord_user_id })
  const COLORS = { ideation: 0xf59e0b, design: 0x3b82f6, development: 0x22c55e, launch: 0xa855f7, general: 0x6b7280 }
  const baseUrl = getEnv('NEXT_PUBLIC_BASE_URL') || 'http://localhost:3000'
  await discord(`/channels/${dmCh.id}/messages`, {
    embeds: [{
      title: `📝 ${draft.week_number}주차 업데이트 초안`,
      description: [`**${projectTitle}**의 주간 업데이트 초안이 준비됐습니다.`, '', `> **${draft.title}**`, `> ${summary.slice(0, 500)}`].join('\n'),
      color: COLORS[draft.update_type] || 0x6366f1,
      fields: [{ name: '유형', value: typeLabel, inline: true }, { name: '주차', value: `${draft.week_number}주차`, inline: true }],
      footer: { text: 'Draft • 30초만 확인해주세요' },
    }],
    components: [{ type: 1, components: [{ type: 2, style: 5, label: '✅ 확인하고 승인하기', url: `${baseUrl}/drafts/${draft.id}` }] }],
  })
  console.log('✅ DM 완료')
}

console.log('\n🎉 전체 완료! Discord 3곳 확인하세요: DM / 팀 채널 / 운영 대시보드')
