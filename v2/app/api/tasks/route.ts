// GET /api/tasks?folder_id=... — 워크스페이스 (또는 폴더) 의 업무 목록
// POST /api/tasks — 신규 업무 생성

import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse, isValidUUID } from '@/src/lib/api-utils'
import { getOrCreateWorkspace } from '@/src/lib/workspace'

const ALLOWED_STATUS = new Set(['backlog', 'in_progress', 'done'])

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const folderId = request.nextUrl.searchParams.get('folder_id')
  if (folderId && !isValidUUID(folderId)) {
    return ApiResponse.badRequest('folder_id 형식 오류')
  }

  const workspace = await getOrCreateWorkspace(supabase, user.id)

  let q = supabase
    .from('tasks')
    .select('id, folder_id, title, description, status, due_at, created_at, updated_at, completed_at, position')
    .eq('workspace_id', workspace.id)
    .order('status', { ascending: true })
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (folderId) q = q.eq('folder_id', folderId)

  const { data, error } = await q
  if (error) return ApiResponse.internalError(error.message)

  return NextResponse.json({ tasks: data ?? [] })
}

interface CreateBody {
  title?: string
  description?: string | null
  folder_id?: string | null
  status?: 'backlog' | 'in_progress' | 'done'
  due_at?: string | null
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = (await request.json().catch(() => ({}))) as CreateBody
  const title = body.title?.trim()
  if (!title) return ApiResponse.badRequest('title 이 필요합니다')
  if (title.length > 200) return ApiResponse.badRequest('title 은 200자 이내')
  if (body.status && !ALLOWED_STATUS.has(body.status)) {
    return ApiResponse.badRequest('status 가 잘못됨')
  }
  if (body.folder_id && !isValidUUID(body.folder_id)) {
    return ApiResponse.badRequest('folder_id 형식 오류')
  }

  const workspace = await getOrCreateWorkspace(supabase, user.id)

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      workspace_id: workspace.id,
      folder_id: body.folder_id ?? null,
      title,
      description: body.description?.trim() || null,
      status: body.status ?? 'backlog',
      due_at: body.due_at || null,
    })
    .select('id, folder_id, title, description, status, due_at, created_at, updated_at, completed_at, position')
    .single()

  if (error) return ApiResponse.internalError(error.message)
  return NextResponse.json(data)
}
