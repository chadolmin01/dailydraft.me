/**
 * Discord 서버에 역할 자동 생성 + DB 매핑 저장
 *
 * 사용법:
 *   node scripts/setup-discord-roles.mjs <club_id> [--cohorts "1기,2기"]
 *
 * 동작:
 * 1. club_id로 discord_bot_installations에서 guild_id 조회
 * 2. 서버에 직군/기수/운영진 역할 생성
 * 3. discord_role_mappings 테이블에 매핑 저장
 *
 * 이미 동명의 역할이 있으면 재사용 (중복 생성 방지)
 *
 * 필요 환경변수:
 *   DISCORD_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

const DISCORD_API = 'https://discord.com/api/v10'
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!BOT_TOKEN || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('필요 환경변수: DISCORD_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Discord API 헬퍼 ──

async function discordFetch(path, options = {}) {
  const res = await fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (res.status === 204) return null
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Discord API ${res.status}: ${body}`)
  }
  return res.json()
}

async function fetchGuildRoles(guildId) {
  return discordFetch(`/guilds/${guildId}/roles`)
}

async function createGuildRole(guildId, name, color = 0) {
  return discordFetch(`/guilds/${guildId}/roles`, {
    method: 'POST',
    body: JSON.stringify({ name, color, mentionable: true }),
  })
}

// ── 역할 정의 ──

// 직군별 색상 (Discord decimal color)
const POSITION_ROLES = [
  { draftValue: 'developer', name: '개발자', color: 0x3b82f6 },  // blue-500
  { draftValue: 'designer',  name: '디자이너', color: 0xec4899 }, // pink-500
  { draftValue: 'pm',        name: '기획자', color: 0xf59e0b },   // amber-500
  { draftValue: 'marketer',  name: '마케터', color: 0x10b981 },   // emerald-500
  { draftValue: 'data',      name: '데이터', color: 0x8b5cf6 },   // violet-500
]

const CLUB_ROLE = { draftValue: 'admin', name: '운영진', color: 0xef4444 } // red-500

// ── 메인 ──

async function main() {
  const clubId = process.argv[2]
  if (!clubId) {
    console.error('사용법: node scripts/setup-discord-roles.mjs <club_id> [--cohorts "1기,2기"]')
    process.exit(1)
  }

  // 기수 파싱
  const cohortIdx = process.argv.indexOf('--cohorts')
  const cohorts = cohortIdx !== -1
    ? process.argv[cohortIdx + 1]?.split(',').map(s => s.trim()).filter(Boolean) || []
    : ['1기']

  // 1. Guild ID 조회
  const { data: install } = await supabase
    .from('discord_bot_installations')
    .select('discord_guild_id, discord_guild_name')
    .eq('club_id', clubId)
    .maybeSingle()

  if (!install) {
    console.error('이 클럽에 Discord 봇이 설치되지 않았습니다')
    process.exit(1)
  }

  const guildId = install.discord_guild_id
  console.log(`\n서버: ${install.discord_guild_name} (${guildId})`)

  // 2. 기존 역할 조회
  const existingRoles = await fetchGuildRoles(guildId)
  const roleByName = new Map(existingRoles.map(r => [r.name, r]))

  // 3. 역할 생성 또는 재사용
  const mappings = []

  async function ensureRole(mappingType, draftValue, roleName, color) {
    let role = roleByName.get(roleName)
    if (role) {
      console.log(`  ✓ ${roleName} — 기존 역할 재사용 (${role.id})`)
    } else {
      role = await createGuildRole(guildId, roleName, color)
      console.log(`  + ${roleName} — 새로 생성 (${role.id})`)
      // rate limit 방지
      await new Promise(r => setTimeout(r, 500))
    }

    mappings.push({
      club_id: clubId,
      discord_guild_id: guildId,
      mapping_type: mappingType,
      draft_value: draftValue,
      discord_role_id: role.id,
      discord_role_name: roleName,
    })
  }

  console.log('\n직군 역할:')
  for (const pos of POSITION_ROLES) {
    await ensureRole('position', pos.draftValue, pos.name, pos.color)
  }

  console.log('\n기수 역할:')
  for (const cohort of cohorts) {
    await ensureRole('cohort', cohort, cohort, 0x6b7280) // gray-500
  }

  console.log('\n클럽 역할:')
  await ensureRole('club_role', CLUB_ROLE.draftValue, CLUB_ROLE.name, CLUB_ROLE.color)

  // 4. DB에 매핑 저장 (upsert)
  console.log('\nDB 매핑 저장...')
  const { error } = await supabase
    .from('discord_role_mappings')
    .upsert(mappings, {
      onConflict: 'club_id,mapping_type,draft_value',
    })

  if (error) {
    console.error('매핑 저장 실패:', error.message)
    process.exit(1)
  }

  console.log(`\n완료! ${mappings.length}개 역할 매핑 저장됨.`)
  console.log('\n다음 단계:')
  console.log('1. Discord 서버 설정 → 역할 순서에서 Draft 봇 역할을 위 역할들보다 위로 이동')
  console.log('2. 봇에 MANAGE_ROLES, MANAGE_NICKNAMES 권한 확인')
}

main().catch(console.error)
