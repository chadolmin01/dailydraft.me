import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { NextResponse } from 'next/server'

// GET /api/account/export
//   - PIPA + GDPR 정보 이동권 — 매니저의 모든 데이터를 JSON 으로 다운로드.
//   - 워크스페이스, 폴더, 채팅 기록, Google 토큰 메타 (실제 토큰 값은 제외)
//   - Content-Disposition: attachment 로 즉시 다운로드

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()

  // 워크스페이스 (보통 1개)
  const { data: workspaces } = await admin
    .from('workspaces')
    .select('id, name, created_at, updated_at')
    .eq('owner_id', user.id)

  const workspaceIds = (workspaces ?? []).map(w => w.id)

  // 폴더
  const { data: folders } = await admin
    .from('folders')
    .select('id, workspace_id, name, drive_folder_id, sheet_id, program, program_start_date, created_at, updated_at')
    .in('workspace_id', workspaceIds.length > 0 ? workspaceIds : ['00000000-0000-0000-0000-000000000000'])

  // 채팅 (시스템 turn 도 포함, sensitive tool 결과는 그대로 — 본인 데이터)
  const { data: chats } = await admin
    .from('chats')
    .select('id, workspace_id, folder_id, role, content, created_at')
    .in('workspace_id', workspaceIds.length > 0 ? workspaceIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: true })

  // Google 토큰 메타 — 실제 토큰 값은 보안상 제외
  const { data: tokens } = await admin
    .from('google_tokens')
    .select('google_email, scope, expires_at, created_at, updated_at')
    .eq('user_id', user.id)

  const payload = {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    workspaces: workspaces ?? [],
    folders: folders ?? [],
    chats: chats ?? [],
    google_tokens_meta: tokens ?? [],
    note: '본 export 는 매니저가 Draft 에 저장한 모든 데이터입니다. Google 토큰 값은 보안상 제외됐습니다 (메타데이터만). Google Drive 자체의 파일은 별도로 Google 계정에서 관리하십시오.',
  }

  const json = JSON.stringify(payload, null, 2)
  const filename = `draft-export-${new Date().toISOString().slice(0, 10)}.json`

  return new NextResponse(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
