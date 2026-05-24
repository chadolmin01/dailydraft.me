#!/usr/bin/env node
/**
 * M6 Task Extractor 검증 스크립트 — 다중 fixture 지원.
 *
 * 의도: glossary/fixtures/ 의 모든 fixture 폴더 순회 → 각각 추출 → 표.
 *       variance 측정 위해 --runs N 으로 같은 fixture 반복 실행 가능.
 *
 * 사용:
 *   pnpm exec tsx scripts/verify_extractor.ts                # 모든 fixture 1회씩
 *   pnpm exec tsx scripts/verify_extractor.ts --runs 3       # 각 fixture 3회 (variance)
 *   pnpm exec tsx scripts/verify_extractor.ts --only sample_flip3_w2
 *
 * 비용: fixture 당 Haiku 4.5 1회 ≈ $0.005~0.02
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { extractFromText } from '../glossary/pipeline/task_extractor'

function loadEnvLocal() {
  const p = join(process.cwd(), '.env.local')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 0) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!process.env[k]) process.env[k] = v
  }
}
loadEnvLocal()

const FIXTURES_ROOT = join(process.cwd(), 'glossary', 'fixtures')

// --runs N, --only NAME 파싱 (외부 dependency 회피)
function parseArgs() {
  const args = process.argv.slice(2)
  let runs = 1
  let only: string | undefined
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--runs' && args[i + 1]) {
      runs = Math.max(1, parseInt(args[++i], 10) || 1)
    } else if (args[i] === '--only' && args[i + 1]) {
      only = args[++i]
    }
  }
  return { runs, only }
}

interface RunResult {
  fixture: string
  run: number
  atoms: number
  relations: number
  recall: number
  typeAccuracy: number
  schemaCompliant: boolean
  grounded: boolean
  elapsedMs: number
  outputChars: number
  pass: boolean
  issuesCount: number
}

async function runOne(fixtureDir: string, fixtureName: string, run: number): Promise<RunResult> {
  const text = readFileSync(join(fixtureDir, 'sample_report_input.md'), 'utf-8')
  const expected = JSON.parse(readFileSync(join(fixtureDir, 'expected_atoms.json'), 'utf-8'))
  const fileId = expected.$source_file.id as string

  const t0 = Date.now()
  const result = await extractFromText(text, fileId)
  const elapsedMs = Date.now() - t0

  const expectedCounts = expected.expected_counts as Record<string, number>
  const actualCounts: Record<string, number> = {}
  for (const a of result.atoms) actualCounts[a.type] = (actualCounts[a.type] ?? 0) + 1

  const allTypes = Object.keys(expectedCounts).filter(k => !k.startsWith('_'))
  let typeMatchCount = 0
  let typeTotalCount = 0
  for (const t of allTypes) {
    const exp = expectedCounts[t]
    const act = actualCounts[t] ?? 0
    if (exp > 0 || act > 0) {
      typeTotalCount++
      // 의도: 적응형 tolerance — 큰 갯수 (예: Entity 8) 에선 ±1 너무 엄격.
      //       상대 20% 또는 절대 ±1 중 큰 값. 정형 데이터의 갯수 variance 반영.
      const tolerance = Math.max(1, Math.floor(Math.max(exp, act) * 0.2))
      if (Math.abs(act - exp) <= tolerance) typeMatchCount++
    }
  }
  const typeAccuracy = typeTotalCount > 0 ? typeMatchCount / typeTotalCount : 1
  const expectedTotal = expectedCounts._total_atoms ?? 24
  const recall = Math.min(1, result.atoms.length / expectedTotal)

  const targets = expected.validation_targets
  const pass =
    result.validation.schema_compliant &&
    result.validation.grounded &&
    recall >= targets.recall_min &&
    typeAccuracy >= targets.type_classification_accuracy_min

  // 마지막 run 의 actual + issues 저장 (디버그용)
  const outPath = join(fixtureDir, 'actual_extracted.json')
  writeFileSync(outPath, JSON.stringify({
    atoms: result.atoms,
    relations: result.relations,
    issues: result.validation.issues,
  }, null, 2))

  const outputChars = JSON.stringify({ atoms: result.atoms, relations: result.relations }).length

  return {
    fixture: fixtureName,
    run,
    atoms: result.atoms.length,
    relations: result.relations.length,
    recall,
    typeAccuracy,
    schemaCompliant: result.validation.schema_compliant,
    grounded: result.validation.grounded,
    elapsedMs,
    outputChars,
    pass,
    issuesCount: result.validation.issues.length,
  }
}

function formatTable(results: RunResult[]) {
  // header
  const cols = [
    ['fixture', 24],
    ['run', 5],
    ['atoms', 6],
    ['rel', 5],
    ['recall', 7],
    ['typeAcc', 7],
    ['schema', 7],
    ['ground', 7],
    ['ms', 7],
    ['outCh', 7],
    ['pass', 6],
  ] as const
  const line = cols.map(([n, w]) => n.padEnd(w)).join('│ ')
  console.log(line)
  console.log(cols.map(([, w]) => '─'.repeat(w)).join('┼─'))

  for (const r of results) {
    const row = [
      r.fixture.padEnd(24).slice(0, 24),
      String(r.run).padEnd(5),
      String(r.atoms).padEnd(6),
      String(r.relations).padEnd(5),
      r.recall.toFixed(2).padEnd(7),
      r.typeAccuracy.toFixed(2).padEnd(7),
      (r.schemaCompliant ? 'ok' : 'X').padEnd(7),
      (r.grounded ? 'ok' : 'X').padEnd(7),
      String(r.elapsedMs).padEnd(7),
      String(r.outputChars).padEnd(7),
      (r.pass ? 'PASS' : 'FAIL').padEnd(6),
    ]
    console.log(row.join('│ '))
  }
}

function summarizeVariance(results: RunResult[]) {
  // fixture 별 그룹 → 통계
  const byFixture = new Map<string, RunResult[]>()
  for (const r of results) {
    const arr = byFixture.get(r.fixture) ?? []
    arr.push(r)
    byFixture.set(r.fixture, arr)
  }

  console.log('\n=== Variance Summary (run-to-run) ===')
  for (const [fixture, rs] of byFixture) {
    if (rs.length < 2) continue
    const atoms = rs.map(r => r.atoms)
    const recalls = rs.map(r => r.recall)
    const elapsed = rs.map(r => r.elapsedMs)
    const pass = rs.filter(r => r.pass).length
    console.log(`  ${fixture}: ${pass}/${rs.length} PASS`)
    console.log(`    atoms   range [${Math.min(...atoms)}~${Math.max(...atoms)}]`)
    console.log(`    recall  range [${Math.min(...recalls).toFixed(2)}~${Math.max(...recalls).toFixed(2)}]`)
    console.log(`    elapsed range [${Math.min(...elapsed)}~${Math.max(...elapsed)}]ms`)
  }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY 가 .env.local 에 없음')
    process.exit(1)
  }
  process.env.DRAFT_LOG_USAGE = '1'

  const { runs, only } = parseArgs()

  const fixtures = readdirSync(FIXTURES_ROOT)
    .filter(name => {
      const p = join(FIXTURES_ROOT, name)
      return statSync(p).isDirectory() &&
        existsSync(join(p, 'sample_report_input.md')) &&
        existsSync(join(p, 'expected_atoms.json'))
    })
    .filter(name => !only || name === only)

  if (fixtures.length === 0) {
    console.error(only ? `fixture "${only}" 못 찾음` : 'fixture 디렉토리 비어있음')
    process.exit(1)
  }

  console.log(`▶ Fixtures: ${fixtures.join(', ')}`)
  console.log(`▶ Runs per fixture: ${runs}`)
  console.log('')

  const results: RunResult[] = []
  for (const name of fixtures) {
    const dir = join(FIXTURES_ROOT, name)
    for (let r = 1; r <= runs; r++) {
      console.log(`─── ${name} (run ${r}/${runs}) ───`)
      try {
        const result = await runOne(dir, name, r)
        results.push(result)
      } catch (e) {
        console.error(`  실패: ${(e as Error).message}`)
        results.push({
          fixture: name,
          run: r,
          atoms: 0,
          relations: 0,
          recall: 0,
          typeAccuracy: 0,
          schemaCompliant: false,
          grounded: false,
          elapsedMs: 0,
          outputChars: 0,
          pass: false,
          issuesCount: 0,
        })
      }
    }
  }

  console.log('\n=== Results ===')
  formatTable(results)
  if (runs > 1) summarizeVariance(results)

  // FAIL 한 run 의 first 3 issues 출력 (디버깅)
  const fails = results.filter(r => !r.pass && r.issuesCount > 0)
  if (fails.length > 0) {
    console.log('\n=== FAIL diagnostics (first run per fixture) ===')
    const seen = new Set<string>()
    for (const f of fails) {
      if (seen.has(f.fixture)) continue
      seen.add(f.fixture)
      const dir = join(FIXTURES_ROOT, f.fixture)
      const actualPath = join(dir, 'actual_extracted.json')
      if (existsSync(actualPath)) {
        // actual 만 있음; issues 는 별도 저장 X. 대신 검증 다시 안 돌리고
        // 사용자가 actual_extracted.json 으로 atom 직접 확인 가능
        console.log(`  ${f.fixture}: actual atoms saved → ${actualPath}`)
      }
    }
  }

  const allPass = results.every(r => r.pass)
  const passCount = results.filter(r => r.pass).length
  console.log(`\n${allPass ? 'ALL PASS' : 'PARTIAL/FAIL'} — ${passCount}/${results.length}`)
  process.exit(allPass ? 0 : 1)
}

main().catch(e => {
  console.error('verify_extractor failed:', e.message)
  if (e.stack) console.error(e.stack)
  process.exit(1)
})
