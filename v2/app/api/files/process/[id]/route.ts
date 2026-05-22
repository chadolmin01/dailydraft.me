// GET /api/files/process/[id]
//
// 한 파일의 처리 결과 전체 — 메타 + 추출된 atom 리스트 + relation 리스트.
// FolderBrowser 의 Atom 상세 모달이 사용.

import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse, isValidUUID } from '@/src/lib/api-utils'
import { getOrCreateWorkspace } from '@/src/lib/workspace'

// DELETE /api/files/process/[id] — 처리 결과 삭제 (FK cascade 로 atoms/relations 함께 삭제)
// 의도: 매니저가 잘못 추출된 파일을 정리하거나 재처리 전 초기화.
export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { id } = await ctx.params
  if (!isValidUUID(id)) return ApiResponse.badRequest('id (uuid) 형식 오류')

  const workspace = await getOrCreateWorkspace(supabase, user.id)

  // 소유권 확인
  const { data: file } = await supabase
    .from('processed_files')
    .select('id')
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  if (!file) return ApiResponse.notFound('파일을 찾을 수 없습니다')

  // RLS 우회 — cascade 가 atom_relations/atoms 까지 처리.
  const admin = createAdminClient()
  const { error } = await admin.from('processed_files').delete().eq('id', id)
  if (error) return ApiResponse.internalError(error.message)

  return ApiResponse.ok({ id, deleted: true })
}

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { id } = await ctx.params
  if (!isValidUUID(id)) return ApiResponse.badRequest('id (uuid) 형식 오류')

  const workspace = await getOrCreateWorkspace(supabase, user.id)

  const { data: file, error: fileErr } = await supabase
    .from('processed_files')
    .select(
      'id, drive_file_id, filename, mime_type, size_bytes, drive_modified_at, parsing_completed_at, parsing_error, atom_count, relation_count, updated_at',
    )
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  if (fileErr) return ApiResponse.internalError(fileErr.message)
  if (!file) return ApiResponse.notFound('파일을 찾을 수 없습니다')

  const { data: atoms, error: atomsErr } = await supabase
    .from('extracted_atoms')
    .select('id, local_id, type, content, attributes, provenance, confidence')
    .eq('processed_file_id', id)
    .order('local_id', { ascending: true })
  if (atomsErr) return ApiResponse.internalError(atomsErr.message)

  const { data: relations, error: relErr } = await supabase
    .from('extracted_relations')
    .select('id, from_atom_id, to_atom_id, type, confidence')
    .eq('processed_file_id', id)
  if (relErr) return ApiResponse.internalError(relErr.message)

  return NextResponse.json({ file, atoms: atoms ?? [], relations: relations ?? [] })
}
