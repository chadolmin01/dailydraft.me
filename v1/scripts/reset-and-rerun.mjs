/**
 * 기존 초안 삭제 후 크론 재실행 — DM 발송 테스트
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = readFileSync('.env.local','utf-8')
function getEnv(key) {
  return env.match(new RegExp(`${key}=(.+)`))?.[1]?.trim().replace(/^["']|["']$/g,'')
}

const admin = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))
const CRON_SECRET = getEnv('CRON_SECRET')

// 1. 기존 15주차 초안 삭제 (중복 방지 해제)
const { data: deleted } = await admin
  .from('weekly_update_drafts')
  .delete()
  .gte('week_number', 15)
  .select('id, title')

console.log(`🗑️  기존 초안 ${deleted?.length || 0}개 삭제`)
for (const d of deleted || []) {
  console.log(`   ${d.id} | ${d.title}`)
}

// 2. 크론 호출
console.log('\n🚀 /api/cron/ghostwriter-generate 호출...\n')

const res = await fetch('http://localhost:3000/api/cron/ghostwriter-generate', {
  method: 'POST',
  headers: { Authorization: `Bearer ${CRON_SECRET}` },
})

const body = await res.json()
console.log(`HTTP ${res.status}`)
console.log(JSON.stringify(body, null, 2))

if (body.draftsCreated > 0) {
  console.log('\n✅ 초안 생성 완료! Discord DM을 확인하세요.')
} else {
  console.log('\n⚠️  초안이 생성되지 않았습니다.')
}

// 3. 생성된 초안 확인
const { data: newDraft } = await admin
  .from('weekly_update_drafts')
  .select('id, title, status')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

if (newDraft) {
  console.log(`\n📝 초안: ${newDraft.title}`)
  console.log(`   페이지: http://localhost:3000/drafts/${newDraft.id}`)
}
