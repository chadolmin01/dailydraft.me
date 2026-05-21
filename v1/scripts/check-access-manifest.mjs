#!/usr/bin/env node
/**
 * Access Manifest 커버리지 체크.
 * `app/**\/page.tsx` 전수 scan 후 `src/lib/access/manifest.ts` 에
 * 등록 안 된 라우트 있으면 실패 (exit 1).
 *
 * 왜: 새 페이지 추가 시 접근 정책 분류를 강제. public/auth 경계 혼동 방지.
 * CI 에서 실행: build-check.yml 에 추가 예정.
 */
import { readFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { glob } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// ── 1. manifest 에서 등록된 패턴 추출 ─────────────────────
const manifestSrc = readFileSync(resolve(root, 'src/lib/access/manifest.ts'), 'utf8')
const patterns = [
  ...manifestSrc.matchAll(/pattern:\s*'([^']+)'/g),
].map((m) => m[1])

if (patterns.length === 0) {
  console.error('❌ manifest.ts 에서 pattern 을 하나도 찾지 못했습니다. 구조 변경됐나?')
  process.exit(1)
}

// ── 2. app/**/page.tsx 전수 scan → 라우트 경로 추출 ──────
// app/(group)/foo/bar/page.tsx  →  /foo/bar
// app/[slug]/page.tsx           →  /:slug
async function findPages() {
  const out = []
  for await (const entry of glob('app/**/page.tsx', { cwd: root })) {
    out.push(entry)
  }
  return out
}

function filePathToRoute(filePath) {
  // Windows 백슬래시 정규화
  const normalized = filePath.replace(/\\/g, '/')
  const trimmed = normalized.replace(/^app\//, '').replace(/\/page\.tsx$/, '')
  if (trimmed === 'page.tsx' || trimmed === '') return '/'
  const parts = trimmed
    .split('/')
    .filter((p) => !(p.startsWith('(') && p.endsWith(')'))) // 라우트 그룹 제거
    .map((p) => p.replace(/^\[(\.\.\.)?(\w+)\]$/, ':$2')) // [slug] → :slug
  return '/' + parts.join('/')
}

// ── 3. 각 라우트가 manifest 에 있는지 확인 ────────────────
function matchPattern(pattern, pathname) {
  if (pattern === pathname) return true
  const pp = pattern.split('/').filter(Boolean)
  const rp = pathname.split('/').filter(Boolean)
  if (pp[pp.length - 1] === '*') {
    const prefix = pp.slice(0, -1)
    if (rp.length < prefix.length) return false
    return prefix.every((p, i) => p.startsWith(':') || p === rp[i])
  }
  if (pp.length !== rp.length) return false
  return pp.every((p, i) => p.startsWith(':') || p === rp[i])
}

const pages = await findPages()
const missing = []
const routes = pages.map(filePathToRoute).sort()

for (const route of routes) {
  const matched = patterns.some((p) => matchPattern(p, route))
  if (!matched) missing.push(route)
}

// ── 4. 결과 ──────────────────────────────────────────────
console.log(`\n=== Access Manifest Coverage ===`)
console.log(`Total routes: ${routes.length}`)
console.log(`Manifest patterns: ${patterns.length}`)
console.log(`Missing from manifest: ${missing.length}`)

if (missing.length > 0) {
  console.error(`\n❌ 다음 라우트가 manifest 에 없습니다:\n`)
  for (const r of missing) console.error(`   ${r}`)
  console.error(`\n→ src/lib/access/manifest.ts 의 ACCESS_MANIFEST 에 추가하세요.`)
  console.error(`  적합한 tier 선택은 docs/ACCESS_POLICY.md 참조.`)
  process.exit(1)
}

console.log('✅ 모든 페이지가 manifest 에 등록됐습니다.\n')
