// GET /api/atoms/export?folder_id=&format=json|csv
//
// 전체 추출 결과 다운로드 — atoms + relations + processed_files 메타.
// 의도: 매니저가 백업하거나 별도 시스템으로 옮기고 싶을 때.
// CSV 는 클라이언트에서 만드는 게 빠른데, JSON 은 relation 포함이라 서버에서 한 번에 묶음.

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

  // 1) 처리된 파일 목록
  let filesQuery = supabase
    .from('processed_files')
    .select('id, drive_file_id, filename, mime_type, parsing_completed_at, atom_count, relation_count')
    .eq('workspace_id', workspace.id)
    .not('parsing_completed_at', 'is', null)
  if (folderId) filesQuery = filesQuery.eq('folder_id', folderId)
  const { data: files, error: filesErr } = await filesQuery
  if (filesErr) return ApiResponse.internalError(filesErr.message)

  const fileIds = (files ?? []).map(f => f.id)

  // 2) atoms / relations (file 으로 필터)
  let atomsQuery = supabase
    .from('extracted_atoms')
    .select('id, processed_file_id, local_id, type, content, attributes, provenance, confidence')
    .eq('workspace_id', workspace.id)
  if (fileIds.length > 0) atomsQuery = atomsQuery.in('processed_file_id', fileIds)
  const { data: atoms, error: atomsErr } = await atomsQuery
  if (atomsErr) return ApiResponse.internalError(atomsErr.message)

  let relationsQuery = supabase
    .from('extracted_relations')
    .select('id, processed_file_id, from_atom_id, to_atom_id, type, confidence')
    .eq('workspace_id', workspace.id)
  if (fileIds.length > 0) relationsQuery = relationsQuery.in('processed_file_id', fileIds)
  const { data: relations, error: relErr } = await relationsQuery
  if (relErr) return ApiResponse.internalError(relErr.message)

  const payload = {
    $exported_at: new Date().toISOString(),
    $workspace_id: workspace.id,
    $folder_id: folderId ?? null,
    $glossary_version: '1.1',
    files: files ?? [],
    atoms: atoms ?? [],
    relations: relations ?? [],
  }

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const name = `draft_atoms_${date}.json`

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}"`,
    },
  })
}
