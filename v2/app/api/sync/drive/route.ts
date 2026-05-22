// POST /api/sync/drive
//
// 매니저 수동 트리거 ([지금 동기화] 버튼).
// cron 과 동일 로직이지만 본인 워크스페이스 한정 + user session 인증.

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { getOrCreateWorkspace } from '@/src/lib/workspace'
import { getValidAccessToken, GoogleAuthRequiredError } from '@/src/lib/google/tokens'
import { listFolderFiles } from '@/src/lib/google/drive'
import { processDriveFile } from '@/src/lib/m6/process-pipeline'

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
          await processDriveFile({
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
