import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import AssetsSettingsClient from '@/components/club/AssetsSettingsClient'

export const dynamic = 'force-dynamic'

export default async function ClubAssetsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/clubs/${slug}/settings/assets`)

  const { data: club } = await supabase
    .from('clubs')
    .select('id, name')
    .eq('slug', slug)
    .maybeSingle()

  if (!club) redirect(`/clubs/${slug}`)

  // 운영진(admin·owner)만 진입. 일반 멤버는 클럽 페이지로.
  const { data: membership } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .in('role', ['admin', 'owner'])
    .maybeSingle()

  if (!membership) redirect(`/clubs/${slug}`)

  return <AssetsSettingsClient slug={slug} clubName={club.name} />
}
