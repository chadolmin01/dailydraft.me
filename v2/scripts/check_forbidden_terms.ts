#!/usr/bin/env node
/**
 * M6 Glossary 4중 방어선 #1: 빌드 게이트.
 *
 * codebase 에서 forbidden 동의어 사용 검출 → exit 1 (빌드 fail).
 * 참조: glossary/M6_Glossary_v1.1.md (Forbidden Terms 섹션).
 *
 * 실행:
 *   pnpm exec tsx scripts/check_forbidden_terms.ts
 *   (또는 CI 의 lint 단계에서 자동)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

// glossary/M6_Glossary_v1.1.md 의 "Replaces:" 라인에서 추출한 forbidden 동의어들.
// 새 forbidden term 발견 시 glossary 업데이트 → 여기 동기화.
const FORBIDDEN: Array<{ term: string; preferred: string; reason: string }> = [
  // Tier 1 — Semantic Model
  { term: 'AKU', preferred: 'Atom', reason: '글로서리 v1.0 폐기 용어' },
  { term: 'atomic_unit', preferred: 'Atom', reason: 'snake_case 변형 금지' },
  { term: 'AtomicUnit', preferred: 'Atom', reason: 'PascalCase 변형 금지' },
  { term: 'Molecule', preferred: 'Triple / Composition', reason: '오해 유발 용어' },
  { term: 'Document(v1)', preferred: 'File', reason: 'v1 에서 File 만 사용' },
  { term: 'Chunk', preferred: 'Atom', reason: '의미 단위가 아닌 길이 단위' },
  { term: 'Quadruple', preferred: '(Tier 1 외)', reason: 'Tier 1 v1.1 에 미정의' },
  { term: 'Propositioner', preferred: 'Extractor', reason: 'v1.1 에서 Extractor 로 통일' },
  // 자주 혼동되는 한국어
  { term: '원자', preferred: 'Atom 또는 글로서리의 한국어 라벨', reason: 'glossary Tier 7 의 한국어 라벨 사용' },
  { term: 'atom_type', preferred: 'AtomType', reason: 'PascalCase' },
  { term: 'relation_type', preferred: 'RelationType', reason: 'PascalCase' },
]

// 스캔 대상 / 제외
const ROOT = process.cwd()
const SCAN_DIRS = ['app', 'src', 'glossary', 'supabase']
const SCAN_EXTS = new Set(['.ts', '.tsx', '.md', '.sql'])
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.test\.tsx?$/,                          // 테스트 내부 forbidden 언급은 허용 (검증용)
  /check_forbidden_terms\.ts$/,             // 자기 자신
  /M6_Glossary_v1\.1\.md$/,                 // 글로서리 자체는 forbidden term 정의를 포함
  /system_prompt_glossary\.md$/,            // 시스템 프롬프트도 정의 포함
  /glossary[\/\\]glossary\.ts$/,            // glossary.ts 의 forbidden 정의 자체
  /README_for_cli\.md$/,                    // fixture README 도 forbidden 목록 인용
]

interface Violation {
  file: string
  line: number
  col: number
  term: string
  preferred: string
  reason: string
  context: string
}

function walk(dir: string, out: string[]) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (EXCLUDE_PATTERNS.some(p => p.test(full))) continue
    const stat = statSync(full)
    if (stat.isDirectory()) walk(full, out)
    else if (SCAN_EXTS.has(full.slice(full.lastIndexOf('.')))) out.push(full)
  }
}

function checkFile(file: string): Violation[] {
  const text = readFileSync(file, 'utf-8')
  const lines = text.split('\n')
  const violations: Violation[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const { term, preferred, reason } of FORBIDDEN) {
      // 단어 경계 매칭 — 부분 매칭 (예: AtomType 에 Atom 포함) 은 제외
      const re = new RegExp(`(?<![A-Za-z0-9_가-힣])${escapeRegex(term)}(?![A-Za-z0-9_가-힣])`, 'g')
      let m: RegExpExecArray | null
      while ((m = re.exec(line)) !== null) {
        violations.push({
          file: relative(ROOT, file).replace(/\\/g, '/'),
          line: i + 1,
          col: m.index + 1,
          term,
          preferred,
          reason,
          context: line.trim().slice(0, 120),
        })
      }
    }
  }
  return violations
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function main() {
  const files: string[] = []
  for (const d of SCAN_DIRS) {
    const abs = join(ROOT, d)
    try {
      const stat = statSync(abs)
      if (stat.isDirectory()) walk(abs, files)
    } catch {
      // 폴더 없으면 skip
    }
  }

  const allViolations: Violation[] = []
  for (const f of files) {
    allViolations.push(...checkFile(f))
  }

  if (allViolations.length === 0) {
    console.log(`✓ Forbidden terms check passed (${files.length} files scanned)`)
    process.exit(0)
  }

  console.error(`✗ ${allViolations.length} forbidden term violations found:\n`)
  for (const v of allViolations) {
    console.error(`  ${v.file}:${v.line}:${v.col}`)
    console.error(`    "${v.term}" → "${v.preferred}" (${v.reason})`)
    console.error(`    | ${v.context}`)
    console.error('')
  }
  console.error(`총 ${allViolations.length}개 위반. 글로서리 v1.1 의 정식 용어로 교체하거나, 글로서리 자체를 업데이트.`)
  process.exit(1)
}

main()
