#!/usr/bin/env node
/**
 * RLS 마이그레이션 적용 후 UI 영향 예측.
 * 공개 프로필 비율·멤버 구조 등을 보고 "얼마나 많이 안 보이게 될지" 추정.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envText = readFileSync(resolve(__dirname, '../.env.local.audit'), 'utf8')
const env = Object.fromEntries(
  envText.split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => {
    const i = l.indexOf('=')
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]
  }),
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

console.log('\n=== 1. profiles: visibility 분포 ===\n')
const { data: profiles } = await supabase
  .from('profiles')
  .select('profile_visibility, onboarding_completed')
const dist = profiles.reduce((acc, p) => {
  const key = `${p.profile_visibility || 'null'} / onboarding=${p.onboarding_completed}`
  acc[key] = (acc[key] || 0) + 1
  return acc
}, {})
console.log('  Total:', profiles.length)
for (const [k, v] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(40)} → ${v}`)
}
const publicCount = profiles.filter(p => p.profile_visibility === 'public').length
console.log(`\n  → 새 RLS 적용 시 anon 에 보일 프로필: ${publicCount}/${profiles.length}`)
console.log(`  → 나머지 ${profiles.length - publicCount}개는 본인만 조회 가능`)

console.log('\n=== 2. club_members: club 분포 ===\n')
const { data: members } = await supabase
  .from('club_members')
  .select('club_id, role, user_id')
const clubGroup = members.reduce((acc, m) => {
  acc[m.club_id] = (acc[m.club_id] || 0) + 1
  return acc
}, {})
console.log(`  Total members: ${members.length}`)
console.log(`  Clubs with members:`, Object.keys(clubGroup).length)
console.log('  → 새 RLS 적용 시: 자기 클럽 멤버만 볼 수 있음 (다른 클럽은 인원수만)')

console.log('\n=== 3. pending_discord_setups / bot_interventions ===\n')
const { count: pdsCount } = await supabase.from('pending_discord_setups').select('*', { count: 'exact', head: true })
const { count: biCount } = await supabase.from('bot_interventions').select('*', { count: 'exact', head: true })
console.log(`  pending_discord_setups: ${pdsCount} rows (anon 완전 차단 예정)`)
console.log(`  bot_interventions: ${biCount} rows (클럽 멤버만 접근 예정)`)

console.log('\n=== 4. 예상 UI 영향 ===\n')
console.log(`  - Explore People 탭: ${publicCount}개 프로필만 표시 (현재 ${profiles.length}개)`)
if (publicCount < profiles.length * 0.5) {
  console.log('    ⚠️  50% 미만이 public → Explore 빈약해 보일 수 있음. profile_visibility default 변경 고려')
} else {
  console.log('    ✅ 절반 이상이 public → 영향 제한적')
}
console.log('  - Club 페이지 멤버 목록: 비로그인/비멤버에게 차단')
console.log('  - pending_discord_setups: 설치 진행 중 유저만 자기 것 조회 가능')
