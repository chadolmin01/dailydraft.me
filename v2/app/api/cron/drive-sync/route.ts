// GET /api/cron/drive-sync
//
// Vercel cron 호출용. 각 워크스페이스의 폴더를 순회하면서
// Drive 의 modifiedTime 이 last_synced_at 이후인 파일을 찾아 processDriveFile 위임.
//
// 보안: 헤더 `Authorization: Bearer <CRON_SECRET>` 일치 시만 실행.

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { getValidAccessToken } from '@/src/lib/google/tokens'
import { listFolderFiles } from '@/src/lib/google/drive'
import { processDriveFile } from '@/src/lib/m6/process-pipeline'

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

      const candidates = files.filter(f => (since ? new Date(f.modifiedTime) > since : true))
      r.new_or_modified = candidates.length

      for (const file of candidates) {
        if (processedTotal >= MAX_FILES_PER_RUN) {
          r.skipped++
          continue
        }
        try {
          await processDriveFile({
            admin,
            workspaceId: folder.workspace_id as string,
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
