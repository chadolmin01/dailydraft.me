import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { clubDetailKey, fetchClubDetail } from '@/src/lib/queries/club-queries'
import { DeckListShell } from '@/components/bundles/DeckListShell'

export const dynamic = 'force-dynamic'

export default async function DecksPage({
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
      <div className="max-w-[1200px] mx-auto px-5 py-6">
        <DeckListShell slug={slug} />
      </div>
    </HydrationBoundary>
  )
}
