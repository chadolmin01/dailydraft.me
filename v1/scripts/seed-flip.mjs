/**
 * FLIP 동아리 시드: CSV → clubs + club_members (ghost) 생성
 *
 * 실행: node scripts/seed-flip.mjs
 * 정리: node scripts/seed-flip.mjs --clean
 *
 * 사전 조건:
 * 1. clubs/universities 마이그레이션 적용 완료
 * 2. scripts/flip-seed.csv 준비 (flip-seed-template.csv 참고)
 * 3. SUPABASE_SERVICE_ROLE_KEY 환경변수 설정
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = 'https://prxqjiuibfrmuwwmkhqb.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY 환경변수를 설정하세요.')
  console.error('  export SUPABASE_SERVICE_ROLE_KEY="your-key"')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── FLIP 클럽 설정 ──

const FLIP_SLUG = 'flip'
const FLIP_NAME = 'FLIP'
const FLIP_DESCRIPTION =
  '경희대학교 창업 동아리 FLIP. 매 학기 아이디어를 팀으로 만들고, 프로덕트를 출시합니다.'

// 직렬 매핑: CSV의 자유 텍스트 → ghost_metadata.track 정규화
const TRACK_NORMALIZE = {
  '개발': 'dev',
  '프론트': 'dev',
  '프론트엔드': 'dev',
  '백엔드': 'dev',
  '풀스택': 'dev',
  'dev': 'dev',
  '디자인': 'design',
  'ux': 'design',
  'ui': 'design',
  'design': 'design',
  '기획': 'pm',
  'pm': 'pm',
  'po': 'pm',
  '비즈니스': 'biz',
  '마케팅': 'biz',
  'biz': 'biz',
}

// ── CSV 파서 (의존성 없이 간단하게) ──

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map((h) => h.trim())
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // 간단한 CSV 파싱: 큰따옴표 안의 쉼표 처리
    const values = []
    let current = ''
    let inQuotes = false
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    const row = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] || ''
    })
    rows.push(row)
  }

  return rows
}

// ── Seed 로직 ──

async function seed() {
  console.log('🏫 FLIP 시드 시작...\n')

  // 1. CSV 읽기
  const csvPath = resolve(__dirname, 'flip-seed.csv')
  let csvText
  try {
    csvText = readFileSync(csvPath, 'utf-8')
  } catch {
    console.error(`❌ ${csvPath} 파일을 찾을 수 없습니다.`)
    console.error('   flip-seed-template.csv를 참고해서 flip-seed.csv를 작성하세요.')
    process.exit(1)
  }

  const members = parseCSV(csvText)
  console.log(`📄 CSV에서 ${members.length}명 읽음\n`)

  // 2. 성민님 user_id 조회 (FLIP owner — 실제 Draft 가입 유저)
  // service_role이므로 auth.admin 사용
  const { data: adminUsers } = await supabase.auth.admin.listUsers()
  // FLIP 회장 성민님 찾기 — 프로필에서 검색
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('user_id, nickname')
    .ilike('nickname', '%성민%')
    .limit(1)
    .single()

  let ownerUserId
  if (ownerProfile) {
    ownerUserId = ownerProfile.user_id
    console.log(`👤 Owner: ${ownerProfile.nickname} (${ownerUserId.slice(0, 8)}...)`)
  } else {
    // 첫 번째 admin user를 fallback으로
    const firstAdmin = adminUsers?.users?.[0]
    if (!firstAdmin) {
      console.error('❌ Owner로 설정할 유저를 찾을 수 없습니다.')
      process.exit(1)
    }
    ownerUserId = firstAdmin.id
    console.log(`👤 Owner (fallback): ${firstAdmin.email} (${ownerUserId.slice(0, 8)}...)`)
  }

  // 3. FLIP 클럽 생성 (이미 있으면 skip)
  const { data: existingClub } = await supabase
    .from('clubs')
    .select('id')
    .eq('slug', FLIP_SLUG)
    .single()

  let clubId
  if (existingClub) {
    clubId = existingClub.id
    console.log(`⏭️  FLIP 클럽 이미 존재 (${clubId.slice(0, 8)}...)`)
  } else {
    const { data: newClub, error: clubError } = await supabase
      .from('clubs')
      .insert({
        slug: FLIP_SLUG,
        name: FLIP_NAME,
        description: FLIP_DESCRIPTION,
        created_by: ownerUserId,
      })
      .select('id')
      .single()

    if (clubError) {
      console.error(`❌ 클럽 생성 실패: ${clubError.message}`)
      process.exit(1)
    }
    clubId = newClub.id
    console.log(`✅ FLIP 클럽 생성 (${clubId.slice(0, 8)}...)`)
    // auto_add_club_owner 트리거가 owner를 club_members에 자동 추가함
  }

  // 4. 경희대 뱃지 부여
  const { data: khuUniv } = await supabase
    .from('universities')
    .select('id')
    .eq('name', '경희대학교')
    .single()

  if (khuUniv) {
    const { error: credError } = await supabase.from('club_credentials').insert({
      club_id: clubId,
      credential_type: 'university',
      university_id: khuUniv.id,
      verified_by: ownerUserId,
      verification_method: 'manual_admin',
    })
    if (credError?.code === '23505') {
      console.log('⏭️  경희대 뱃지 이미 부여됨')
    } else if (credError) {
      console.error(`⚠️  경희대 뱃지 부여 실패: ${credError.message}`)
    } else {
      console.log('🎓 경희대 뱃지 부여 완료')
    }
  }

  // 5. Ghost members 삽입
  let inserted = 0
  let skipped = 0

  for (const row of members) {
    const name = row.name?.trim()
    if (!name) continue

    const trackRaw = (row.track || '').trim().toLowerCase()
    const track = TRACK_NORMALIZE[trackRaw] || trackRaw
    const role = ['owner', 'admin', 'member', 'alumni'].includes(row.role)
      ? row.role
      : 'member'
    const cohort = row.cohort?.trim() || null
    const university = row.university?.trim() || null
    const projects = row.projects
      ? row.projects.split(',').map((p) => p.trim()).filter(Boolean)
      : []
    const notes = row.notes?.trim() || null

    const ghostMetadata = {
      track,
      ...(university && { university }),
      ...(projects.length > 0 && { projects }),
      ...(notes && { notes }),
    }

    const { error } = await supabase.from('club_members').insert({
      club_id: clubId,
      user_id: null,
      ghost_name: name,
      ghost_metadata: ghostMetadata,
      role,
      cohort,
    })

    if (error) {
      if (error.code === '23505') {
        skipped++
      } else {
        console.error(`  ❌ ${name}: ${error.message}`)
      }
    } else {
      inserted++
      if (inserted <= 5 || inserted % 20 === 0) {
        console.log(`  👻 ${name} (${cohort || '?'}, ${track})`)
      }
    }
  }

  console.log(
    `\n✨ 완료! Ghost ${inserted}명 추가, ${skipped}명 중복 스킵`
  )

  // 6. 요약
  const { count } = await supabase
    .from('club_members')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', clubId)

  console.log(`📊 FLIP 클럽 총 멤버: ${count}명`)
}

// ── Clean 로직 ──

async function clean() {
  console.log('🧹 FLIP 시드 정리...\n')

  const { data: club } = await supabase
    .from('clubs')
    .select('id')
    .eq('slug', FLIP_SLUG)
    .single()

  if (!club) {
    console.log('FLIP 클럽이 없습니다.')
    return
  }

  // ghost members만 삭제 (real members는 유지)
  const { error: memberError, count: memberCount } = await supabase
    .from('club_members')
    .delete({ count: 'exact' })
    .eq('club_id', club.id)
    .is('user_id', null)

  if (memberError) {
    console.error(`❌ Ghost 멤버 삭제 실패: ${memberError.message}`)
  } else {
    console.log(`🗑️  Ghost 멤버 ${memberCount}명 삭제`)
  }

  // credentials 삭제
  const { error: credError } = await supabase
    .from('club_credentials')
    .delete()
    .eq('club_id', club.id)

  if (credError) {
    console.error(`❌ Credentials 삭제 실패: ${credError.message}`)
  } else {
    console.log('🗑️  Credentials 삭제')
  }

  // 클럽 삭제
  const { error: clubError } = await supabase
    .from('clubs')
    .delete()
    .eq('id', club.id)

  if (clubError) {
    console.error(`❌ 클럽 삭제 실패: ${clubError.message}`)
  } else {
    console.log('🗑️  FLIP 클럽 삭제')
  }

  console.log('\n✨ 정리 완료')
}

// ── 실행 ──

const isClean = process.argv.includes('--clean')
if (isClean) {
  clean().catch(console.error)
} else {
  seed().catch(console.error)
}
