// GET /api/atoms/search?folder_id=&type=&keyword=&limit=
//
// 워크스페이스의 extracted_atoms 검색. AtomDigest 탭이 사용.
// (챗봇은 src/lib/anthropic/tools.ts 의 search_extracted_atoms 를 거치므로 별도)

import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse, isValidUUID } from '@/src/lib/api-utils'
import { getOrCreateWorkspace } from '@/src/lib/workspace'

const ALLOWED_TYPES = new Set([
  'Requirement', 'Deadline', 'Constraint', 'Deliverable',
  'Metric', 'Narrative', 'Event', 'Question', 'Decision',
  'Reference', 'Definition', 'Entity',
])

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const sp = request.nextUrl.searchParams
  const folderId = sp.get('folder_id')
  const type = sp.get('type')
  const keyword = sp.get('keyword')
  const limit = Math.min(100, Math.max(1, Number(sp.get('limit') ?? 30)))

  if (folderId && !isValidUUID(folderId)) {
    return ApiResponse.badRequest('folder_id 형식 오류')
  }
  if (type && !ALLOWED_TYPES.has(type)) {
    return ApiResponse.badRequest('알 수 없는 type 값')
  }

  const workspace = await getOrCreateWorkspace(supabase, user.id)

  let q = supabase
    .from('extracted_atoms')
    .select(
      'id, local_id, type, content, attributes, provenance, confidence, processed_file_id, processed_files!inner(id, filename, folder_id)',
    )
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (type) q = q.eq('type', type)
  if (keyword) q = q.ilike('content', `%${keyword.replace(/[%_]/g, '\\$&')}%`)
  if (folderId) q = q.eq('processed_files.folder_id', folderId)

  const { data, error } = await q
  if (error) return ApiResponse.internalError(error.message)

  return NextResponse.json({
    count: data?.length ?? 0,
    filter: { type, keyword, folder_id: folderId },
    atoms: (data ?? []).map((r) => {
      const pf = (r as unknown as { processed_files: { id: string; filename: string; folder_id: string } }).processed_files
      const prov = r.provenance as { source?: { raw_text?: string; location?: string } } | null
      return {
        local_id: r.local_id,
        type: r.type,
        content: r.content,
        confidence: r.confidence,
        attributes: r.attributes,
        raw_text: prov?.source?.raw_text ?? null,
        location: prov?.source?.location ?? null,
        from_file: { processed_file_id: pf.id, filename: pf.filename, folder_id: pf.folder_id },
      }
    }),
  })
}
