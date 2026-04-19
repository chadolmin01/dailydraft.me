import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import CohortArchiveClient from '@/components/club/CohortArchiveClient'

export const dynamic = 'force-dynamic'

export default async function CohortArchivePage({
  params,
}: {
  params: Promise<{ slug: string; cohort: string }>
}) {
  const { slug, cohort } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/clubs/${slug}/cohorts/${cohort}/archive`)

  const { data: club } = await supabase
    .from('clubs')
    .select('id, name')
    .eq('slug', slug)
    .maybeSingle()

  if (!club) redirect('/dashboard')

  const { data: membership } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership) redirect(`/clubs/${slug}`)

  return <CohortArchiveClient slug={slug} cohort={cohort} clubName={club.name} />
}
