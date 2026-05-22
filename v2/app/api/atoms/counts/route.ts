// GET /api/atoms/counts?folder_id=<uuid>
//
// 폴더(또는 워크스페이스 전체)에서 AtomType 별 카운트 + 처리된 파일 수.
// AtomDigest 가 카드 화면에 표시.

import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse, isValidUUID } from '@/src/lib/api-utils'
import { getOrCreateWorkspace } from '@/src/lib/workspace'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const folderId = request.nextUrl.searchParams.get('folder_id')
  if (folderId && !isValidUUID(folderId)) {
    return ApiResponse.badRequest('folder_id 형식 오류')
  }

  const workspace = await getOrCreateWorkspace(supabase, user.id)

  // 1) 처리된 파일 수 (folder_id 가 있으면 그 폴더로 한정)
  let pfQuery = supabase
    .from('processed_files')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspace.id)
    .not('parsing_completed_at', 'is', null)
  if (folderId) pfQuery = pfQuery.eq('folder_id', folderId)

  const { count: processedFiles, error: pfErr } = await pfQuery
  if (pfErr) return ApiResponse.internalError(pfErr.message)

  // 2) AtomType 별 카운트 — 클라이언트 집계 (Supabase 가 group by 직접 지원 X)
  let atomQuery = supabase
    .from('extracted_atoms')
    .select('type, processed_files!inner(folder_id)')
    .eq('workspace_id', workspace.id)
  if (folderId) atomQuery = atomQuery.eq('processed_files.folder_id', folderId)

  const { data: atoms, error: aErr } = await atomQuery
  if (aErr) return ApiResponse.internalError(aErr.message)

  const counts: Record<string, number> = {}
  for (const a of atoms ?? []) {
    counts[a.type] = (counts[a.type] ?? 0) + 1
  }
  const total = (atoms ?? []).length

  return NextResponse.json({
    processed_files: processedFiles ?? 0,
    total,
    counts,
  })
}
