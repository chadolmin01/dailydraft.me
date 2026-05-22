// PATCH /api/tasks/[id] — 상태/제목/마감 수정
// DELETE /api/tasks/[id]

import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse, isValidUUID } from '@/src/lib/api-utils'
import { getOrCreateWorkspace } from '@/src/lib/workspace'

const ALLOWED_STATUS = new Set(['backlog', 'in_progress', 'done'])

interface PatchBody {
  title?: string
  description?: string | null
  status?: 'backlog' | 'in_progress' | 'done'
  due_at?: string | null
  folder_id?: string | null
  position?: number
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { id } = await ctx.params
  if (!isValidUUID(id)) return ApiResponse.badRequest('id 형식 오류')

  const body = (await request.json().catch(() => ({}))) as PatchBody
  if (body.status && !ALLOWED_STATUS.has(body.status)) {
    return ApiResponse.badRequest('status 가 잘못됨')
  }
  if (body.folder_id && !isValidUUID(body.folder_id)) {
    return ApiResponse.badRequest('folder_id 형식 오류')
  }
  if (body.title !== undefined) {
    const trimmed = body.title.trim()
    if (!trimmed || trimmed.length > 200) return ApiResponse.badRequest('title 1~200자')
  }

  const workspace = await getOrCreateWorkspace(supabase, user.id)

  // 동적 update payload
  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.description !== undefined) updates.description = body.description?.trim() || null
  if (body.status !== undefined) updates.status = body.status
  if (body.due_at !== undefined) updates.due_at = body.due_at || null
  if (body.folder_id !== undefined) updates.folder_id = body.folder_id || null
  if (body.position !== undefined) updates.position = body.position
  if (Object.keys(updates).length === 0) return ApiResponse.badRequest('수정 항목 없음')

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .select('id, folder_id, title, description, status, due_at, created_at, updated_at, completed_at, position')
    .maybeSingle()

  if (error) return ApiResponse.internalError(error.message)
  if (!data) return ApiResponse.notFound('업무를 찾을 수 없습니다')
  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { id } = await ctx.params
  if (!isValidUUID(id)) return ApiResponse.badRequest('id 형식 오류')

  const workspace = await getOrCreateWorkspace(supabase, user.id)

  const { error, count } = await supabase
    .from('tasks')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('workspace_id', workspace.id)

  if (error) return ApiResponse.internalError(error.message)
  if (!count) return ApiResponse.notFound('업무를 찾을 수 없습니다')
  return ApiResponse.ok({ id, deleted: true })
}
