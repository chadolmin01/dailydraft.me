import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import ProfilePageClient from '@/components/profile/ProfilePageClient'

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) redirect('/login')

  // 서버 프리페치 제거 — 클라이언트에서 React Query가 fetch
  // TTFB 1.2s → ~200ms로 개선 (스켈레톤 먼저 표시)
  return <ProfilePageClient />
}
