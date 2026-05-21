#!/usr/bin/env node
/**
 * DB 타입 생성/검증 스크립트
 *
 * 왜: 마이그레이션 변경 후 `database.generated.ts` 동기화 누락 방지.
 * - `npm run db:types` → remote schema 기준으로 재생성 + 파일 저장
 * - `npm run db:types:check` → 재생성 결과를 현재 파일과 diff, 다르면 exit 1
 *
 * 두 모드 공통:
 * - `supabase gen types typescript --linked` 출력 사용 (regen-db-types.yml CI와 동일 소스)
 * - CLI stderr 의 업데이트 공지 (`A new version of Supabase CLI...`) 필터링 — 파일 오염 방지
 *
 * 필요: supabase CLI 설치 + `supabase link` 선행. CI 에선 SUPABASE_ACCESS_TOKEN 환경변수로 자동 link.
 *
 * Exit codes:
 * - 0: 성공 (regen 저장 완료 or check 통과)
 * - 1: check 모드에서 타입 drift 감지 (main/src/types/database.generated.ts 가 stale)
 * - 2: CLI 실행 실패 (link 안 됨, 권한 없음 등)
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const typesPath = resolve(projectRoot, 'src/types/database.generated.ts')

const checkMode = process.argv.includes('--check')

// supabase CLI 호출. --linked: 이전 `supabase link` 로 저장된 project_ref 사용.
// CI 에서는 SUPABASE_PROJECT_REF + SUPABASE_ACCESS_TOKEN 으로 link 후 실행.
const cli = spawnSync(
  'supabase',
  ['gen', 'types', 'typescript', '--linked'],
  { encoding: 'utf8', cwd: projectRoot, shell: process.platform === 'win32' },
)

if (cli.status !== 0 && cli.status !== null) {
  console.error('[gen-db-types] supabase CLI 실패 (exit', cli.status, ')')
  if (cli.stderr) console.error(cli.stderr)
  console.error('\nhint: `supabase link --project-ref <REF>` 선행 필요. CI 는 워크플로에서 자동 처리.')
  process.exit(2)
}

// CLI 업데이트 공지가 stdout 끝에 붙는 경우 있음 (과거 사고: 파일 끝에 "A new version..." 공지가 쓰여서 TS parse 에러).
// 방어적으로 마지막 2줄 검사 후 trim.
let generated = cli.stdout
const UPDATE_NOTICE_PATTERNS = [
  /^A new version of Supabase CLI is available/m,
  /^We recommend updating regularly/m,
]
for (const pattern of UPDATE_NOTICE_PATTERNS) {
  const match = generated.match(pattern)
  if (match && match.index != null) {
    generated = generated.slice(0, match.index).trimEnd() + '\n'
    break
  }
}

if (checkMode) {
  let committed = ''
  try {
    committed = readFileSync(typesPath, 'utf8')
  } catch (err) {
    console.error('[gen-db-types] 현재 파일을 읽을 수 없음:', err.message)
    process.exit(2)
  }

  // 끝의 공백/개행 차이는 무시.
  const norm = (s) => s.replace(/\s+$/m, '').trimEnd() + '\n'

  if (norm(generated) === norm(committed)) {
    console.log('✅ database.generated.ts 최신 상태 — drift 없음')
    process.exit(0)
  }

  console.error('❌ database.generated.ts 가 remote schema 와 다릅니다 (drift 감지)')
  console.error('')
  console.error('원인 후보:')
  console.error('  1. 새 마이그레이션을 push 했는데 타입 재생성을 잊음')
  console.error('  2. main 브랜치에 다른 PR 의 마이그레이션이 먼저 merge 되어 스키마가 앞서감')
  console.error('')
  console.error('해결:')
  console.error('  cd main && npm run db:types')
  console.error('  git add src/types/database.generated.ts && git commit --amend --no-edit && git push -f')
  console.error('')
  console.error('라인 기준 diff 요약:')
  const committedLines = new Set(committed.split('\n'))
  const generatedLines = generated.split('\n')
  const added = generatedLines.filter((l) => !committedLines.has(l) && l.trim()).slice(0, 10)
  if (added.length > 0) {
    console.error('  + 새로 추가된 라인 (remote 에 있음, 로컬에 없음):')
    for (const line of added) console.error(`    ${line}`)
  }
  process.exit(1)
}

// 저장 모드
writeFileSync(typesPath, generated)
const sizeKb = (generated.length / 1024).toFixed(1)
console.log(`✅ database.generated.ts 재생성 완료 (${sizeKb} KB)`)
