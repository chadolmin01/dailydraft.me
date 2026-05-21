import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import NotificationsPageClient from '@/components/notifications/NotificationsPageClient'

// 유저별 알림 목록이라 ISR 불가
export const dynamic = 'force-dynamic'

// NotificationsPage 클라이언트의 useQuery 키와 일치
const NOTIFICATIONS_FULL_KEY = ['notifications', 'full'] as const

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/notifications')

  const queryClient = new QueryClient()

  // /api/notifications?limit=50 과 동일 쿼리
  await queryClient.prefetchQuery({
    queryKey: NOTIFICATIONS_FULL_KEY,
    queryFn: async () => {
      const { data: notifications } = await supabase
        .from('event_notifications')
        .select(`
          *,
          startup_events (
            id, title, organizer, event_type,
            registration_end_date, registration_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      const unreadCount = (notifications || []).filter(n => n.status === 'unread').length
      return { notifications: notifications ?? [], unread_count: unreadCount }
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotificationsPageClient />
    </HydrationBoundary>
  )
}
