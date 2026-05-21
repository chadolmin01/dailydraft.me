import { type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { getOrCreateWorkspace } from '@/src/lib/workspace'

// GET /api/workspace
//   - 현재 매니저의 워크스페이스 정보 (1개 보장 — V1)

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const ws = await getOrCreateWorkspace(supabase, user.id)
  return ApiResponse.ok(ws)
}

// PATCH /api/workspace
//   - 워크스페이스 이름 수정 (V1 은 name 만)

interface PatchBody { name?: string }

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = (await request.json().catch(() => ({}))) as PatchBody
  const name = body.name?.trim()
  if (!name) return ApiResponse.badRequest('이름을 입력해 주세요')
  if (name.length > 60) return ApiResponse.badRequest('이름이 너무 깁니다 (최대 60자)')

  const ws = await getOrCreateWorkspace(supabase, user.id)
  const { data: updated, error } = await supabase
    .from('workspaces')
    .update({ name })
    .eq('id', ws.id)
    .select('id, name')
    .single()

  if (error) return ApiResponse.internalError(error.message)
  return ApiResponse.ok(updated)
}
