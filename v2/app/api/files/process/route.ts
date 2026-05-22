// POST /api/files/process
//   body: { folder_id: uuid, drive_file_id, filename, mime_type, size_bytes?, drive_modified_at? }
//
// 흐름: Drive 바이너리 다운로드 → 텍스트 파싱 → M6 task_extractor → DB 저장.
// 의도: 매니저가 파일 행에서 "처리하기" 클릭하거나 cron 이 호출.
// 멱등: 같은 (workspace_id, drive_file_id) 면 update (재처리).

import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse, isValidUUID } from '@/src/lib/api-utils'
import { getOrCreateWorkspace } from '@/src/lib/workspace'
import { getValidAccessToken, GoogleAuthRequiredError } from '@/src/lib/google/tokens'
import { downloadFile } from '@/src/lib/google/drive-download'
import { parseBuffer } from '@/src/lib/parsers/binary-parser'
import { extractFromText } from '@/glossary/pipeline/task_extractor'
import type { Json } from '@/src/types/database'

// Vercel 기본 10s → 파싱 + LLM 호출 합쳐서 부족할 수 있음.
export const maxDuration = 60

interface Body {
  folder_id?: string
  drive_file_id?: string
  filename?: string
  mime_type?: string
  size_bytes?: number
  drive_modified_at?: string
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = (await request.json().catch(() => ({}))) as Body
  const { folder_id, drive_file_id, filename, mime_type } = body

  if (!folder_id || !isValidUUID(folder_id)) {
    return ApiResponse.badRequest('folder_id (uuid) 가 필요합니다')
  }
  if (!drive_file_id || !filename || !mime_type) {
    return ApiResponse.badRequest('drive_file_id, filename, mime_type 가 필요합니다')
  }

  const workspace = await getOrCreateWorkspace(supabase, user.id)

  // 폴더가 본인 워크스페이스 소유인지 확인 — RLS 우회 차단.
  const { data: folder, error: folderErr } = await supabase
    .from('folders')
    .select('id, workspace_id')
    .eq('id', folder_id)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  if (folderErr) return ApiResponse.internalError(folderErr.message)
  if (!folder) return ApiResponse.notFound('해당 폴더를 찾을 수 없습니다')

  // service_role 로 처리 — RLS 우회 + 길게 걸리는 작업이라 트랜잭션 짧게.
  const admin = createAdminClient()

  // pending 행 upsert — 처리 중 표시.
  const pendingPayload = {
    workspace_id: workspace.id,
    folder_id,
    drive_file_id,
    filename,
    mime_type,
    size_bytes: body.size_bytes ?? null,
    drive_modified_at: body.drive_modified_at ?? null,
    parsed_text: null,
    parsing_completed_at: null,
    parsing_error: null,
    atom_count: 0,
    relation_count: 0,
    updated_at: new Date().toISOString(),
  }
  const { data: pending, error: pendingErr } = await admin
    .from('processed_files')
    .upsert(pendingPayload, { onConflict: 'workspace_id,drive_file_id' })
    .select('id')
    .single()
  if (pendingErr || !pending) return ApiResponse.internalError(pendingErr?.message ?? 'upsert 실패')

  const processedFileId = pending.id as string

  // 재처리면 기존 atom/relation 삭제
  await admin.from('extracted_relations').delete().eq('processed_file_id', processedFileId)
  await admin.from('extracted_atoms').delete().eq('processed_file_id', processedFileId)

