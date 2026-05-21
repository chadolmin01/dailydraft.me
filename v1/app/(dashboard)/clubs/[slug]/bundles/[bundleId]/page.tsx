import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { clubDetailKey, fetchClubDetail } from '@/src/lib/queries/club-queries'
import { BundleDetailShell } from '@/components/bundles/BundleDetailShell'

export const dynamic = 'force-dynamic'

export default async function BundleDetailPage({
  params,
}: {
  params: Promise<{ slug: string; bundleId: string }>
}) {
  const { slug, bundleId } = await params
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
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <BundleDetailShell slug={slug} bundleId={bundleId} />
      </div>
    </HydrationBoundary>
  )
}
