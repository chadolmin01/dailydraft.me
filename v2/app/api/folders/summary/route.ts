// GET /api/folders/summary
//
// 모든 폴더의 카드용 요약을 한 번에 반환 — N+1 카드별 쿼리 합산 후 cascade pop-in 제거.
// 의도: WorkspaceClient 가 단일 useQuery 만 가지게 하고, FolderCard 는 prop drilling 으로 받음.
// 반환: 각 폴더당 file_count + latest_modified + latest_name (Drive) + atom_count + processed_files_count (DB).

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { getOrCreateWorkspace } from '@/src/lib/workspace'
import { getValidAccessToken, GoogleAuthRequiredError } from '@/src/lib/google/tokens'
import { listFolderFiles } from '@/src/lib/google/drive'

// Vercel 기본 10s 가 N 폴더 × Drive list 합쳐서 부족할 수 있음.
export const maxDuration = 30

interface FolderSummary {
  folder_id: string
  /** Drive 호출 실패 시 null + drive_error */
  file_count: number | null
  latest_modified: string | null
  latest_name: string | null
  drive_error?: string
  /** 처리된 파일에서 추출된 atom 총합 (DB 집계) */
  atom_count: number
  processed_files_count: number
}

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const workspace = await getOrCreateWorkspace(supabase, user.id)

  // 1) 워크스페이스의 폴더 목록
  const { data: folders, error: folderErr } = await supabase
    .from('folders')
    .select('id, drive_folder_id')
    .eq('workspace_id', workspace.id)
  if (folderErr) return ApiResponse.internalError(folderErr.message)

  if (!folders || folders.length === 0) {
    return NextResponse.json({ summaries: [] })
  }

  // 2) atom + processed_files 카운트 — 단일 쿼리로 folder_id 별 집계.
  //    Postgres 의 group by 가 PostgREST 에서 까다로움 → 전체 가져와서 클라이언트 집계.
  const { data: atomRows } = await supabase
    .from('extracted_atoms')
    .select('processed_files!inner(folder_id)')
    .eq('workspace_id', workspace.id)
  const atomCountByFolder = new Map<string, number>()
  for (const r of atomRows ?? []) {
    const fid = (r as unknown as { processed_files: { folder_id: string } }).processed_files.folder_id
    atomCountByFolder.set(fid, (atomCountByFolder.get(fid) ?? 0) + 1)
  }

  const { data: pfRows } = await supabase
    .from('processed_files')
    .select('folder_id')
    .eq('workspace_id', workspace.id)
    .not('parsing_completed_at', 'is', null)
  const pfCountByFolder = new Map<string, number>()
  for (const r of pfRows ?? []) {
    if (r.folder_id) pfCountByFolder.set(r.folder_id, (pfCountByFolder.get(r.folder_id) ?? 0) + 1)
  }

  // 3) Drive stats — 폴더당 1 호출. 토큰 갱신은 1회만.
  let accessToken: string | null = null
  try {
    accessToken = await getValidAccessToken(user.id)
  } catch (e) {
    if (e instanceof GoogleAuthRequiredError) {
      // Drive 권한 없어도 DB 통계는 반환 (UI 가 graceful 표시)
    } else {
      return ApiResponse.internalError((e as Error).message)
    }
  }

  const summaries: FolderSummary[] = await Promise.all(
    folders.map(async (f): Promise<FolderSummary> => {
      const base = {
        folder_id: f.id,
        atom_count: atomCountByFolder.get(f.id) ?? 0,
        processed_files_count: pfCountByFolder.get(f.id) ?? 0,
        file_count: null as number | null,
        latest_modified: null as string | null,
        latest_name: null as string | null,
      }
      if (!f.drive_folder_id || !accessToken) {
        return { ...base, drive_error: accessToken ? 'Drive 폴더 ID 없음' : 'Google 권한 없음' }
      }
      try {
        const files = await listFolderFiles(accessToken, f.drive_folder_id)
        const latest = files.reduce<typeof files[0] | null>((best, file) => {
          if (!best) return file
          return file.modifiedTime > best.modifiedTime ? file : best
        }, null)
        return {
          ...base,
          file_count: files.length,
          latest_modified: latest?.modifiedTime ?? null,
          latest_name: latest?.name ?? null,
        }
      } catch (e) {
        return { ...base, drive_error: (e as Error).message.slice(0, 100) }
      }
    }),
  )

  return NextResponse.json({ summaries })
}
