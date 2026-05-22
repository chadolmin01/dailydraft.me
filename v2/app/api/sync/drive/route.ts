// POST /api/sync/drive
//
// 매니저가 [지금 동기화] 클릭 시 수동 트리거.
// /api/cron/drive-sync 와 동일 로직이지만 본인 워크스페이스 한정 + user session 인증.

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { getOrCreateWorkspace } from '@/src/lib/workspace'
import { getValidAccessToken, GoogleAuthRequiredError } from '@/src/lib/google/tokens'
import { listFolderFiles } from '@/src/lib/google/drive'
import { downloadFile } from '@/src/lib/google/drive-download'
import { parseBuffer } from '@/src/lib/parsers/binary-parser'
import { extractFromText } from '@/glossary/pipeline/task_extractor'
import type { Json } from '@/src/types/database'

export const maxDuration = 60

const MAX_FILES_PER_RUN = 3

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const workspace = await getOrCreateWorkspace(supabase, user.id)
  const admin = createAdminClient()

  const { data: folders, error } = await admin
    .from('folders')
    .select('id, workspace_id, drive_folder_id, last_synced_at')
    .eq('workspace_id', workspace.id)
    .not('drive_folder_id', 'is', null)
    .order('last_synced_at', { ascending: true, nullsFirst: true })

  if (error) return ApiResponse.internalError(error.message)

  let accessToken: string
  try {
    accessToken = await getValidAccessToken(user.id)
  } catch (e) {
    if (e instanceof GoogleAuthRequiredError) {
      return NextResponse.json(
        { error: { code: 'GOOGLE_AUTH_REQUIRED', message: e.message } },
        { status: 401 },
      )
    }
    return ApiResponse.internalError((e as Error).message)
  }

  let processedTotal = 0
  const results: Array<{ folder_id: string; processed: number; errors: string[] }> = []

  for (const folder of folders ?? []) {
    const folderId = folder.id as string
    const driveId = folder.drive_folder_id as string
    const since = folder.last_synced_at ? new Date(folder.last_synced_at as string) : null

    const r = { folder_id: folderId, processed: 0, errors: [] as string[] }
    results.push(r)

    try {
      const files = await listFolderFiles(accessToken, driveId)
      const candidates = files.filter(f => (since ? new Date(f.modifiedTime) > since : true))

      for (const file of candidates) {
        if (processedTotal >= MAX_FILES_PER_RUN) break
        try {
          await processOne({
            admin,
            workspaceId: workspace.id,
            folderId,
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

async function processOne(opts: {
  admin: ReturnType<typeof createAdminClient>
  workspaceId: string
  folderId: string
  accessToken: string
  driveFileId: string
  filename: string
  mimeType: string
  sizeBytes: number | null
  driveModifiedAt: string | null
}): Promise<void> {
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
  if (pendingErr || !pending) throw new Error(pendingErr?.message ?? 'upsert 실패')
  const processedFileId = pending.id as string

  await admin.from('extracted_relations').delete().eq('processed_file_id', processedFileId)
  await admin.from('extracted_atoms').delete().eq('processed_file_id', processedFileId)

  try {
    const { buffer, effectiveMime } = await downloadFile(opts.accessToken, opts.driveFileId, opts.mimeType)
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
