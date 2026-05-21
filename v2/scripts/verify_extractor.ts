#!/usr/bin/env node
/**
 * M6 Task Extractor 검증 스크립트.
 *
 * fixture (sample_flip3_w2) 의 markdown 을 task_extractor.ts 로 추출 →
 * expected_atoms.json 의 validation_targets 비교.
 *
 * 사용:
 *   pnpm exec tsx scripts/verify_extractor.ts
 *
 * 비용: Haiku 4.5 1회 호출 (~1500 input + ~3000 output tokens ≈ $0.005)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { extractFromText } from '../glossary/pipeline/task_extractor'

// 의도: dotenv 추가 dependency 회피 — .env.local 직접 파싱 (key=value, # 주석 skip)
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

const FIXTURE_DIR = join(process.cwd(), 'glossary', 'fixtures', 'sample_flip3_w2')

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY 가 .env.local 에 없음')
    process.exit(1)
  }

  const text = readFileSync(join(FIXTURE_DIR, 'sample_report_input.md'), 'utf-8')
  const expected = JSON.parse(readFileSync(join(FIXTURE_DIR, 'expected_atoms.json'), 'utf-8'))
  const fileId = expected.$source_file.id as string

  console.log(`▶ Extracting from ${expected.$source_file.filename}...`)
  const t0 = Date.now()
  const result = await extractFromText(text, fileId)
  const ms = Date.now() - t0

  // expected vs actual atom counts per AtomType
  const expectedCounts = expected.expected_counts as Record<string, number>
  const actualCounts: Record<string, number> = {}
  for (const a of result.atoms) {
    actualCounts[a.type] = (actualCounts[a.type] ?? 0) + 1
  }

  const allTypes = Object.keys(expectedCounts).filter(k => !k.startsWith('_'))

  console.log('\n=== AtomType Counts (expected → actual) ===')
  let typeMatchCount = 0
  let typeTotalCount = 0
  for (const t of allTypes) {
    const exp = expectedCounts[t]
    const act = actualCounts[t] ?? 0
    const diff = act - exp
    const mark = Math.abs(diff) <= 1 ? '✓' : '✗'
    if (exp > 0 || act > 0) {
      console.log(`  ${mark} ${t.padEnd(14)} ${exp} → ${act}${diff !== 0 ? ` (${diff > 0 ? '+' : ''}${diff})` : ''}`)
      typeTotalCount++
      if (Math.abs(diff) <= 1) typeMatchCount++
    }
  }

  // recall: 얼마나 많은 expected AtomType bucket 을 채웠는지
  const expectedTotalAtoms = expectedCounts._total_atoms ?? 24
  const actualTotalAtoms = result.atoms.length
  const recall = Math.min(1, actualTotalAtoms / expectedTotalAtoms)

  // validation 결과
  console.log('\n=== Validation ===')
  console.log(`  schema_compliant: ${result.validation.schema_compliant ? '✓' : '✗'} (target 1.0)`)
  console.log(`  grounded:         ${result.validation.grounded ? '✓' : '✗'} (target hallucination < 0.05)`)
  console.log(`  total atoms:      ${actualTotalAtoms} / ${expectedTotalAtoms} (recall ≈ ${recall.toFixed(2)})`)
  console.log(`  total relations:  ${result.relations.length} / ${expectedCounts._total_relations}`)
  console.log(`  type match rate:  ${typeMatchCount}/${typeTotalCount} (${((typeMatchCount / typeTotalCount) * 100).toFixed(0)}%)`)
  console.log(`  elapsed:          ${ms} ms`)

  if (result.validation.issues.length > 0) {
    console.log('\n=== Issues (first 5) ===')
    result.validation.issues.slice(0, 5).forEach(i => console.log(`  - ${i}`))
    if (result.validation.issues.length > 5) {
      console.log(`  ... + ${result.validation.issues.length - 5} more`)
    }
  }

  // raw 결과를 디버그용으로 저장
  const outPath = join(FIXTURE_DIR, 'actual_extracted.json')
  writeFileSync(outPath, JSON.stringify({ atoms: result.atoms, relations: result.relations }, null, 2))
  console.log(`\n💾 Saved actual output to ${outPath}`)

  // 최종 PASS/FAIL
  const targets = expected.validation_targets
  const pass =
    result.validation.schema_compliant &&
    result.validation.grounded &&
    recall >= targets.recall_min &&
    typeMatchCount / typeTotalCount >= targets.type_classification_accuracy_min

  console.log(`\n${pass ? '✅ PASS' : '⚠️  PARTIAL / FAIL'} — extractor verified against fixture`)
  process.exit(pass ? 0 : 1)
}

main().catch(e => {
  console.error('❌ verify_extractor failed:', e.message)
  if (e.stack) console.error(e.stack)
  process.exit(1)
})
