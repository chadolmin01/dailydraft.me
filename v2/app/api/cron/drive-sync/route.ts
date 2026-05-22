// GET /api/cron/drive-sync
//
// Vercel cron 호출용. 각 워크스페이스의 폴더를 순회하면서
// Drive 의 modifiedTime 이 last_synced_at 이후인 파일을 찾아 처리.
//
// 보안: 헤더 `Authorization: Bearer <CRON_SECRET>` 일치 시만 실행.
// 미설정 시엔 차단 (PoC 안전장치).
//
// 부하: 워크스페이스 × 폴더당 list 1번. 새 파일만 download+parse+LLM.

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { getValidAccessToken } from '@/src/lib/google/tokens'
import { listFolderFiles } from '@/src/lib/google/drive'
import { downloadFile } from '@/src/lib/google/drive-download'
import { parseBuffer } from '@/src/lib/parsers/binary-parser'
import { extractFromText } from '@/glossary/pipeline/task_extractor'
import type { Json } from '@/src/types/database'

export const maxDuration = 60

// 한 호출에서 처리할 파일 상한 — Vercel 60s 내 안전한 범위 (LLM 1건 평균 15초 가정).
const MAX_FILES_PER_RUN = 3

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: { code: 'CRON_NOT_CONFIGURED' } }, { status: 503 })
  }
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const admin = createAdminClient()

  // 동기화 대상 폴더 — drive_folder_id 가 있고, last_synced_at 이 가장 오래된 순.
  const { data: folders, error } = await admin
    .from('folders')
    .select('id, workspace_id, drive_folder_id, last_synced_at, workspaces!inner(owner_id)')
    .not('drive_folder_id', 'is', null)
    .order('last_synced_at', { ascending: true, nullsFirst: true })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }

  const results: Array<{
    folder_id: string
    listed: number
    new_or_modified: number
    processed: number
    skipped: number
    errors: string[]
  }> = []

  let processedTotal = 0

  for (const folder of folders ?? []) {
    const userId = (folder as { workspaces: { owner_id: string } }).workspaces.owner_id
    const folderId = folder.id as string
    const driveId = folder.drive_folder_id as string
    const since = folder.last_synced_at ? new Date(folder.last_synced_at as string) : null

    const r: typeof results[number] = {
      folder_id: folderId,
      listed: 0,
      new_or_modified: 0,
      processed: 0,
      skipped: 0,
      errors: [],
    }
    results.push(r)

    try {
      const accessToken = await getValidAccessToken(userId)
      const files = await listFolderFiles(accessToken, driveId)
      r.listed = files.length

      const candidates = files.filter(f => {
        if (!since) return true
        return new Date(f.modifiedTime) > since
      })
      r.new_or_modified = candidates.length

      for (const file of candidates) {
        if (processedTotal >= MAX_FILES_PER_RUN) {
          r.skipped++
          continue
        }
        try {
          await processOne({
            adminClient: admin,
            workspaceId: folder.workspace_id as string,
            folderId,
            userId,
            accessToken,
            driveFileId: file.id,
            filename: file.name,
            mimeType: file.mimeType,
            sizeBytes: file.size ? Number(file.size) : null,
            driveModifiedAt: file.modifiedTime,
          })
          r.processed++
          processedTotal++
        } catch (e) {
          r.errors.push(`${file.name}: ${(e as Error).message}`)
        }
      }

      // last_synced_at 갱신 — 처리 못 한 파일이 남아도 일단 시간 표시.
      // (다음 cron 호출 때 modifiedTime 기준으로 다시 잡힘)
      await admin
        .from('folders')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', folderId)
    } catch (e) {
      r.errors.push((e as Error).message)
    }

    if (processedTotal >= MAX_FILES_PER_RUN) break
  }

  return NextResponse.json({
    ok: true,
    processed_total: processedTotal,
    folders_seen: results.length,
    results,
  })
}

// 처리 로직 — /api/files/process 와 동일. cron 컨텍스트라 user 세션 대신 admin client.
async function processOne(opts: {
  adminClient: ReturnType<typeof createAdminClient>
  workspaceId: string
  folderId: string
  userId: string
  accessToken: string
  driveFileId: string
  filename: string
  mimeType: string
  sizeBytes: number | null
  driveModifiedAt: string | null
}): Promise<void> {
  const { adminClient: admin } = opts

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
  if (pendingErr || !pending) throw new Error(pendingErr?.message ?? 'upsert 실패')
  const processedFileId = pending.id as string

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
      return
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

    await admin
      .from('processed_files')
      .update({
        parsed_text: parsed.text.slice(0, 200_000),
        parsing_completed_at: new Date().toISOString(),
        parsing_error: null,
        atom_count: extraction.atoms.length,
        relation_count: relRows.length,
      })
      .eq('id', processedFileId)
  } catch (e) {
    await admin
      .from('processed_files')
      .update({
        parsing_error: (e as Error).message.slice(0, 500),
        parsing_completed_at: new Date().toISOString(),
      })
      .eq('id', processedFileId)
  }
}
