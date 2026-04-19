import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import OperatorDashboardClient from '@/components/club/OperatorDashboardClient'

export const dynamic = 'force-dynamic'

export default async function OperatorDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/clubs/${slug}/operator`)

  const { data: club } = await supabase
    .from('clubs')
    .select('id, name')
    .eq('slug', slug)
    .maybeSingle()

  if (!club) redirect(`/clubs/${slug}`)

  const { data: membership } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .in('role', ['admin', 'owner'])
    .maybeSingle()

  if (!membership) redirect(`/clubs/${slug}`)

  return <OperatorDashboardClient slug={slug} clubName={club.name} />
}
