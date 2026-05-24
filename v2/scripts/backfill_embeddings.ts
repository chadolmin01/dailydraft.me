#!/usr/bin/env node
/**
 * Backfill: 기존 처리된 파일들에 file_chunks + embedding 채움.
 *
 * 의도: Step 1 마이그레이션 후 file_chunks 테이블은 비어있음. 이미 처리된
 *       파일들 (processed_files 의 parsed_text 있는 것) 에 retroactively chunk +
 *       embedding 생성 → chat 의 search_file_contents 가 기존 파일도 검색 가능.
 *       신규 처리 파일은 process-pipeline 이 자동 처리.
 *
 * 사용:
 *   pnpm exec tsx scripts/backfill_embeddings.ts                # 전체
 *   pnpm exec tsx scripts/backfill_embeddings.ts --limit 10     # 처음 10개만
 *   pnpm exec tsx scripts/backfill_embeddings.ts --dry-run      # 비용 추정만
 *   pnpm exec tsx scripts/backfill_embeddings.ts --workspace UUID
 *
 * 비용: 파일당 ~0.1원 (Google text-embedding-004, 50KB 기준).
 *       100 파일 = 약 10원. 1000 파일 = 약 100원.
 *
 * 안전: 이미 chunk 있는 파일은 skip. 중복 처리 방지.
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { splitIntoChunks, embedChunks } from '../src/lib/m6/embedding'

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
  let limit: number | undefined
  let workspace: string | undefined
  let dryRun = false
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) limit = parseInt(args[++i], 10)
    else if (args[i] === '--workspace' && args[i + 1]) workspace = args[++i]
    else if (args[i] === '--dry-run') dryRun = true
  }
  return { limit, workspace, dryRun }
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 .env.local 에 없음')
    process.exit(1)
  }
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY 가 .env.local 에 없음 — embedding 생성 불가')
    process.exit(1)
  }

  const { limit, workspace, dryRun } = parseArgs()
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  // 1) parsed_text 있고 chunk 아직 없는 파일들 select.
  //    NOT EXISTS subquery 로 chunk 존재 여부 체크 (lateral join 보다 간단).
  let query = admin
    .from('processed_files')
    .select('id, workspace_id, filename, parsed_text')
    .not('parsed_text', 'is', null)
    .order('created_at', { ascending: false })
  if (workspace) query = query.eq('workspace_id', workspace)
  if (limit) query = query.limit(limit)
  else query = query.limit(1000) // 안전 cap

  const { data: candidates, error } = await query
  if (error) {
    console.error('쿼리 실패:', error.message)
    process.exit(1)
  }

  // 2) 각 파일에 이미 chunk 있는지 확인 → skip.
  const ids = (candidates ?? []).map(c => c.id)
  if (ids.length === 0) {
    console.log('parsed_text 있는 파일 없음.')
    process.exit(0)
  }
  const { data: existingChunks } = await admin
    .from('file_chunks')
    .select('processed_file_id')
    .in('processed_file_id', ids)
  const skipSet = new Set((existingChunks ?? []).map(r => r.processed_file_id))
  const todo = (candidates ?? []).filter(c => !skipSet.has(c.id) && c.parsed_text)

  console.log(`총 ${candidates?.length ?? 0}개 후보 중 chunk 없는 것 ${todo.length}개.`)

  // 3) 비용 추정
  const totalChars = todo.reduce((s, f) => s + (f.parsed_text?.length ?? 0), 0)
  const estTokens = Math.ceil(totalChars / 4) // 한국어 대략 4 char/token
  const estCostUSD = (estTokens / 1_000_000) * 0.006 // text-embedding-004
  console.log(`예상: ${totalChars.toLocaleString()} chars, ~${estTokens.toLocaleString()} tokens, ~$${estCostUSD.toFixed(4)} (${Math.ceil(estCostUSD * 1300)} 원)`)

  if (dryRun) {
    console.log('--dry-run: 실제 embedding 생성 안 함.')
    process.exit(0)
  }

  // 4) 순차 처리 (rate limit 안전). 파일별 chunk + embed + insert.
  let success = 0
  let failed = 0
  for (let i = 0; i < todo.length; i++) {
    const f = todo[i]
    process.stdout.write(`[${i + 1}/${todo.length}] ${f.filename} ... `)
    try {
      const chunks = splitIntoChunks(f.parsed_text ?? '')
      if (chunks.length === 0) {
        console.log('skip (빈 텍스트)')
        continue
      }
      const embeddings = await embedChunks(chunks)
      const rows = chunks.map((content, idx) => ({
        workspace_id: f.workspace_id,
        processed_file_id: f.id,
        chunk_index: idx,
        content,
        embedding: embeddings[idx] as unknown as string,
        token_count: Math.ceil(content.length / 4),
      }))
      const { error: insErr } = await admin.from('file_chunks').insert(rows)
      if (insErr) throw new Error(insErr.message)
      console.log(`✓ ${chunks.length} chunks`)
      success++
    } catch (e) {
      console.log(`✗ ${(e as Error).message}`)
      failed++
    }
  }

  console.log(`\n완료: ${success} 성공, ${failed} 실패`)
}

main().catch(e => {
  console.error('backfill_embeddings 실패:', e.message)
  process.exit(1)
})
