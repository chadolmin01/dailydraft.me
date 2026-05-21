#!/usr/bin/env node
/**
 * RLS 정책 현황 조회 — prod DB 직접 쿼리 (service_role)
 *
 * 왜: 감사 결과 "마이그레이션에 정책 없음" 이 drift 가능성 있음. 실제 pg_policies 를
 * 조회해서 "없음" / "있지만 drift" / "정상" 을 구분해야 근본 대응 가능.
 *
 * 사용: vercel env pull .env.local.audit 후 node scripts/rls-audit.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// .env.local.audit 파싱
const envPath = resolve(__dirname, '../.env.local.audit')
let envText
try {
  envText = readFileSync(envPath, 'utf8')
} catch {
  console.error('.env.local.audit 을 찾을 수 없습니다. vercel env pull 먼저 실행하세요.')
  process.exit(1)
}

const env = Object.fromEntries(
  envText
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, '')]
    }),
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 가 없습니다.')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
})

// Supabase client에는 직접 SQL 실행이 없어서, pg_policies·pg_tables 뷰를 REST API 로 조회.
// supabase에 기본 public 스키마 내 pg_ 뷰는 노출 안 됨 → 전용 RPC 먼저 작성.
//
// 간이 우회: pg_policies 를 public 테이블로 SELECT. Supabase PostgREST 는 public 스키마만 노출하므로
// 직접 조회 불가. 대신 직접 Postgres 연결 또는 `/rest/v1/rpc/pg_policies` 같은 커스텀 function 필요.
//
// 여기선 이미 존재하는 auth.users / profiles 등 몇 테이블에 anon key로 SELECT 시도해 RLS 차단 여부 간접 확인.

const KEY_TABLES = [
  'profiles',
  'error_logs',
  'direct_messages',
  'pending_discord_setups',
  'member_activity_stats',
  'personas',
  'persona_fields',
  'team_tasks',
  'team_resources',
  'team_decisions',
  'bot_interventions',
  'club_members',
  'clubs',
  'opportunities',
  'applications',
]

// anon key 클라이언트로 SELECT 시도해서 RLS 차단 여부 간접 확인
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!anonKey) {
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY 필요')
  process.exit(1)
}
const anonClient = createClient(url, anonKey, { auth: { persistSession: false } })

console.log('\n=== anon key 로 SELECT 시도 (RLS 작동 여부 간접 체크) ===\n')
console.log('  데이터 반환 0 = RLS 차단 or 빈 테이블')
console.log('  데이터 반환 >0 = anon이 데이터 읽기 가능 (public 의도가 아니면 위험)\n')

for (const table of KEY_TABLES) {
  const { data, error, count } = await anonClient
    .from(table)
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.log(`  ${table.padEnd(30)} → ERROR: ${error.message.slice(0, 80)}`)
  } else {
    const visible = count ?? 0
    const flag = visible > 0 ? '⚠️  anon read-able' : '✅ blocked/empty'
    console.log(`  ${table.padEnd(30)} → ${flag} (${visible} rows)`)
  }
}

// service_role 로 전체 데이터 개수 비교 — anon이 차단 중이면 service_role 과 anon 카운트가 다를 것
console.log('\n=== service_role 로 실제 row 수 (anon 과 비교) ===\n')

for (const table of KEY_TABLES) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.log(`  ${table.padEnd(30)} → ERROR`)
  } else {
    console.log(`  ${table.padEnd(30)} → ${count ?? 0} rows total`)
  }
}

console.log('\n비교: 만약 "anon 0" 이고 "service_role >0" 이면 RLS가 작동 중.')
console.log('만약 "anon == service_role" 이면 RLS 없거나 public SELECT 정책 있음.\n')
