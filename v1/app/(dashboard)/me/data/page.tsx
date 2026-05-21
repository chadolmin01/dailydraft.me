import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { MyDataClient } from '@/components/me/MyDataClient'

/**
 * /me/data — 정보주체 권리 관리 페이지 (PIPA 35/36조).
 * 본인 데이터 JSON 다운로드 + 계정 삭제 신청.
 * 타이틀은 ROUTE_TITLES 에서 관리.
 */
export default async function MyDataPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/me/data')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname, deleted_at, data_consent, data_consent_at')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <MyDataClient
      email={user.email ?? ''}
      nickname={profile?.nickname ?? null}
      deletedAt={(profile as { deleted_at?: string | null } | null)?.deleted_at ?? null}
      dataConsent={profile?.data_consent ?? null}
      dataConsentAt={profile?.data_consent_at ?? null}
    />
  )
}
