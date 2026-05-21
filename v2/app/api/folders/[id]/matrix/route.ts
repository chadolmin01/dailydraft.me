import { type NextRequest } from 'next/server'

// 재귀 폴더 스캔 + Sheets 조회 → Vercel 기본 10s 부족 가능.
export const maxDuration = 60

import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse, isValidUUID } from '@/src/lib/api-utils'
import { getValidAccessToken, GoogleAuthRequiredError } from '@/src/lib/google/tokens'
import { listFolderFilesRecursive } from '@/src/lib/google/drive-recursive'
import { readRange } from '@/src/lib/google/sheets'
import { extractAtomsFromFile } from '@/src/lib/m6/extractor'
import { buildMatrix, parseRosterFromSheet, type FileWithAtoms } from '@/src/lib/matrix'

// GET /api/folders/[id]/matrix
//   - 재귀 폴더 스캔 → 각 File 에서 M6 Atom 추출 → 매트릭스 계산
//   - DB 캐싱 없음 (spec F4: 실시간)
//   - D8: filename + path 양쪽에서 deterministic 추출 (LLM X — D4)

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  if (!isValidUUID(id)) return ApiResponse.badRequest('잘못된 폴더 ID')

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { data: folder, error: folderError } = await supabase
    .from('folders')
    .select('id, name, drive_folder_id, sheet_id, program, program_start_date')
    .eq('id', id)
    .maybeSingle()

  if (folderError) return ApiResponse.internalError(folderError.message)
  if (!folder || !folder.drive_folder_id) return ApiResponse.notFound('폴더 없음')

  try {
    const accessToken = await getValidAccessToken(user.id)

    // 1) Drive 재귀 스캔
    const scan = await listFolderFilesRecursive(accessToken, folder.drive_folder_id)

    // 2) 각 File 에서 Atom 추출 → FileWithAtoms
    const filesWithAtoms: FileWithAtoms[] = scan.files.map(f => ({
      file_id: f.id,
      name: f.name,
      modifiedTime: f.modifiedTime,
      path: f.path,
      atoms: extractAtomsFromFile({ file_id: f.id, name: f.name, path: f.path }),
    }))

    // 3) (있으면) Sheets 명단
    let rosterTeams: string[] | undefined
    let rosterError: string | undefined
    if (folder.sheet_id) {
      try {
        const rows = await readRange(accessToken, folder.sheet_id, 'A:A')
        rosterTeams = parseRosterFromSheet(rows)
      } catch (e) {
        rosterError = (e as Error).message
      }
    }

    // 4) 매트릭스 계산
    const matrix = buildMatrix({
      files: filesWithAtoms,
      rosterTeams,
      programStartDate: folder.program_start_date,
    })

    // 미매칭 파일 — week 또는 team Atom 둘 중 하나 이상 없음
    const unmatchedFiles = filesWithAtoms
      .filter(f => !f.atoms.some(a => a.canonical_key?.startsWith('week:')) ||
                   !f.atoms.some(a => a.canonical_key?.startsWith('team:')))
      .map(f => {
        const hasWeek = f.atoms.some(a => a.canonical_key?.startsWith('week:'))
        const hasTeam = f.atoms.some(a => a.canonical_key?.startsWith('team:'))
        return {
          id: f.file_id,
          name: f.name,
          path: f.path,
          missing: [hasWeek ? null : '주차', hasTeam ? null : '팀'].filter(Boolean),
        }
      })

    return ApiResponse.ok({
      folder: {
        id: folder.id,
        name: folder.name,
        program: folder.program,
        program_start_date: folder.program_start_date,
      },
      matrix,
      unmatched_files: unmatchedFiles,
      scan: {
        truncated: scan.truncated,
        nodes_scanned: scan.nodes_scanned,
        max_depth_reached: scan.max_depth_reached,
      },
      rosterError,
    })
  } catch (e) {
    if (e instanceof GoogleAuthRequiredError) return ApiResponse.googleAuthRequired(e.message)
    return ApiResponse.internalError(`매트릭스 계산 실패: ${(e as Error).message}`)
  }
}
