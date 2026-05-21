import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import JoinClubClient from '@/components/club/JoinClubClient'

export const dynamic = 'force-dynamic'

export default async function ClubJoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ code?: string }>
}) {
  const { slug } = await params
  const { code } = await searchParams
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const next = encodeURIComponent(`/clubs/${slug}/join${code ? `?code=${encodeURIComponent(code)}` : ''}`)
    redirect(`/login?redirect=${next}`)
  }

  const { data: club } = await supabase
    .from('clubs')
    .select('id, name, description, logo_url, category')
    .eq('slug', slug)
    .maybeSingle()

  if (!club) redirect('/dashboard')

  const { count: memberCount = 0 } = await supabase
    .from('club_members')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', club.id)
    .eq('status', 'active')

  return <JoinClubClient slug={slug} initialCode={code ?? ''} club={{
    name: club.name,
    description: club.description,
    logo_url: club.logo_url,
    category: club.category,
    member_count: memberCount ?? 0,
  }} />
}
