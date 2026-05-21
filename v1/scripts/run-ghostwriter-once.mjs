/**
 * Ghostwriter 크론 1회 실행
 *
 * 실제 /api/cron/ghostwriter-generate 엔드포인트를 호출한다.
 * DB에 매핑이 없으면 자동으로 생성한 뒤 실행.
 *
 * 사용법: node scripts/run-ghostwriter-once.mjs
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const envContent = readFileSync('.env.local', 'utf-8')
function env(key) {
  const match = envContent.match(new RegExp(`${key}=(.+)`))
  return match?.[1]?.trim().replace(/^["']|["']$/g, '')
}

const SUPABASE_URL = env('NEXT_PUBLIC_SUPABASE_URL') || env('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY')
const CRON_SECRET = env('CRON_SECRET')
const BASE_URL = 'http://localhost:3000'

const DISCORD_CHANNEL_ID = '1492363167135957082'  // #🍔-foodfinder-팀채널
const DISCORD_GUILD_ID = '1492207944530399495'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 없음')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function ensureDbRecords() {
  console.log('📋 DB 매핑 확인 중...\n')

  // 1. 클럽 확인/생성
  let { data: club } = await admin.from('clubs').select('id').limit(1).maybeSingle()
  if (!club) {
    console.log('  ⚠️  클럽이 없습니다. 테스트 클럽을 생성합니다.')
    // auth.users에서 첫 번째 사용자 가져오기
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1 })
    if (!users?.length) {
      console.error('❌ 사용자가 없습니다. 먼저 회원가입하세요.')
      process.exit(1)
    }
    const userId = users[0].id

    const { data: newClub, error } = await admin.from('clubs').insert({
      name: 'FoodFinder 테스트 클럽',
      slug: 'foodfinder-test',
      created_by: userId,
    }).select('id').single()

    if (error) {
      console.error('❌ 클럽 생성 실패:', error.message)
      process.exit(1)
    }
    club = newClub
    console.log(`  ✅ 클럽 생성: ${club.id}`)
  } else {
    console.log(`  ✅ 클럽 존재: ${club.id}`)
  }

  const clubId = club.id

  // 2. opportunity 확인/생성
  let { data: opp } = await admin.from('opportunities')
    .select('id, creator_id')
    .limit(1).maybeSingle()

  if (!opp) {
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1 })
    const userId = users[0].id

    const { data: newOpp, error } = await admin.from('opportunities').insert({
      title: 'FoodFinder 앱',
      description: '음식 추천 앱 프로젝트',
      creator_id: userId,
      club_id: clubId,
      status: 'open',
      opportunity_type: 'project',
    }).select('id, creator_id').single()

    if (error) {
      console.error('❌ Opportunity 생성 실패:', error.message)
      process.exit(1)
    }
    opp = newOpp
    console.log(`  ✅ Opportunity 생성: ${opp.id}`)
  } else {
    console.log(`  ✅ Opportunity 존재: ${opp.id}`)
  }

  // 3. discord_bot_installations 확인/생성
  let { data: botInstall } = await admin.from('discord_bot_installations')
    .select('id')
    .eq('club_id', clubId)
    .maybeSingle()

  if (!botInstall) {
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1 })
    const { error } = await admin.from('discord_bot_installations').insert({
      club_id: clubId,
      discord_guild_id: DISCORD_GUILD_ID,
      discord_guild_name: 'Draft 테스트 서버',
      installed_by: users[0].id,
    })
    if (error && error.code !== '23505') {
      console.error('❌ Bot installation 생성 실패:', error.message)
    } else {
      console.log(`  ✅ Bot installation 생성`)
    }
  } else {
    console.log(`  ✅ Bot installation 존재`)
  }

  // 4. discord_team_channels 확인/생성
  let { data: teamChannel } = await admin.from('discord_team_channels')
    .select('id')
    .eq('discord_channel_id', DISCORD_CHANNEL_ID)
    .maybeSingle()

  if (!teamChannel) {
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1 })
    const { error } = await admin.from('discord_team_channels').insert({
      club_id: clubId,
      opportunity_id: opp.id,
      discord_channel_id: DISCORD_CHANNEL_ID,
      discord_channel_name: '🍔-foodfinder-팀채널',
      created_by: users[0].id,
    })
    if (error && error.code !== '23505') {
      console.error('❌ Team channel 매핑 실패:', error.message)
    } else {
      console.log(`  ✅ Team channel 매핑 생성`)
    }
  } else {
    console.log(`  ✅ Team channel 매핑 존재`)
  }

  return { clubId, opportunityId: opp.id, creatorId: opp.creator_id }
}

async function callCron() {
  console.log('\n🚀 /api/cron/ghostwriter-generate 호출 중...\n')

  const res = await fetch(`${BASE_URL}/api/cron/ghostwriter-generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CRON_SECRET}`,
      'Content-Type': 'application/json',
    },
  })

  const body = await res.text()
  console.log(`  HTTP ${res.status}`)

  try {
    const json = JSON.parse(body)
    console.log('  응답:', JSON.stringify(json, null, 2))
    return json
  } catch {
    console.log('  응답:', body)
    return null
  }
}

async function checkDraft(opportunityId) {
  console.log('\n📦 생성된 초안 확인 중...\n')

  const { data: drafts } = await admin.from('weekly_update_drafts')
    .select('id, title, content, status, week_number, update_type, source_message_count, created_at')
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!drafts?.length) {
    console.log('  ⚠️  생성된 초안이 없습니다.')
    return
  }

  const draft = drafts[0]
  console.log('╔' + '═'.repeat(58) + '╗')
  console.log('║  📝 생성된 주간 업데이트 초안 (DB 저장 완료)              ║')
  console.log('╠' + '═'.repeat(58) + '╣')
  console.log('')
  console.log(`  ID: ${draft.id}`)
  console.log(`  상태: ${draft.status}`)
  console.log(`  주차: ${draft.week_number}주차`)
  console.log(`  제목: ${draft.title}`)
  console.log(`  유형: ${draft.update_type}`)
  console.log(`  원본 메시지: ${draft.source_message_count}개`)
  console.log('')

  try {
    const parsed = JSON.parse(draft.content)
    console.log('  ── 요약 ──')
    console.log(`  ${parsed.summary}`)
    console.log('')
    console.log('  ── 작업 ──')
    for (const t of parsed.tasks || []) {
      console.log(`  ${t.done ? '✅' : '🔧'} ${t.text}${t.member ? ` — ${t.member}` : ''}`)
    }
    console.log('')
    console.log('  ── 다음 주 계획 ──')
    console.log(`  ${parsed.nextPlan}`)
    console.log('')
    const statusIcon = parsed.teamStatus === 'good' ? '🟢' : parsed.teamStatus === 'hard' ? '🔴' : '🟡'
    console.log(`  ── 팀 상태: ${statusIcon} ${parsed.teamStatus} ──`)
    console.log(`  ${parsed.teamStatusReason}`)
  } catch {
    console.log('  (content 파싱 실패)')
  }

  console.log('')
  console.log('╚' + '═'.repeat(58) + '╝')
  console.log('')
  console.log('✅ 실제 크론과 동일하게:')
  console.log(`  • DB에 초안 저장됨 (status: ${draft.status})`)
  console.log('  • 팀장에게 Discord DM 승인 요청 발송됨')
  console.log(`  • Draft 앱에서 검토: http://localhost:3000/drafts/${draft.id}`)
}

async function run() {
  console.log('\n' + '═'.repeat(60))
  console.log('🤖 Ghostwriter 크론 실제 1회 실행')
  console.log('═'.repeat(60) + '\n')

  const { opportunityId } = await ensureDbRecords()
  const result = await callCron()

  if (result?.success) {
    await checkDraft(opportunityId)
  }
}

run().catch(console.error)