  // 다운로드 + 파싱 + 추출. 각 단계 실패는 parsing_error 에 저장 + 200 반환.
  // (UI 가 에러 메시지를 카드로 보여줄 수 있게)
  try {
    const accessToken = await getValidAccessToken(user.id)
    const { buffer, effectiveMime } = await downloadFile(accessToken, drive_file_id, mime_type)
    const parsed = await parseBuffer(buffer, effectiveMime)

    if (!parsed.text.trim()) {
      await admin
        .from('processed_files')
        .update({
          parsing_error: '추출된 텍스트가 비어 있습니다',
          parsing_completed_at: new Date().toISOString(),
        })
        .eq('id', processedFileId)
      return ApiResponse.ok({
        id: processedFileId,
        status: 'empty',
        error: '텍스트를 추출하지 못했습니다',
      })
    }

    // LLM 추출 — Haiku 4.5, prompt cache.
    const extraction = await extractFromText(parsed.text, drive_file_id)

    // Atom insert. local_id → DB uuid 매핑 보관 → relation 에서 사용.
    const atomRows = extraction.atoms.map(a => ({
      workspace_id: workspace.id,
      processed_file_id: processedFileId,
      local_id: a.id,
      type: a.type,
      content: a.content,
      // 의도: Record<string, unknown> 은 Supabase Json 과 다른 generic 이라 cast 필요.
      // 런타임은 JSON serializable (extractor 가 보장).
      attributes: a.attributes as unknown as Json,
      provenance: a.provenance as unknown as Json,
      confidence: a.confidence,
    }))

    const localToDbId = new Map<string, string>()
    if (atomRows.length > 0) {
      const { data: insertedAtoms, error: atomErr } = await admin
        .from('extracted_atoms')
        .insert(atomRows)
        .select('id, local_id')
      if (atomErr) throw new Error(`atom insert: ${atomErr.message}`)
      for (const row of insertedAtoms ?? []) {
        localToDbId.set(row.local_id, row.id)
      }
    }

    const relationRows = extraction.relations
      .map(r => {
        const fromId = localToDbId.get(r.from)
        const toId = localToDbId.get(r.to)
        if (!fromId || !toId) return null
        return {
          workspace_id: workspace.id,
          processed_file_id: processedFileId,
          from_atom_id: fromId,
          to_atom_id: toId,
          type: r.type,
          confidence: r.confidence,
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)

    if (relationRows.length > 0) {
      const { error: relErr } = await admin.from('extracted_relations').insert(relationRows)
      if (relErr) throw new Error(`relation insert: ${relErr.message}`)
    }

    await admin
      .from('processed_files')
      .update({
        parsed_text: parsed.text.slice(0, 200_000), // 200KB 컷 — DB 부담 방지
        parsing_completed_at: new Date().toISOString(),
        parsing_error: null,
        atom_count: extraction.atoms.length,
        relation_count: relationRows.length,
      })
      .eq('id', processedFileId)

    return ApiResponse.ok({
      id: processedFileId,
      status: 'ok',
      atoms: extraction.atoms.length,
      relations: relationRows.length,
      validation: extraction.validation,
      parsing_meta: parsed.meta ?? null,
    })
  } catch (e) {
    if (e instanceof GoogleAuthRequiredError) {
      // 토큰 만료는 422 가 아니라 401 + 코드. 클라이언트가 재인증 트리거.
      return NextResponse.json(
        { error: { code: 'GOOGLE_AUTH_REQUIRED', message: e.message } },
        { status: 401 },
      )
    }
    const msg = (e as Error).message
    await admin
      .from('processed_files')
      .update({
        parsing_error: msg.slice(0, 500),
        parsing_completed_at: new Date().toISOString(),
      })
      .eq('id', processedFileId)
    return ApiResponse.ok({ id: processedFileId, status: 'failed', error: msg })
  }
}

// GET /api/files/process?folder_id=... — 해당 폴더의 처리 결과 목록.
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const folderId = request.nextUrl.searchParams.get('folder_id')
  if (!folderId || !isValidUUID(folderId)) {
    return ApiResponse.badRequest('folder_id (uuid) 가 필요합니다')
  }

  const workspace = await getOrCreateWorkspace(supabase, user.id)

  const { data, error } = await supabase
    .from('processed_files')
    .select('id, drive_file_id, filename, mime_type, parsing_completed_at, parsing_error, atom_count, relation_count, updated_at')
    .eq('workspace_id', workspace.id)
    .eq('folder_id', folderId)
    .order('updated_at', { ascending: false })

  if (error) return ApiResponse.internalError(error.message)
  return ApiResponse.ok({ files: data ?? [] })
}
