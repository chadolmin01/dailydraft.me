#!/usr/bin/env node
// Meta App Review 심사자용 테스트 계정 + 클럽 + 페르소나를 프로덕션에 프로비저닝.
//
// 목적: 리뷰어가 Meta 폼의 "Step-by-step instructions" 대로 따라했을 때
//       오류 없이 OAuth → 발행 → 확인 → 삭제 전 과정이 작동해야 함.
//       매 심사 사이클마다 새 계정을 만들어 이전 흔적을 섞지 않음.
//
// 사용법:
//   cd main
//   node scripts/provision-reviewer-account.mjs --ticket META-001
//
//   옵션:
//     --ticket <id>   Meta 배정 ticket ID (필수, 이메일·slug 시드)
//     --dry-run       실제 쓰기 없이 플랜만 출력
//     --cleanup <id>  기존 리뷰어 계정/클럽/페르소나 hard delete
//
// 요구사항:
//   - .env.local 에 SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 존재
//   - admin client 로 auth.users 생성 가능 (service_role 필요)
//
// 안전장치:
//   - 생성되는 모든 엔티티에 nickname/slug 가 "reviewer-" 접두사
//   - reviewer_ prefix 가 없는 row 는 이 스크립트가 절대 건드리지 않음
//   - --cleanup 도 같은 prefix 검증 후에만 삭제 실행

import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    ticket: { type: 'string', short: 't' },
    'dry-run': { type: 'boolean' },
    cleanup: { type: 'string' },
  },
})

const TICKET = values.ticket || values.cleanup
if (!TICKET) {
  console.error('Usage: --ticket <id> | --cleanup <id> [--dry-run]')
  process.exit(1)
}
const DRY_RUN = !!values['dry-run']
const CLEANUP = !!values.cleanup

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('환경변수 누락: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// 리뷰어 계정 시드 — ticket 별 고정값
function seeds(ticketId) {
  const safe = ticketId.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20)
  return {
    email: `reviewer-${safe}@dailydraft.me`,
    nickname: `Meta Reviewer ${safe}`,
    clubSlug: `reviewer-${safe}`,
    clubName: `Reviewer Demo ${safe}`,
    personaName: `Reviewer Persona ${safe}`,
  }
}

function generatePassword() {
  // 16자 — 대소문자 + 숫자 + 기호 혼합
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789-_'
  const buf = randomBytes(32)
  let pw = ''
  for (let i = 0; i < 16; i++) pw += alphabet[buf[i] % alphabet.length]
  return pw
}

async function provision(ticketId) {
  const s = seeds(ticketId)
  const password = generatePassword()

  console.log('=== 프로비저닝 플랜 ===')
  console.log(`  email       : ${s.email}`)
  console.log(`  password    : ${password}`)
  console.log(`  club slug   : ${s.clubSlug}`)
  console.log(`  club name   : ${s.clubName}`)
  console.log(`  persona     : ${s.personaName}`)
  console.log('')

  if (DRY_RUN) {
    console.log('[dry-run] 실제 쓰기 생략')
    return
  }

  // 1) auth.users 생성
  const { data: user, error: userErr } = await admin.auth.admin.createUser({
    email: s.email,
    password,
    email_confirm: true,
    user_metadata: { nickname: s.nickname, reviewer_ticket: ticketId },
  })
  if (userErr) throw new Error(`auth.users 생성 실패: ${userErr.message}`)
  console.log(`✓ auth.users created: ${user.user.id}`)

  // 2) profiles upsert
  const { error: profErr } = await admin.from('profiles').upsert({
    user_id: user.user.id,
    nickname: s.nickname,
    data_consent: true,
    data_consent_at: new Date().toISOString(),
  })
  if (profErr) throw new Error(`profiles upsert 실패: ${profErr.message}`)
  console.log('✓ profiles upserted')

  // 3) clubs 생성 (visibility='public' 으로 공개 메타 확인 용이)
  const { data: club, error: clubErr } = await admin
    .from('clubs')
    .insert({
      slug: s.clubSlug,
      name: s.clubName,
      description: 'Meta App Review reviewer demo club. Automatically provisioned.',
      visibility: 'public',
      category: 'portfolio',
      created_by: user.user.id,
    })
    .select('id, slug')
    .single()
  if (clubErr) throw new Error(`clubs 생성 실패: ${clubErr.message}`)
  console.log(`✓ clubs created: ${club.id}`)

  // 4) club_members owner 추가 (auto_add_club_owner 트리거 없으면 수동)
  const { error: memErr } = await admin.from('club_members').upsert({
    club_id: club.id,
    user_id: user.user.id,
    role: 'owner',
    status: 'active',
  })
  if (memErr) console.warn(`club_members 경고: ${memErr.message}`)
  console.log('✓ club_members owner attached')

  // 5) personas 생성 — type=club, owner_id=club.id
  const { data: persona, error: personaErr } = await admin
    .from('personas')
    .insert({
      type: 'club',
      owner_id: club.id,
      name: s.personaName,
      status: 'active',
      created_by: user.user.id,
    })
    .select('id')
    .single()
  if (personaErr) throw new Error(`personas 생성 실패: ${personaErr.message}`)
  console.log(`✓ personas created: ${persona.id}`)

  // 6) 요약 출력
  console.log('')
  console.log('=== 리뷰어 프로비저닝 완료 ===')
  console.log('Meta 폼 필드에 붙여넣을 값:')
  console.log('')
  console.log(`  Email: ${s.email}`)
  console.log(`  Password: ${password}`)
  console.log(`  Club slug: ${s.clubSlug}`)
  console.log(`  Persona ID: ${persona.id}`)
  console.log('')
  console.log('비밀번호는 다른 곳에 저장되지 않았습니다. 지금 복사해 두세요.')
}

async function cleanup(ticketId) {
  const s = seeds(ticketId)
  console.log(`=== 정리 플랜: ${s.clubSlug} ===`)

  if (DRY_RUN) {
    console.log('[dry-run] 실제 삭제 생략')
    return
  }

  // 안전: 앞에 reviewer- 접두사 확인 강제
  if (!s.clubSlug.startsWith('reviewer-')) {
    throw new Error('safety: slug 가 reviewer- 로 시작하지 않음. 중단.')
  }
  if (!s.email.startsWith('reviewer-')) {
    throw new Error('safety: email 이 reviewer- 로 시작하지 않음. 중단.')
  }

  // 1) club 삭제 (cascade)
  const { data: club } = await admin
    .from('clubs')
    .select('id')
    .eq('slug', s.clubSlug)
    .maybeSingle()

  if (club) {
    await admin.from('clubs').delete().eq('id', club.id)
    console.log('✓ club deleted (cascade)')
  }

  // 2) auth.users 삭제
  const { data: usersList } = await admin.auth.admin.listUsers({ perPage: 200 })
  const matched = usersList?.users?.find((u) => u.email === s.email)
  if (matched) {
    await admin.auth.admin.deleteUser(matched.id)
    console.log(`✓ auth.users deleted: ${matched.id}`)
  }

  console.log('정리 완료')
}

(async () => {
  try {
    if (CLEANUP) {
      await cleanup(TICKET)
    } else {
      await provision(TICKET)
    }
  } catch (err) {
    console.error('실패:', err instanceof Error ? err.message : err)
    process.exit(1)
  }
})()
