#!/usr/bin/env node
/**
 * 백업 복구 리허설 검증 스크립트.
 *
 * 로컬 Docker postgres 에 백업을 복구하고 핵심 테이블 row 수를 prod 와 비교.
 *
 * 사용:
 *   1. GitHub Actions → Weekly DB Backup → 최근 artifact 다운로드
 *   2. gunzip 해서 /tmp/restore-test.sql 로 저장
 *   3. node scripts/verify-backup-restore.mjs /tmp/restore-test.sql
 *
 * Exit:
 *   0 = 검증 통과
 *   1 = 불일치 또는 복구 실패
 *   2 = 환경 에러 (docker/psql 없음)
 */
import { execSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const backupPath = process.argv[2]
if (!backupPath) {
  console.error('Usage: node scripts/verify-backup-restore.mjs <path-to-backup.sql>')
  process.exit(2)
}

if (!existsSync(backupPath)) {
  console.error(`백업 파일 없음: ${backupPath}`)
  process.exit(2)
}

// prod 서비스 키로 현재 row 수 조회 (비교 기준)
const envText = readFileSync('.env.local.audit', 'utf8')
const env = Object.fromEntries(
  envText
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]
    }),
)

const prod = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const KEY_TABLES = ['profiles', 'clubs', 'club_members', 'opportunities', 'applications']

async function getProdCounts() {
  const counts = {}
  for (const table of KEY_TABLES) {
    const { count, error } = await prod.from(table).select('*', { count: 'exact', head: true })
    if (error) {
      console.error(`[prod] ${table} 조회 실패:`, error.message)
      counts[table] = null
    } else {
      counts[table] = count ?? 0
    }
  }
  return counts
}

function ensureDocker() {
  try {
    execSync('docker --version', { stdio: 'ignore' })
  } catch {
    console.error('Docker 필요 (https://docs.docker.com/get-docker/)')
    process.exit(2)
  }
}

function runDockerPostgres() {
  console.log('🐳 임시 Postgres 컨테이너 기동 중...')
  execSync(
    'docker run --rm -d --name draft-restore-verify ' +
      '-e POSTGRES_PASSWORD=verify -p 54333:5432 postgres:15',
    { stdio: 'inherit' },
  )
  // Postgres ready 대기
  execSync('sleep 5')
}

function stopDockerPostgres() {
  try {
    execSync('docker stop draft-restore-verify', { stdio: 'ignore' })
  } catch {}
}

function restoreBackup(path) {
  console.log(`📦 ${path} 복구 중...`)
  const result = spawnSync(
    'docker',
    [
      'exec',
      '-i',
      '-e', 'PGPASSWORD=verify',
      'draft-restore-verify',
      'psql',
      '-U', 'postgres',
      '-d', 'postgres',
    ],
    {
      input: readFileSync(path),
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 1024, // 1GB
    },
  )

  if (result.status !== 0) {
    console.error('psql 복구 실패:', result.stderr?.slice(0, 2000))
    return false
  }
  return true
}

function queryRestored(table) {
  const result = spawnSync(
    'docker',
    [
      'exec',
      '-e', 'PGPASSWORD=verify',
      'draft-restore-verify',
      'psql',
      '-U', 'postgres',
      '-d', 'postgres',
      '-At',  // unaligned, tuple-only
      '-c', `SELECT count(*) FROM public.${table};`,
    ],
    { encoding: 'utf8' },
  )

  if (result.status !== 0) return null
  return parseInt(result.stdout.trim(), 10)
}

async function main() {
  ensureDocker()

  console.log('📊 프로덕션 row 수 수집...')
  const prodCounts = await getProdCounts()
  console.table(prodCounts)

  try {
    runDockerPostgres()
    const ok = restoreBackup(backupPath)
    if (!ok) {
      console.error('❌ 복구 실패')
      process.exit(1)
    }

    console.log('\n🔍 복구된 DB row 수 검증...')
    const restoredCounts = {}
    for (const table of KEY_TABLES) {
      restoredCounts[table] = queryRestored(table)
    }

    console.table(restoredCounts)

    // 비교 — 백업 시점이 prod 보다 과거라 prod 가 일부 더 많을 수 있음.
    // 허용 조건: restored <= prod (과거 스냅샷이므로) AND restored > 0 (완전 누락 아님)
    let allOk = true
    for (const table of KEY_TABLES) {
      const r = restoredCounts[table]
      const p = prodCounts[table]
      if (r == null) {
        console.error(`❌ ${table}: 복구된 DB 에서 테이블 조회 실패`)
        allOk = false
      } else if (r > p) {
        console.warn(`⚠️  ${table}: restored ${r} > prod ${p} (백업 이후 prod 에서 삭제?)`)
      } else if (r === 0 && p > 0) {
        console.error(`❌ ${table}: 복구된 DB 비어 있는데 prod 에 데이터 있음`)
        allOk = false
      } else {
        console.log(`✅ ${table}: restored ${r} / prod ${p}`)
      }
    }

    if (allOk) {
      console.log('\n✅ 백업 복구 검증 통과')
      process.exit(0)
    } else {
      console.error('\n❌ 검증 실패 — 자세한 내용 위 로그 참조')
      process.exit(1)
    }
  } finally {
    stopDockerPostgres()
  }
}

main().catch(err => {
  console.error('예상 외 에러:', err)
  stopDockerPostgres()
  process.exit(1)
})
