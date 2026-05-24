// 공유 처리 파이프라인 — 3개 라우트 (per-file POST, cron, 수동 sync) 동일 로직 통합.
// 의도: 처리 흐름 변경 시 1곳만 수정. 버그도 한 곳에서 잡힘.
//
// 단계: upsert pending row → 기존 atom 삭제 → download → parse → extract → insert.
// 실패 시 parsing_error 에 사유 저장 (throw 안 함 — 호출자가 결과 보고 판단).

import { createAdminClient } from '@/src/lib/supabase/admin'
import { downloadFile } from '@/src/lib/google/drive-download'
import { parseBuffer } from '@/src/lib/parsers/binary-parser'
import { extractFromText } from '@/glossary/pipeline/task_extractor'
import { splitIntoChunks, embedChunks } from '@/src/lib/m6/embedding'
import type { Json } from '@/src/types/database'

type Admin = ReturnType<typeof createAdminClient>

export interface ProcessOptions {
  admin: Admin
  workspaceId: string
  folderId: string
  accessToken: string
  driveFileId: string
  filename: string
  mimeType: string
  sizeBytes: number | null
  driveModifiedAt: string | null
}

export interface ProcessResult {
  processedFileId: string
  status: 'ok' | 'empty' | 'failed'
  atomCount: number
  relationCount: number
  /** RAG chunk 수 (embedding 성공한 chunk). 0 이면 chat 의 본문 검색 불가, atom 검색만 가능. */
  chunkCount?: number
  error?: string
}

export async function processDriveFile(opts: ProcessOptions): Promise<ProcessResult> {
  const { admin } = opts

  const { data: pending, error: pendingErr } = await admin
    .from('processed_files')
    .upsert(
      {
        workspace_id: opts.workspaceId,
        folder_id: opts.folderId,
        drive_file_id: opts.driveFileId,
        filename: opts.filename,
        mime_type: opts.mimeType,
        size_bytes: opts.sizeBytes,
        drive_modified_at: opts.driveModifiedAt,
        parsing_completed_at: null,
        parsing_error: null,
        atom_count: 0,
        relation_count: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'workspace_id,drive_file_id' },
    )
    .select('id')
    .single()
  if (pendingErr || !pending) {
    throw new Error(pendingErr?.message ?? 'processed_files upsert 실패')
  }
  const processedFileId = pending.id as string

  // 재처리 시 기존 결과 정리
  await admin.from('extracted_relations').delete().eq('processed_file_id', processedFileId)
  await admin.from('extracted_atoms').delete().eq('processed_file_id', processedFileId)

  try {
    const { buffer, effectiveMime } = await downloadFile(
      opts.accessToken,
      opts.driveFileId,
      opts.mimeType,
    )
    const parsed = await parseBuffer(buffer, effectiveMime)
    if (!parsed.text.trim()) {
      await admin
        .from('processed_files')
        .update({
          parsing_error: '추출된 텍스트가 비어 있습니다',
          parsing_completed_at: new Date().toISOString(),
        })
        .eq('id', processedFileId)
      return { processedFileId, status: 'empty', atomCount: 0, relationCount: 0 }
    }

    const extraction = await extractFromText(parsed.text, opts.driveFileId)

    const atomRows = extraction.atoms.map(a => ({
      workspace_id: opts.workspaceId,
      processed_file_id: processedFileId,
      local_id: a.id,
      type: a.type,
      content: a.content,
      attributes: a.attributes as unknown as Json,
      provenance: a.provenance as unknown as Json,
      confidence: a.confidence,
    }))

    const localToDbId = new Map<string, string>()
    if (atomRows.length > 0) {
      const { data: inserted, error: aErr } = await admin
        .from('extracted_atoms')
        .insert(atomRows)
        .select('id, local_id')
      if (aErr) throw new Error(`atom insert: ${aErr.message}`)
      for (const row of inserted ?? []) localToDbId.set(row.local_id, row.id)
    }

    const relRows = extraction.relations
      .map(r => {
        const f = localToDbId.get(r.from)
        const t = localToDbId.get(r.to)
        if (!f || !t) return null
        return {
          workspace_id: opts.workspaceId,
          processed_file_id: processedFileId,
          from_atom_id: f,
          to_atom_id: t,
          type: r.type,
          confidence: r.confidence,
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)

    if (relRows.length > 0) {
      const { error: rErr } = await admin.from('extracted_relations').insert(relRows)
      if (rErr) throw new Error(`relation insert: ${rErr.message}`)
    }

    const parsedTextSlice = parsed.text.slice(0, 200_000)
    await admin
      .from('processed_files')
      .update({
        parsed_text: parsedTextSlice,
        parsing_completed_at: new Date().toISOString(),
        parsing_error: null,
        atom_count: extraction.atoms.length,
        relation_count: relRows.length,
      })
      .eq('id', processedFileId)

    // RAG: chunk + embedding 저장.
    // 의도: chat 의 search_file_contents tool 이 본문 검색하려면 chunk 필요.
    //       실패해도 atom/parsing 결과는 유지 — chunk 없으면 chat 의 atom 검색만 작동 (degraded).
    //       Vercel maxDuration 60s 안에서 embedding 호출 1~3초 (50KB 기준) 추가 부담.
    let chunkCount = 0
    try {
      // 기존 chunk 정리 (재처리 시 중복 방지). embedding 새로 생성.
      await admin.from('file_chunks').delete().eq('processed_file_id', processedFileId)
      const chunks = splitIntoChunks(parsedTextSlice)
      if (chunks.length > 0) {
        const embeddings = await embedChunks(chunks)
        const chunkRows = chunks.map((content, idx) => ({
          workspace_id: opts.workspaceId,
          processed_file_id: processedFileId,
          chunk_index: idx,
          content,
          embedding: embeddings[idx] as unknown as string, // pgvector 컬럼에 array 넘기면 자동 변환
          token_count: Math.ceil(content.length / 4),
        }))
        const { error: cErr } = await admin.from('file_chunks').insert(chunkRows)
        if (cErr) throw new Error(`chunk insert: ${cErr.message}`)
        chunkCount = chunks.length
      }
    } catch (e) {
      // chunk 실패는 silent — atom 만 있어도 chat 일부 가능.
      // eslint-disable-next-line no-console
      console.error(`[chunk embedding] file ${processedFileId} 실패:`, (e as Error).message)
    }

    return {
      processedFileId,
      status: 'ok',
      atomCount: extraction.atoms.length,
      relationCount: relRows.length,
      chunkCount,
    }
  } catch (e) {
    const msg = (e as Error).message
    await admin
      .from('processed_files')
      .update({
        parsing_error: msg.slice(0, 500),
        parsing_completed_at: new Date().toISOString(),
      })
      .eq('id', processedFileId)
    return { processedFileId, status: 'failed', atomCount: 0, relationCount: 0, error: msg }
  }
}
