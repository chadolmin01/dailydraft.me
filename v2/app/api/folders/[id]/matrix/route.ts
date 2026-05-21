import { type NextRequest } from 'next/server'

// 큰 Drive 폴더 + Sheets 조회 두 번 → Vercel 기본 10s 부족 가능.
export const maxDuration = 60
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse, isValidUUID } from '@/src/lib/api-utils'
import { getValidAccessToken, GoogleAuthRequiredError } from '@/src/lib/google/tokens'
import { listFolderFiles } from '@/src/lib/google/drive'
import { readRange } from '@/src/lib/google/sheets'
import { parseFilenames } from '@/src/lib/parsers/filename'
import { buildMatrix, parseRosterFromSheet, type ParsedDriveFile } from '@/src/lib/matrix'

// GET /api/folders/[id]/matrix
//   - 폴더의 Drive 파일 + (있으면) Sheets 명단을 실시간으로 가져와서 매트릭스 계산
//   - DB 캐싱 없음 (spec F4: 실시간 계산)
//   - 명단 시트 첫 열을 팀 명단으로 해석 (헤더 자동 skip)

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

    // 1) Drive 파일 목록 + 파싱
    const files = await listFolderFiles(accessToken, folder.drive_folder_id)
    const { parsed: parsedNames, unmatched } = parseFilenames(files.map(f => f.name))

    // parsedNames 와 원본 files 를 합쳐서 ParsedDriveFile[] 만들기
    const filesByName = new Map(files.map(f => [f.name, f]))
    const parsedFiles: ParsedDriveFile[] = parsedNames.map(({ name, parsed }) => {
      const file = filesByName.get(name)!
      return { id: file.id, name: file.name, modifiedTime: file.modifiedTime, parsed }
    })

    // 2) (있으면) Sheets 명단 — 첫 열만 사용
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

    // 3) 매트릭스 계산
    const matrix = buildMatrix({
      parsedFiles,
      rosterTeams,
      programStartDate: folder.program_start_date,
    })

    return ApiResponse.ok({
      folder: {
        id: folder.id,
        name: folder.name,
        program: folder.program,
        program_start_date: folder.program_start_date,
      },
      matrix,
      unmatched,
      rosterError,
    })
  } catch (e) {
    if (e instanceof GoogleAuthRequiredError) return ApiResponse.googleAuthRequired(e.message)
    return ApiResponse.internalError(`매트릭스 계산 실패: ${(e as Error).message}`)
  }
}
