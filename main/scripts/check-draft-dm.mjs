/**
 * 초안 상태 + DM 발송 가능 여부 진단
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const envContent = readFileSync('.env.local', 'utf-8')
function env(key) {
  const match = envContent.match(new RegExp(`${key}=(.+)`))
  return match?.[1]?.trim().replace(/^["']|["']$/g, '')
}

const admin = createClient(env('NEXT_PUBLIC_SUPABASE_URL') || env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))

async function run() {
  // 1. 최근 초안 확인
  const { data: drafts } = await admin
    .from('weekly_update_drafts')
    .select('id, target_user_id, title, status, created_at')
    .order('created_at', { ascending: false })
    .limit(3)

  console.log('📦 최근 초안:')
  for (const d of drafts || []) {
    console.log(`  ${d.id} | ${d.status} | ${d.title}`)
    console.log(`    target_user_id: ${d.target_user_id}`)

    // 2. 해당 유저의 discord_user_id 확인
    const { data: profile } = await admin
      .from('profiles')
      .select('nickname, discord_user_id')
      .eq('user_id', d.target_user_id)
      .single()

    console.log(`    profile: nickname=${profile?.nickname}, discord_user_id=${profile?.discord_user_id || '❌ 없음'}`)
  }

  // 3. 현재 로그인 가능한 유저 확인
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 5 })
  console.log('\n👤 등록된 유저:')
  for (const u of users || []) {
    const { data: p } = await admin.from('profiles').select('nickname, discord_user_id').eq('user_id', u.id).maybeSingle()
    console.log(`  ${u.id} | ${u.email} | nickname=${p?.nickname} | discord_user_id=${p?.discord_user_id || '없음'}`)
  }
}

run().catch(console.error)
