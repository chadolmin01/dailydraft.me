import { redirect } from 'next/navigation'
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import {
  profileKeys,
  portfolioKeys,
  opportunityKeys,
  universityVerificationKeys,
  fetchProfile,
  fetchPortfolioItems,
  fetchMyOpportunities,
  fetchUniversityVerification,
} from '@/src/lib/queries/profile-queries'
import ProfilePageClient from '@/components/profile/ProfilePageClient'

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  // getSession() = local JWT decode (fast), getUser() = network call (slow)
  // Middleware already validated auth, so session is safe to trust here
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) redirect('/login')

  const user = session.user

  const queryClient = new QueryClient()

  // Server-side parallel prefetch — queryKeys match client hooks exactly
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: profileKeys.detail(user.id),
      queryFn: () => fetchProfile(supabase, user.id),
    }),
    queryClient.prefetchQuery({
      queryKey: portfolioKeys.list(user.id),
      queryFn: () => fetchPortfolioItems(supabase, user.id),
    }),
    queryClient.prefetchQuery({
      queryKey: opportunityKeys.my(user.id),
      queryFn: () => fetchMyOpportunities(supabase, user.id),
    }),
    queryClient.prefetchQuery({
      queryKey: universityVerificationKeys.detail(user.id),
      queryFn: () => fetchUniversityVerification(supabase, user.id),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProfilePageClient />
    </HydrationBoundary>
  )
}
