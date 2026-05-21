import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'

// DELETE /api/account
//   - PIPA 정보주체 권리 (개인정보 처리방침 §5) 의 "본인 정보 삭제" 자동화
//   - 매니저의 워크스페이스 + 폴더 + 채팅 + 토큰 + auth.users 전부 제거
//   - Google 권한 회수는 별도 (사용자가 Google 계정에서 직접) — 안내 텍스트로 남김

export async function DELETE() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()

  // 1) google_tokens (service_role 필요 — RLS 로 잠겨있음)
  const { error: tokenErr } = await admin
    .from('google_tokens')
    .delete()
    .eq('user_id', user.id)
  if (tokenErr) {
    console.error('[account delete] google_tokens 삭제 실패:', tokenErr)
  }

  // 2) workspaces (CASCADE 로 folders / chats 자동 정리)
  const { error: wsErr } = await admin
    .from('workspaces')
    .delete()
    .eq('owner_id', user.id)
  if (wsErr) {
    console.error('[account delete] workspaces 삭제 실패:', wsErr)
  }

  // 3) auth.users 자체 — Supabase service_role 의 admin.deleteUser
  const { error: authErr } = await admin.auth.admin.deleteUser(user.id)
  if (authErr) {
    return ApiResponse.internalError(`계정 삭제 실패: ${authErr.message}`)
  }

  // 4) 응답에 Google 권한 회수 안내 포함
  return ApiResponse.ok({
    deleted: true,
    google_revoke_url: 'https://myaccount.google.com/permissions',
    message: '계정 데이터가 모두 삭제되었습니다. Google 권한도 회수하시려면 위 링크에서 Draft 를 제거해 주세요.',
  })
}
