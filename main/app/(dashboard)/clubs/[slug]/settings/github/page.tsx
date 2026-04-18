import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { clubDetailKey, fetchClubDetail } from '@/src/lib/queries/club-queries'
import { GitHubSettingsPanel } from '@/components/github/GitHubSettingsPanel'

export const dynamic = 'force-dynamic'

export default async function GitHubSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: clubDetailKey(slug),
    queryFn: () => fetchClubDetail(supabase, slug, user?.id ?? null),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GitHubSettingsPanel clubSlug={slug} />
    </HydrationBoundary>
  )
}
