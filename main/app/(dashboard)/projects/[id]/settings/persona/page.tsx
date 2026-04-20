import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ProjectPersonaSettingsShell } from '@/components/persona/ProjectPersonaSettingsShell'

export const dynamic = 'force-dynamic'

export default async function ProjectPersonaSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 프로젝트 기본 정보 prefetch (제목·club 상속 체인용)
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: ['project-persona-meta', projectId],
    queryFn: async () => {
      const { data: opp } = await supabase
        .from('opportunities')
        .select('id, title, creator_id, club_id, clubs(id, slug, name)')
        .eq('id', projectId)
        .maybeSingle()
      return opp ?? null
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ProjectPersonaSettingsShell projectId={projectId} currentUserId={user?.id ?? null} />
      </div>
    </HydrationBoundary>
  )
}
