#!/usr/bin/env node
/**
 * 실데이터 운영 검증 도구 — processed_files 테이블 집계.
 *
 * 의도: batch 처리 후 한 번 실행 → 진짜 실패 패턴 표로.
 *       LLM 호출 0. DB read only. 비용 0.
 *
 * 사용:
 *   pnpm exec tsx scripts/audit_processing.ts                  # 전체 워크스페이스
 *   pnpm exec tsx scripts/audit_processing.ts --workspace UUID # 특정 워크스페이스
 *   pnpm exec tsx scripts/audit_processing.ts --days 7         # 최근 7일만
 *
 * 출력:
 *   1. 전체 통계 (성공/실패/empty/pending 비율)
 *   2. mime_type 별 성공률
 *   3. parsing_error 메시지 분포 (Top 10) — 실패 모드 식별
 *   4. atom_count 분포 (mime_type 별 평균/중앙값)
 *   5. 처리 시간 추세 (마지막 N일)
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

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

function parseArgs() {
  const args = process.argv.slice(2)
  let workspace: string | undefined
  let days: number | undefined
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--workspace' && args[i + 1]) workspace = args[++i]
    else if (args[i] === '--days' && args[i + 1]) days = parseInt(args[++i], 10)
  }
  return { workspace, days }
}

interface ProcessedRow {
  id: string
  workspace_id: string
  filename: string
  mime_type: string
  size_bytes: number | null
  parsing_completed_at: string | null
  parsing_error: string | null
  atom_count: number
  relation_count: number
  created_at: string
  updated_at: string
}

// status 분류: 단순 boolean 4가지로 압축.
function classify(r: ProcessedRow): 'success' | 'failed' | 'empty' | 'pending' {
  if (!r.parsing_completed_at) return 'pending'
  if (r.parsing_error) return 'failed'
  if (r.atom_count === 0) return 'empty'
  return 'success'
}

// 처리 시간 (created_at → parsing_completed_at).
function processingMs(r: ProcessedRow): number | null {
  if (!r.parsing_completed_at) return null
  return new Date(r.parsing_completed_at).getTime() - new Date(r.created_at).getTime()
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function pct(n: number, total: number): string {
  return total === 0 ? '0%' : `${((n / total) * 100).toFixed(1)}%`
}

// parsing_error 메시지 정규화 — UUID/타임스탬프/숫자 제거해서 같은 패턴끼리 그룹.
function normalizeError(msg: string): string {
  return msg
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<uuid>')
    .replace(/\b\d{10,}\b/g, '<n>')
    .replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '<ts>')
    .slice(0, 120)
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 .env.local 에 없음')
    process.exit(1)
  }

  const { workspace, days } = parseArgs()
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  // 조건 빌더
  let query = admin
    .from('processed_files')
    .select('id, workspace_id, filename, mime_type, size_bytes, parsing_completed_at, parsing_error, atom_count, relation_count, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(5000)
  if (workspace) query = query.eq('workspace_id', workspace)
  if (days) {
    const since = new Date(Date.now() - days * 86400_000).toISOString()
    query = query.gte('created_at', since)
  }

  const { data, error } = await query
  if (error) {
    console.error('쿼리 실패:', error.message)
    process.exit(1)
  }
  const rows = (data ?? []) as ProcessedRow[]

  if (rows.length === 0) {
    console.log('처리된 파일 없음 (조건 일치).')
    process.exit(0)
  }

  // === 1. 전체 통계 ===
  const classified = rows.map(r => ({ row: r, status: classify(r) }))
  const counts = {
    success: classified.filter(c => c.status === 'success').length,
    failed: classified.filter(c => c.status === 'failed').length,
    empty: classified.filter(c => c.status === 'empty').length,
    pending: classified.filter(c => c.status === 'pending').length,
  }
  const total = rows.length

  console.log(`=== 전체 통계 (n=${total}${days ? `, 최근 ${days}일` : ''}${workspace ? `, workspace=${workspace.slice(0, 8)}…` : ''}) ===`)
  console.log(`  success  ${String(counts.success).padStart(4)} (${pct(counts.success, total)})`)
  console.log(`  failed   ${String(counts.failed).padStart(4)} (${pct(counts.failed, total)})  ← parsing_error`)
  console.log(`  empty    ${String(counts.empty).padStart(4)} (${pct(counts.empty, total)})  ← 처리 됐지만 atom 0`)
  console.log(`  pending  ${String(counts.pending).padStart(4)} (${pct(counts.pending, total)})  ← 아직 처리 안 됨`)

  // === 2. mime_type 별 성공률 ===
  console.log('\n=== mime_type 별 (성공률) ===')
  const byMime = new Map<string, ProcessedRow[]>()
  for (const r of rows) {
    const arr = byMime.get(r.mime_type) ?? []
    arr.push(r)
    byMime.set(r.mime_type, arr)
  }
  const mimeRows = [...byMime.entries()].map(([mime, items]) => {
    const successN = items.filter(r => classify(r) === 'success').length
    const emptyN = items.filter(r => classify(r) === 'empty').length
    const failedN = items.filter(r => classify(r) === 'failed').length
    return { mime: mime.replace('application/vnd.openxmlformats-officedocument.', '…'), total: items.length, success: successN, empty: emptyN, failed: failedN }
  }).sort((a, b) => b.total - a.total)

  console.log('  mime'.padEnd(48) + 'total  succ  empty  fail  성공률')
  console.log('  ' + '─'.repeat(80))
  for (const m of mimeRows) {
    const rate = m.total > 0 ? pct(m.success, m.total) : '0%'
    console.log(`  ${m.mime.slice(0, 46).padEnd(46)} ${String(m.total).padStart(5)}  ${String(m.success).padStart(4)}  ${String(m.empty).padStart(5)}  ${String(m.failed).padStart(4)}  ${rate}`)
  }

  // === 3. parsing_error 메시지 분포 (Top 10) ===
  const errorRows = classified.filter(c => c.status === 'failed').map(c => c.row.parsing_error!)
  if (errorRows.length > 0) {
    console.log(`\n=== 실패 메시지 분포 (Top 10, n=${errorRows.length}) ===`)
    const errorCounts = new Map<string, number>()
    for (const e of errorRows) {
      const norm = normalizeError(e)
      errorCounts.set(norm, (errorCounts.get(norm) ?? 0) + 1)
    }
    const top = [...errorCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
    for (const [msg, n] of top) {
      console.log(`  ${String(n).padStart(3)}× ${msg}`)
    }
  }

  // === 4. atom_count 분포 (mime_type 별 평균/중앙값) ===
  console.log('\n=== Atom 수 분포 (성공만, mime_type 별) ===')
  console.log('  mime'.padEnd(48) + 'n     avg    med    min  max')
  console.log('  ' + '─'.repeat(80))
  for (const [mime, items] of byMime) {
    const succ = items.filter(r => classify(r) === 'success').map(r => r.atom_count)
    if (succ.length === 0) continue
    const avg = succ.reduce((a, b) => a + b, 0) / succ.length
    const med = median(succ)
    console.log(`  ${mime.replace('application/vnd.openxmlformats-officedocument.', '…').slice(0, 46).padEnd(46)} ${String(succ.length).padStart(4)}  ${avg.toFixed(1).padStart(5)}  ${med.toFixed(1).padStart(5)}  ${String(Math.min(...succ)).padStart(3)}  ${String(Math.max(...succ)).padStart(3)}`)
  }

  // === 5. 처리 시간 분포 ===
  const successMs = classified
    .filter(c => c.status === 'success')
    .map(c => processingMs(c.row))
    .filter((n): n is number => n !== null && n > 0)
  if (successMs.length > 0) {
    console.log('\n=== 처리 시간 (성공만, ms) ===')
    const avg = successMs.reduce((a, b) => a + b, 0) / successMs.length
    const med = median(successMs)
    const max = Math.max(...successMs)
    console.log(`  n=${successMs.length}  avg=${avg.toFixed(0)}  med=${med.toFixed(0)}  max=${max}`)
    // Vercel 60s 한계 근접 경고
    const near60s = successMs.filter(n => n > 45_000).length
    if (near60s > 0) {
      console.log(`  주의: ${near60s}개 파일이 45초 초과 (Vercel 60s 한계 근접)`)
    }
  }

  // === 6. 권고 ===
  console.log('\n=== 권고 ===')
  if (counts.failed / total > 0.1) {
    console.log(`  실패율 ${pct(counts.failed, total)} — 10% 초과. 위 메시지 분포에서 Top 패턴 우선 fix.`)
  }
  if (counts.empty / total > 0.2) {
    console.log(`  empty 비율 ${pct(counts.empty, total)} — 20% 초과. 이미지 PDF (OCR 필요) / 빈 문서 다수 가능성.`)
  }
  if (counts.pending > 0) {
    console.log(`  pending ${counts.pending}개 — cron 누락 or 매니저 미실행. /api/cron/drive-sync 점검.`)
  }
  if (counts.success / total > 0.8 && total >= 10) {
    console.log(`  성공률 ${pct(counts.success, total)} — 안정. 다음 단계 (atom 검수/수정 UI 등) 진행 가능.`)
  }
}

main().catch(e => {
  console.error('audit_processing failed:', e.message)
  process.exit(1)
})
